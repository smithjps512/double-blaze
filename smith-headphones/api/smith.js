// Smith's brain. This is the only code that runs on a server (Vercel).
// The phone sends what it heard, this function asks Claude, and it sends back
// what Smith should say plus any actions (play music, set a timer, and so on).
//
// The API key lives only here, in the ANTHROPIC_API_KEY environment variable.
// It never goes to the phone. Nothing is saved: no logs, no database.

import fs from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";

// "fast" is the default. "smart" is slower but thinks harder.
const MODELS = {
  fast: process.env.SMITH_MODEL || "claude-haiku-4-5-20251001",
  smart: process.env.SMITH_SMART_MODEL || "claude-sonnet-5-5",
};

// Read once when the function starts. Edit the file and redeploy to change Smith.
const PERSONALITY = fs.readFileSync(
  path.join(process.cwd(), "smith-personality.txt"),
  "utf8",
);

// Rules about the app itself. These stay in code so students can focus on
// personality in smith-personality.txt without breaking the buttons.
function appRules(contactNames) {
  return [
    "How the headphones work:",
    "You can control a built in music player, set one timer, start phone calls, and send text messages by using your tools.",
    "When you use a tool, also say one short sentence about what you are doing, like: Here comes some music!",
    "For calls and texts, use the tool right away. Do not ask for confirmation yourself; the headphones will ask the student.",
    `Contacts you can call or text: ${contactNames.length ? contactNames.join(", ") : "none"}.`,
    "If someone asks to call or text a person who is not on that list, do not use a tool. Say you could not find them in the contacts.",
    "For timers, convert the time to seconds. To cancel a timer, set it to 0 seconds.",
  ].join("\n");
}

const TOOLS = [
  {
    name: "play_music",
    description:
      "Start or resume the headphones' built in music player. Use for: play music, play a song, resume, unpause.",
    input_schema: {
      type: "object",
      properties: {
        song: {
          type: "string",
          description: "Song name if the student asked for a specific one. Leave out to play any song.",
        },
      },
    },
  },
  {
    name: "pause_music",
    description: "Pause or stop the music player.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "next_song",
    description: "Skip to the next song in the playlist.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "set_volume",
    description:
      "Change the music volume. Use direction up or down for louder or quieter, or set with a level from 0 to 100.",
    input_schema: {
      type: "object",
      properties: {
        direction: { type: "string", enum: ["up", "down", "set"] },
        level: { type: "integer", minimum: 0, maximum: 100, description: "Only used when direction is set." },
      },
      required: ["direction"],
    },
  },
  {
    name: "set_timer",
    description: "Start a countdown timer. Only one timer runs at a time. Use 0 seconds to cancel it.",
    input_schema: {
      type: "object",
      properties: {
        seconds: { type: "integer", minimum: 0, maximum: 86400 },
        label: { type: "string", description: "Short name for the timer, like pizza or homework." },
      },
      required: ["seconds"],
    },
  },
  {
    name: "start_call",
    description: "Start a phone call to someone in the contacts list.",
    input_schema: {
      type: "object",
      properties: { contact: { type: "string", description: "Contact name exactly as it appears in the list." } },
      required: ["contact"],
    },
  },
  {
    name: "send_text",
    description: "Send a text message to someone in the contacts list.",
    input_schema: {
      type: "object",
      properties: {
        contact: { type: "string", description: "Contact name exactly as it appears in the list." },
        message: { type: "string", description: "The message to send, written the way the student said it." },
      },
      required: ["contact", "message"],
    },
  },
];

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from the environment

// Spoken text should never contain symbols a voice would read out loud.
function cleanForSpeech(text) {
  return text
    .replace(/[\u2014\u2013]/g, ", ") // long dashes become pauses
    .replace(/[*#_`~>|]/g, "")
    .replace(/\p{Extended_Pictographic}|️/gu, "")
    .replace(/\s+([,.!?])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// Accept only a short, well formed history from the phone.
function cleanHistory(history) {
  if (!Array.isArray(history)) return [];
  const turns = history
    .filter(
      (m) =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim(),
    )
    .slice(-8)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 600) }));
  while (turns.length && turns[0].role !== "user") turns.shift();
  return turns;
}

function reply(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

export default async function handler(req, res) {
  if (req.method !== "POST") return reply(res, 405, { say: "Smith only answers POST requests." });

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};

  // Optional class passcode so strangers who find the link cannot spend your API credits.
  const passcode = process.env.SMITH_PASSCODE;
  if (passcode && body.passcode !== passcode) {
    return reply(res, 401, {
      error: "passcode",
      say: "I need the class passcode first. Open settings and type it in.",
    });
  }

  const text = typeof body.text === "string" ? body.text.trim().slice(0, 500) : "";
  if (!text) return reply(res, 400, { say: "I did not hear anything. Try again?" });

  const contactNames = Array.isArray(body.contacts)
    ? body.contacts.filter((n) => typeof n === "string").slice(0, 20).map((n) => n.slice(0, 40))
    : [];

  const modelKey = body.model === "smart" ? "smart" : "fast";
  const model = MODELS[modelKey];
  const messages = [...cleanHistory(body.history), { role: "user", content: text }];

  const request = {
    model,
    max_tokens: modelKey === "smart" ? 2000 : 400,
    system: `${PERSONALITY}\n\n${appRules(contactNames)}`,
    tools: TOOLS,
    messages,
  };

  try {
    let response;
    if (model === "claude-sonnet-5-5") {
      // The smart model thinks before answering. Low effort keeps it quick enough
      // for voice. If its safety filter declines, the API retries on a fallback model.
      response = await client.beta.messages.create({
        ...request,
        output_config: { effort: "low" },
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
      });
    } else {
      response = await client.messages.create(request);
    }

    if (response.stop_reason === "refusal") {
      return reply(res, 200, { say: "Let's talk about something else. Want to hear a joke?", actions: [] });
    }

    const say = cleanForSpeech(
      response.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join(" "),
    );
    const actions = response.content
      .filter((b) => b.type === "tool_use")
      .map((b) => ({ name: b.name, input: b.input || {} }));

    return reply(res, 200, { say, actions, model: response.model });
  } catch (error) {
    // Log only the error type, never what the student said.
    console.error("Claude request failed:", error?.status, error?.name);
    if (error instanceof Anthropic.AuthenticationError) {
      return reply(res, 500, { say: "My brain key is not set up. Ask your teacher to check the API key." });
    }
    if (error instanceof Anthropic.RateLimitError) {
      return reply(res, 429, { say: "Whoa, too many questions at once. Give me a few seconds." });
    }
    if (error instanceof Anthropic.APIConnectionError) {
      return reply(res, 502, { say: "I cannot reach my brain right now. Check the internet connection." });
    }
    return reply(res, 500, { say: "Oops, something went wrong in my brain. Try again?" });
  }
}
