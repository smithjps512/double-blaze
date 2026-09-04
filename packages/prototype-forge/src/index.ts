/**
 * Prototype forge: a student team's product plan and user stories in, a
 * clickable prototype out.
 *
 * The pipeline is three pure steps, exported separately so a host application
 * can stop at any of them: parse to see what was understood, plan to see the
 * screens and the coach notes without rendering, render for the artifact a
 * student clicks.
 *
 * Nothing here touches the file system, the network, or a model. The classroom
 * application that will eventually wrap this lives in a different codebase, and
 * this package has to move there unchanged.
 */

export * from "./types";
export { parseBrief, parseStories, parseTeamDocs, plainText, slugify, titleCase } from "./parse";
export { planPrototype, assignStories, coachNotes } from "./plan";
export { renderPrototype, escapeHtml } from "./render";
export { renderMarkdown } from "./markdown";
export { renderDocPage } from "./doc-page";
export { parseArchitecture, renderDesignBrief, PALETTE } from "./design";
export type { DesignSpec, DesignScreen, DesignComponent, DesignBriefMeta, PaletteEntry } from "./design";
export type { DocLink, DocPageOptions } from "./doc-page";
export type { RenderOptions } from "./render";

import { parseTeamDocs } from "./parse";
import { planPrototype } from "./plan";
import { renderPrototype, type RenderOptions } from "./render";
import type { AppSpec, ProductBrief, UserStory } from "./types";

export interface ForgeInput {
  planMarkdown: string;
  storiesMarkdown?: string;
  /** Used when the plan never states a product name. Usually the folder name. */
  fallbackName?: string;
  render?: RenderOptions;
}

export interface ForgeResult {
  brief: ProductBrief;
  stories: UserStory[];
  app: AppSpec;
  html: string;
}

/** The whole pipeline, for the common case. */
export function forgePrototype(input: ForgeInput): ForgeResult {
  const { brief, stories } = parseTeamDocs(input);
  const app = planPrototype(brief, stories);
  return { brief, stories, app, html: renderPrototype(app, input.render) };
}
