import { redirect } from "next/navigation";

/**
 * Solutions (community products) was retired with the program management repositioning (James,
 * 2026-11-24). The old address forwards so existing links keep working.
 * Earlier version: git history.
 */
export default function RetiredPage() {
  redirect("/practice-areas");
}
