/**
 * astrology-core — barrel export
 *
 * The single import point for all server-side astrology calculations.
 * Celestine is never imported directly outside this package.
 *
 * Usage:
 *   import { calcMoon, calcTransitsForPerson } from '@/lib/astrology-core'
 */

export {
  // Constants
  DEFAULT_HOUR,
  DEFAULT_MINUTE,
  DEFAULT_TIMEZONE,
  SIGN_SYMBOLS,
  // Helpers
  ianaToOffset,
  parseTime,
  chartAt,
  // Natal calculations
  calcMoon,
  calcInnerPlanets,
  calcOuterPlanets,
  calcSunAtTime,
  calcIngressWarnings,
  calcTimezoneWarnings,
  getNatalPlanets,
} from './natal.js'

export {
  // Transit config
  TRANSITING_BODIES,
  NATAL_POINTS,
  ASPECTS,
  DEFAULT_TRANSIT_ORBS,
  // Transit calculations
  calcTransitsForPerson,
  calcGroupTransits,
  findSharedTransits,
} from './transits.js'
