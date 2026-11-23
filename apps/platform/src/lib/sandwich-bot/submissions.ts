import type { Script } from "./types";
import samplePbj from "../../../../../sandwich-bot/submissions/sample-pbj/script.json";
import sub001 from "../../../../../sandwich-bot/submissions/sub-001/script.json";
import sub002 from "../../../../../sandwich-bot/submissions/sub-002/script.json";
import sub003 from "../../../../../sandwich-bot/submissions/sub-003/script.json";
import sub004 from "../../../../../sandwich-bot/submissions/sub-004/script.json";
import sub005 from "../../../../../sandwich-bot/submissions/sub-005/script.json";
import sub006 from "../../../../../sandwich-bot/submissions/sub-006/script.json";

/**
 * Every scene in the gallery, in gallery order.
 *
 * The scripts live in /sandwich-bot/submissions/<id>/ at the repo root, next
 * to the transcription and interpretation log. IDs only: credits come from
 * the SANDWICH_BOT_CREDITS setting (see credits.ts), never from this repo.
 * To add one, import its script.json here and add it to the list.
 */
export const SCRIPTS: Script[] = [samplePbj, sub001, sub002, sub003, sub004, sub005, sub006] as Script[];

export function findScript(id: string): Script | undefined {
  return SCRIPTS.find((s) => s.id === id);
}
