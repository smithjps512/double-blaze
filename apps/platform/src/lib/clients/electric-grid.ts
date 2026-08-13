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
    "A vetted international forum where utility professionals and AI practitioners advance what the power industry knows about AI.",
  theme: ELECTRIC_GRID_THEME,
  footerCredit: false,
  pages: [
    {
      slug: "home",
      title: "Home",
      blocks: [
        {
          type: "hero",
          eyebrow: "An international members forum",
          // PLACEHOLDER, pending the club's and counsel's review.
          //
          // "collaboration" was the first choice and was pulled deliberately.
          // Utilities operate under FERC and state regulators and are acutely
          // sensitive to anything that reads as coordination between
          // competitors. "Shared learning" and "publication" describe the same
          // activity in the register trade and professional bodies use, which
          // is educational rather than coordinated. If the club wants to be
          // more conservative still, "education and publication" is the
          // safest phrasing available.
          heading:
            "Advancing what the power industry knows about AI through shared learning and publication.",
          // The headline carries both the what and the how, so the subheading
          // carries the who. Restating the mechanism here would be redundant.
          sub: "For professionals across the power industry and the AI practitioners building what runs on it.",
          media: {
            assetId: "placeholder:hero",
            kind: "video",
            // The still is what reduced-motion visitors see, and what appears
            // before the clip loads, so its alt text carries the meaning for
            // everyone. The video element itself is decorative.
            poster: "placeholder:hero-grid",
            alt: "A transmission network at dusk with one energised path lit across it",
          },
          cta: { label: "Request to join", href: "join" },
        },
        {
          type: "split",
          eyebrow: "Why it exists",
          heading: "The expertise exists on both sides. It is rarely in the same room.",
          body: `Forecasting, load growth, data centre interconnection, outage prediction, grid inspection. AI touches all of it, and the useful detail sits scattered across vendor decks, conference hallways, and private conversations.

This forum brings it together and makes it durable: what worked, what did not, and what has not been tried yet.`,
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
