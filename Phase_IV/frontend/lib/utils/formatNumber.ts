/**
 * Number Formatting Utility
 *
 * Abbreviates large numbers with k/M/B suffixes to prevent UI overflow
 * while maintaining accessibility via full number in ARIA labels.
 *
 * Examples:
 * - formatNumber(42) → "42"
 * - formatNumber(1234) → "1.2k"
 * - formatNumber(9999) → "10.0k"
 * - formatNumber(1500000) → "1.5M"
 *
 * Performance: <1ms execution time
 */

export interface FormattedNumber {
  /**
   * Abbreviated display value (e.g., "1.2k")
   */
  display: string

  /**
   * Full number with locale formatting for ARIA labels (e.g., "1,234")
   */
  full: string

  /**
   * Raw numeric value
   */
  raw: number
}

/**
 * Formats a number with k/M/B abbreviation for compact display
 *
 * @param value - Numeric value to format
 * @returns FormattedNumber object with display, full, and raw values
 *
 * @example
 * ```ts
 * const formatted = formatNumber(1234)
 * console.log(formatted.display) // "1.2k"
 * console.log(formatted.full)    // "1,234"
 * ```
 */
export function formatNumber(value: number): FormattedNumber {
  const raw = value
  const full = value.toLocaleString()

  // Return as-is for values < 1000
  if (Math.abs(value) < 1000) {
    return {
      display: full,
      full,
      raw
    }
  }

  // Format with k suffix (1,000 - 999,999)
  if (Math.abs(value) < 1_000_000) {
    const abbreviated = (value / 1000).toFixed(1)
    return {
      display: `${abbreviated}k`,
      full,
      raw
    }
  }

  // Format with M suffix (1,000,000 - 999,999,999)
  if (Math.abs(value) < 1_000_000_000) {
    const abbreviated = (value / 1_000_000).toFixed(1)
    return {
      display: `${abbreviated}M`,
      full,
      raw
    }
  }

  // Format with B suffix (1,000,000,000+)
  const abbreviated = (value / 1_000_000_000).toFixed(1)
  return {
    display: `${abbreviated}B`,
    full,
    raw
  }
}
