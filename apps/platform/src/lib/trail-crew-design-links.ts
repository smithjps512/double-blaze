import "server-only";
import { getSupabaseServiceClient } from "./supabase";

/**
 * A team's shared design: the Figma link, their published Anvil app, and one
 * line about where they are.
 *
 * Stored, never committed. The Figma link names the file owner, who is a
 * student, and this repository is public. The teacher reads the link from the
 * queue page; the design review reads the file through the Figma connector
 * and writes only what it found, with no link and no name.
 */

export const MAX_NOTE_LENGTH = 400;

export interface DesignLink {
  id: string;
  team_slug: string;
  figma_url: string | null;
  anvil_url: string | null;
  note: string | null;
  created_at: string;
}

/** A Figma design file link, and nothing else that lives on figma.com. */
export function isFigmaDesignUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return (
      (u.hostname === "www.figma.com" || u.hostname === "figma.com") &&
      /^\/(design|file|proto)\/[0-9A-Za-z]{10,}/.test(u.pathname)
    );
  } catch {
    return false;
  }
}

/** A published Anvil app, on anvil.app or a custom domain the teacher set. */
export function isAnvilAppUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && (u.hostname.endsWith(".anvil.app") || u.hostname.endsWith(".anvilapp.net"));
  } catch {
    return false;
  }
}

export async function submitDesignLink(input: {
  slug: string;
  figmaUrl: string | null;
  anvilUrl: string | null;
  note: string;
}): Promise<{ ok: boolean; id?: string }> {
  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    console.error("[trail-crew] no Supabase client; design link not stored");
    return { ok: false };
  }
  const { data, error } = await supabase
    .from("trail_crew_design_links")
    .insert({
      team_slug: input.slug,
      figma_url: input.figmaUrl,
      anvil_url: input.anvilUrl,
      note: input.note.slice(0, MAX_NOTE_LENGTH) || null,
    })
    .select("id")
    .single();
  if (error) {
    console.error(`[trail-crew] could not store design link: ${error.message}`);
    return { ok: false };
  }
  return { ok: true, id: data.id as string };
}

/** The latest share per team, newest first. */
export async function latestDesignLinks(): Promise<DesignLink[]> {
  const supabase = getSupabaseServiceClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("trail_crew_design_links")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) {
    console.error(`[trail-crew] could not list design links: ${error.message}`);
    return [];
  }
  const seen = new Set<string>();
  const out: DesignLink[] = [];
  for (const row of (data ?? []) as DesignLink[]) {
    if (seen.has(row.team_slug)) continue;
    seen.add(row.team_slug);
    out.push(row);
  }
  return out;
}

export async function latestDesignLinkFor(slug: string): Promise<DesignLink | null> {
  const supabase = getSupabaseServiceClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("trail_crew_design_links")
    .select("*")
    .eq("team_slug", slug)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return null;
  return (data as DesignLink | null) ?? null;
}
