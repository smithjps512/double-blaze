import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { isClerkEnabled } from "@/lib/auth";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { isAnthropicConfigured, runIntakeReply, extractCaptured } from "@/lib/spark";
import {
  getAppUserOrg,
  ensureBuild,
  loadIntake,
  saveIntake,
} from "@/lib/trail-run-build";
import type { AnthropicMessage } from "@/lib/anthropic";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface SparkBody {
  /** The client's latest message. Empty or absent begins the intake. */
  message?: string;
}

/**
 * One Trail Run intake turn for the signed-in client. Resumable: the transcript
 * and captured fields are persisted to the build's intake session each turn, so
 * a client can leave and return. Spark runs server-side; the API key never
 * reaches the browser.
 */
export async function POST(req: Request) {
  if (!isClerkEnabled) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const db = getSupabaseServiceClient();
  if (!db) {
    return NextResponse.json({ error: "Not available." }, { status: 503 });
  }
  if (!isAnthropicConfigured()) {
    return NextResponse.json(
      { error: "Intake is not available right now. Please check back soon." },
      { status: 503 },
    );
  }

  let body: SparkBody;
  try {
    body = (await req.json()) as SparkBody;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const message = body.message?.trim() ?? "";

  const appUser = await getAppUserOrg(db, userId);
  if (!appUser?.organizationId) {
    return NextResponse.json({ error: "No organization found." }, { status: 403 });
  }

  const build = await ensureBuild(db, appUser.organizationId);
  if (!build) {
    return NextResponse.json(
      { error: "Trail Run intake is not available for this account." },
      { status: 409 },
    );
  }

  const intake = await loadIntake(db, build.projectId);

  const reply = await runIntakeReply({ history: intake.transcript, userMessage: message });
  if (!reply) {
    return NextResponse.json(
      { error: "Spark is unavailable right now. Please try again." },
      { status: 502 },
    );
  }

  const transcript: AnthropicMessage[] = [...intake.transcript];
  if (message) transcript.push({ role: "user", content: message });
  transcript.push({ role: "assistant", content: reply });

  const capture = await extractCaptured({ history: transcript, known: intake.captured });

  await saveIntake(db, build.projectId, {
    transcript,
    captured: capture.captured,
    status: "in_progress",
  });

  return NextResponse.json({
    reply,
    captured: capture.captured,
    readyForBrief: capture.readyForBrief,
  });
}
