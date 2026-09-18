/**
 * The class module's identity, in one place.
 *
 * Everything this package renders carries a credit line and a name. They used
 * to be typed into each renderer as Double Blaze's, which was fine while the
 * module lived in one repo with one brand. It is moving: the engine and the
 * content are going to Melissa for Educators as a module of their own, and
 * the small business version, if it happens, is the same engine with a
 * different content pack. So the brand is data, read from here, and changing
 * hosts is a change to this file rather than a search across the renderers.
 *
 * `docs/module/README.md` says what the module is and how it moves.
 */

export interface ModuleToolchain {
  /** Where students design screens. Figma is a yes. */
  design: "figma";
  /**
   * Where students build. Anvil is the tool the current guides are written
   * for; the teacher's verdict is "a maybe", so it is named here rather than
   * assumed, and the manifest tags every Anvil-specific page so a different
   * build tool can replace the pack without touching the rest.
   */
  build: "anvil";
}

export interface ModuleConfig {
  /** The name the module will carry in its new home. One line to rename. */
  name: string;
  /** What it was called while it lived at Double Blaze; still used by the app layer here. */
  legacyName: string;
  /** One sentence for the people who ask what it is. */
  tagline: string;
  /** The credit line at the foot of every generated page. */
  credit: string;
  creditHref: string;
  toolchain: ModuleToolchain;
  /**
   * How students are identified. The module never needs a student's name:
   * teams are the unit of work and a person is initials or a pseudonym. A
   * teacher who registers students with outside tools can use plus
   * addressing on their own email (teacher+ab@school.org) so nothing
   * personally identifying leaves the building.
   */
  identity: "pseudonym";
}

export const MODULE: ModuleConfig = {
  name: "Melissa for Makers",
  legacyName: "Trail Crew",
  tagline: "Product design and development, end to end, in a classroom.",
  credit: "Built in class with Double Blaze",
  creditHref: "https://doubleblaze.solutions",
  toolchain: { design: "figma", build: "anvil" },
  identity: "pseudonym",
};
