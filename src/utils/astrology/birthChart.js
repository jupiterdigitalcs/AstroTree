import { calculateChart } from 'celestine'

// Default assumptions until birth time/location input is added (MVP 3)
const DEFAULT_HOUR     = 12  // noon
const DEFAULT_MINUTE   = 0
const DEFAULT_TIMEZONE = -5  // EST
const DEFAULT_LAT      = 40.7128  // New York
const DEFAULT_LON      = -74.0060

const SIGN_SYMBOLS = {
  Aries: '♈', Taurus: '♉', Gemini: '♊', Cancer: '♋',
  Leo: '♌', Virgo: '♍', Libra: '♎', Scorpio: '♏',
  Sagittarius: '♐', Capricorn: '♑', Aquarius: '♒', Pisces: '♓',
}

export function getMoonSign(birthdate) {
  try {
    const date = new Date(birthdate + 'T12:00:00')
    const chart = calculateChart({
      year:     date.getFullYear(),
      month:    date.getMonth() + 1,
      day:      date.getDate(),
      hour:     DEFAULT_HOUR,
      minute:   DEFAULT_MINUTE,
      second:   0,
      timezone: DEFAULT_TIMEZONE,
      latitude: DEFAULT_LAT,
      longitude: DEFAULT_LON,
    })
    // Moon is planet index 1
    const moon = chart.planets[1]
    if (!moon?.signName) return { moonSign: 'Unknown', moonSymbol: '☽' }
    return {
      moonSign:   moon.signName,
      moonSymbol: SIGN_SYMBOLS[moon.signName] ?? '☽',
    }
  } catch {
    return { moonSign: 'Unknown', moonSymbol: '☽' }
  }
}
