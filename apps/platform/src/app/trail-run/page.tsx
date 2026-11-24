import { redirect } from "next/navigation";

/**
 * Trail Run (first month free) was retired with the program management repositioning (James,
 * 2026-11-24). The old address forwards so existing links keep working.
 * Earlier version: git history.
 */
export default function RetiredPage() {
  redirect("/pricing");
}
