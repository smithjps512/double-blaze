/**
 * The class CO2 dragster rules, from the "Design Requirements" slide.
 *
 * Every number the Dragster Lab checks a car against lives here, so a rule
 * change is a one-line edit. Lengths are millimetres, mass is grams. The slide
 * gives some rules in inches; they are converted here and shown back to
 * students in whichever unit they picked.
 *
 * Note: the slide's header says "Body Length: 10-12 inches", but the body
 * rule underneath says 280 mm min, 290 mm max. The Lab follows the body rule.
 */

export const IN = 25.4;

export interface Range {
  min: number;
  max: number;
}

export const RULES = {
  /** Body length, nose to tail. */
  length: { min: 280, max: 290 } as Range,
  /** Tallest point of the car. */
  height: { min: 2.25 * IN, max: 3 * IN } as Range,
  /** Body width where the axles go through. */
  axleWidth: { min: 1.375 * IN, max: 1.625 * IN } as Range,
  /** Thinnest the body may be anywhere else. */
  minWidth: 0.5 * IN,
  /** Wood left around the CO2 hole (safety). */
  co2Wall: 0.125 * IN,
  /** Distance between the two screw eyes that hold the car on the line (safety). */
  eyeGap: { min: 6 * IN, max: 10.5 * IN } as Range,
  /** Finished car, wheels and axles on, no cartridge. */
  mass: { min: 40, max: 55 } as Range,
} as const;

/** Standard track: 20 metres, start to finish. */
export const TRACK_M = 20;
