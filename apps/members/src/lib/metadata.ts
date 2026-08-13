import "server-only";
import type { Metadata } from "next";
import { resolveTenant } from "./tenant";
import { pageTitle } from "./theme";

/**
 * A browser tab that says where you are.
 *
 * Every tab in this application said "Members" until session 5b, because the
 * root layout set one title and no page overrode it. That is what a title says
 * when nobody has thought about it, and it makes a member with three tabs open
 * unable to tell them apart.
 *
 * Here rather than repeated in ten files, because the club's name has to be
 * resolved from the hostname before a title can be written and doing that
 * inline in every page is how one of them ends up different.
 */
export async function titleFor(page: string): Promise<Metadata> {
  const tenant = await resolveTenant();
  return { title: pageTitle(page, tenant?.name ?? "Members") };
}
