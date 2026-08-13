import type { SiteContent } from "@double-blaze/site-schema";

/**
 * Electric Grid: landing page content (session 2).
 *
 * This is the marketing page a visitor sees before joining. Everything behind
 * the login is the member application and lives elsewhere.
 *
 * Copy is written to the brief's own priorities: state the purpose fast, show
 * what membership gives, and make requesting to join feel small. It is a
 * starting draft for the client to react to rather than final copy, because
 * reacting to something specific is far easier than filling in a blank.
 *
 * No em dashes anywhere, per the house convention.
 *
 * Placeholder art is referenced by `placeholder:*` ids. Real assets replace
 * these by swapping the id for an uploaded asset id; nothing else changes.
 * The art is drawn to the layout, so replacements should match its
 * proportions: hero 2:1 landscape, splits 4:3.
 */

/**
 * Blue and green, per the intake, resolved for a professional utility
 * audience rather than a consumer one. Deep navy carries the authority the
 * audience expects, green reads as energy and reliability rather than
 * sustainability marketing, and the near-white background keeps long text
 * comfortable. TVA, the client's reference site, sits in the same register.
 */
export const ELECTRIC_GRID_THEME = {
  colors: {
    background: "#ffffff",
    text: "#132330",
    primary: "#0d2b45",
    accent: "#2f9e6f",
    muted: "#5b6f7d",
  },
  fonts: {
    body: '"Inter", system-ui, -apple-system, "Segoe UI", sans-serif',
    heading: '"Source Serif 4", Georgia, "Times New Roman", serif',
  },
} as const;

export const ELECTRIC_GRID_CONTENT: SiteContent = {
  siteName: "AI Interest for Electric Grid",
  tagline:
    "A working forum for the people running the grid and the people building AI.",
  theme: ELECTRIC_GRID_THEME,
  footerCredit: false,
  pages: [
    {
      slug: "home",
      title: "Home",
      blocks: [
        {
          type: "hero",
          eyebrow: "A members forum",
          heading: "AI is arriving on the grid. This is where the people running it compare notes.",
          sub: "A vetted, international forum for utility professionals and the AI practitioners building what lands on their systems.",
          media: {
            assetId: "placeholder:hero-grid",
            alt: "A transmission network at dusk with one energised path lit across it",
          },
          cta: { label: "Request to join", href: "join" },
        },
        {
          type: "split",
          eyebrow: "Why it exists",
          heading: "The people with the questions and the people with the tools rarely share a room.",
          body: `Forecasting, load growth, data centre interconnection, outage prediction, grid inspection. AI touches all of it, and the useful detail is scattered across vendor decks, conference hallways, and private conversations.

This forum puts the two sides in the same place. What worked, what did not, and what nobody has tried yet.`,
          mediaSide: "right",
          media: {
            assetId: "placeholder:split-signal",
            alt: "A load curve with a forecast band above it",
          },
        },
        {
          type: "split",
          eyebrow: "Who is here",
          heading: "Two industries, one conversation.",
          body: `**Utility professionals.** Executives, analysts, engineers, operators, and the people who keep it standing. If you work at or around a company that runs the grid, you belong here.

**AI practitioners.** People building models, tools, and the hardware and data centres underneath them, who want their work to meet the reality of the systems it runs on.

Membership is international. The grid is not one country's problem.`,
          mediaSide: "left",
          media: {
            assetId: "placeholder:split-people",
            alt: "A network diagram of members connecting across two industries",
          },
        },
        {
          type: "cards",
          heading: "What membership gives you",
          items: [
            {
              title: "A member directory worth reading",
              body: "Names, employers, and what people actually work on. You choose what appears on your profile, and nothing is public.",
            },
            {
              title: "Articles, briefings, and podcasts",
              body: "Written and recorded by members, for members. Long enough to be useful, and never a sales deck.",
            },
            {
              title: "Meetings you can bring a question to",
              body: "Scheduled sessions with guests from both industries, plus smaller conversations members set up themselves.",
            },
            {
              title: "No advertising and no selling",
              body: "The forum makes no money from your attention. Solicitation is grounds for removal, and that is the point.",
            },
          ],
        },
        {
          type: "steps",
          heading: "Joining takes a few minutes",
          intro: "Every member is reviewed, so the room stays worth being in.",
          items: [
            {
              title: "Tell us where you work",
              body: "Your employer and how your work connects to the grid or to AI. Enough for a real decision, and nothing more.",
            },
            {
              title: "An administrator reviews it",
              body: "A person reads it, not a filter. Most requests are answered within a few days.",
            },
            {
              title: "Build your profile",
              body: "Say what you work on and what you want to learn. You decide what other members can see.",
            },
          ],
        },
        {
          type: "cta",
          heading: "Bring a question worth answering.",
          body: "Membership is free. Contributing is expected.",
          cta: { label: "Request to join", href: "join" },
          note: "Reviewed by an administrator, usually within a few days.",
        },
      ],
    },
  ],
};
