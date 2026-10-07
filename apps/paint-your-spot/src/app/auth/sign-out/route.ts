import { NextResponse, type NextRequest } from "next/server";
import { getSessionClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/** POST /auth/sign-out. A POST, so a stray link or prefetch cannot sign anyone out. */
export async function POST(req: NextRequest) {
  const db = await getSessionClient();
  if (db) await db.auth.signOut();
  return NextResponse.redirect(new URL("/", new URL(req.url).origin), { status: 303 });
}
