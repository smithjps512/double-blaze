import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { getOwnedProject } from "@/lib/portal";
import { runIntakeTurn, isAnthropicConfigured } from "@/lib/spark";
import { generateBriefForProject } from "@/lib/brief-service";
import type { AnthropicMessage } from "@/lib/anthropic";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface SparkBody {
  projectId?: string;
  message?: string;
}

/**
 * Spark intake turn endpoint (spec section 6). Drives the conversational intake
 * for the signed-in client's project, persisting the transcript and structured
 * captured fields to intake_sessions on every turn. When enough is captured,
 * assembles the brief (idempotently).
 *
 * Guardrails:
 * - If ANTHROPIC_API_KEY is missing, returns a graceful disabled state (200) so
 *   the build and public site are unaffected.
 * - The project is scoped to the caller's organization; cross-org access 404s.
 * - We never log full transcripts.
 */
export async function POST(req: Request) {
  // Graceful disabled state when Spark is not configured.
  if (!isAnthropicConfigured()) {
    return NextResponse.json({ disabled: true });
  }

  let body: SparkBody;
  try {
    body = (await req.json()) as SparkBody;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const projectId = body.projectId?.trim();
  if (!projectId) {
    return NextResponse.json({ error: "Missing project." }, { status: 400 });
  }

  const owned = await getOwnedProject(projectId);
  if (!owned) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const { project } = owned;
  if (!project.catalog_key) {
    return NextResponse.json(
      { error: "This project has no offering to scope yet." },
      { status: 409 },
    );
  }

  const db = getSupabaseServiceClient();
  if (!db) {
    return NextResponse.json({ disabled: true });
  }

  // Load existing intake state for this project.
  const { data: session } = await db
    .from("intake_sessions")
    .select("transcript, captured, status")
    .eq("project_id", project.id)
    .maybeSingle();

  const transcript: AnthropicMessage[] = Array.isArray(session?.transcript)
    ? (session!.transcript as AnthropicMessage[])
    : [];
  const known: Record<string, unknown> =
    (session?.captured as Record<string, unknown> | undefined) ?? {};

  const userMessage = (body.message ?? "").trim();

  const result = await runIntakeTurn({
    catalogKey: project.catalog_key,
    history: transcript,
    userMessage,
    known,
  });

  if (!result) {
    return NextResponse.json(
      { error: "Spark could not respond. Please try again." },
      { status: 502 },
    );
  }

  // Append this turn to the transcript (user message, then Spark's reply).
  const newTranscript: AnthropicMessage[] = [...transcript];
  if (userMessage) newTranscript.push({ role: "user", content: userMessage });
  newTranscript.push({ role: "assistant", content: result.reply });

  await db.from("intake_sessions").upsert(
    {
      project_id: project.id,
      catalog_key: project.catalog_key,
      transcript: newTranscript,
      captured: result.captured,
      status: result.readyForBrief ? "complete" : "in_progress",
    },
    { onConflict: "project_id" },
  );

  if (result.readyForBrief) {
    const gen = await generateBriefForProject({ project, captured: result.captured });
    if (gen.ok) {
      return NextResponse.json({
        reply: result.reply,
        captured: result.captured,
        readyForBrief: true,
        briefReady: true,
      });
    }
    // Brief assembly failed; keep the conversation going gracefully.
    return NextResponse.json({
      reply:
        result.reply +
        "\n\nI have what I need. We are putting your brief together and will have it ready shortly.",
      captured: result.captured,
      readyForBrief: true,
      briefReady: false,
    });
  }

  return NextResponse.json({
    reply: result.reply,
    captured: result.captured,
    readyForBrief: false,
  });
}
