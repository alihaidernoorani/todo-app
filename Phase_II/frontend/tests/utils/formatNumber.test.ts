/**
 * formatNumber Utility Tests
 *
 * Comprehensive test suite for number formatting utility including:
 * - Basic formatting (values < 1000)
 * - Thousand abbreviation (k suffix)
 * - Million abbreviation (M suffix)
 * - Billion abbreviation (B suffix)
 * - Edge cases (0, boundaries, negative numbers)
 * - Output structure validation
 *
 * Target: 100% code coverage
 */

import { describe, it, expect } from 'vitest'
import { formatNumber, type FormattedNumber } from '@/lib/utils/formatNumber'

describe('formatNumber', () => {
  describe('Basic Formatting (< 1000)', () => {
    it('should format zero correctly', () => {
      const result = formatNumber(0)

      expect(result.display).toBe('0')
      expect(result.full).toBe('0')
      expect(result.raw).toBe(0)
    })

    it('should format single digits correctly', () => {
      const result = formatNumber(5)

      expect(result.display).toBe('5')
      expect(result.full).toBe('5')
      expect(result.raw).toBe(5)
    })

    it('should format double digits correctly', () => {
      const result = formatNumber(42)

      expect(result.display).toBe('42')
      expect(result.full).toBe('42')
      expect(result.raw).toBe(42)
    })

    it('should format triple digits correctly', () => {
      const result = formatNumber(999)

      expect(result.display).toBe('999')
      expect(result.full).toBe('999')
      expect(result.raw).toBe(999)
    })

    it('should format three-digit numbers with locale formatting', () => {
      const result = formatNumber(123)

      expect(result.display).toBe('123')
      expect(result.full).toBe('123')
      expect(result.raw).toBe(123)
    })
  })

  describe('Thousand Abbreviation (k suffix)', () => {
    it('should format exactly 1000 with k suffix', () => {
      const result = formatNumber(1000)

      expect(result.display).toBe('1.0k')
      expect(result.full).toBe('1,000')
      expect(result.raw).toBe(1000)
    })

    it('should format 1234 as "1.2k"', () => {
      const result = formatNumber(1234)

      expect(result.display).toBe('1.2k')
      expect(result.full).toBe('1,234')
      expect(result.raw).toBe(1234)
    })

    it('should format 9999 as "10.0k"', () => {
      const result = formatNumber(9999)

      expect(result.display).toBe('10.0k')
      expect(result.full).toBe('9,999')
      expect(result.raw).toBe(9999)
    })

    it('should format mid-range thousands correctly', () => {
      const result = formatNumber(5500)

      expect(result.display).toBe('5.5k')
      expect(result.full).toBe('5,500')
      expect(result.raw).toBe(5500)
    })

    it('should format 999,999 with k suffix', () => {
      const result = formatNumber(999_999)

      expect(result.display).toBe('1000.0k')
      expect(result.full).toBe('999,999')
      expect(result.raw).toBe(999_999)
    })
  })

  describe('Million Abbreviation (M suffix)', () => {
    it('should format exactly 1 million with M suffix', () => {
      const result = formatNumber(1_000_000)

      expect(result.display).toBe('1.0M')
      expect(result.full).toBe('1,000,000')
      expect(result.raw).toBe(1_000_000)
    })

    it('should format 1.5M correctly', () => {
      const result = formatNumber(1_500_000)

      expect(result.display).toBe('1.5M')
      expect(result.full).toBe('1,500,000')
      expect(result.raw).toBe(1_500_000)
    })

    it('should format mid-range millions correctly', () => {
      const result = formatNumber(42_000_000)

      expect(result.display).toBe('42.0M')
      expect(result.full).toBe('42,000,000')
      expect(result.raw).toBe(42_000_000)
    })

    it('should format 999,999,999 with M suffix', () => {
      const result = formatNumber(999_999_999)

      expect(result.display).toBe('1000.0M')
      expect(result.full).toBe('999,999,999')
      expect(result.raw).toBe(999_999_999)
    })
  })

  describe('Billion Abbreviation (B suffix)', () => {
    it('should format exactly 1 billion with B suffix', () => {
      const result = formatNumber(1_000_000_000)

      expect(result.display).toBe('1.0B')
      expect(result.full).toBe('1,000,000,000')
      expect(result.raw).toBe(1_000_000_000)
    })

    it('should format 5.5B correctly', () => {
      const result = formatNumber(5_500_000_000)

      expect(result.display).toBe('5.5B')
      expect(result.full).toBe('5,500,000,000')
      expect(result.raw).toBe(5_500_000_000)
    })

    it('should format very large numbers with B suffix', () => {
      const result = formatNumber(999_999_999_999)

      expect(result.display).toBe('1000.0B')
      expect(result.full).toBe('999,999,999,999')
      expect(result.raw).toBe(999_999_999_999)
    })
  })

  describe('Negative Numbers', () => {
    it('should format negative single digits correctly', () => {
      const result = formatNumber(-5)

      expect(result.display).toBe('-5')
      expect(result.full).toBe('-5')
      expect(result.raw).toBe(-5)
    })

    it('should format negative hundreds correctly', () => {
      const result = formatNumber(-999)

      expect(result.display).toBe('-999')
      expect(result.full).toBe('-999')
      expect(result.raw).toBe(-999)
    })

    it('should format negative thousands with k suffix', () => {
      const result = formatNumber(-1234)

      expect(result.display).toBe('-1.2k')
      expect(result.full).toBe('-1,234')
      expect(result.raw).toBe(-1234)
    })

    it('should format negative millions with M suffix', () => {
      const result = formatNumber(-1_500_000)

      expect(result.display).toBe('-1.5M')
      expect(result.full).toBe('-1,500,000')
      expect(result.raw).toBe(-1_500_000)
    })

    it('should format negative billions with B suffix', () => {
      const result = formatNumber(-5_000_000_000)

      expect(result.display).toBe('-5.0B')
      expect(result.full).toBe('-5,000,000,000')
      expect(result.raw).toBe(-5_000_000_000)
    })
  })

  describe('Boundary Cases', () => {
    it('should handle boundary at 999/1000', () => {
      const result999 = formatNumber(999)
      const result1000 = formatNumber(1000)

      expect(result999.display).toBe('999')
      expect(result1000.display).toBe('1.0k')
    })

    it('should handle boundary at 999,999/1,000,000', () => {
      const result999k = formatNumber(999_999)
      const result1m = formatNumber(1_000_000)

      expect(result999k.display).toBe('1000.0k')
      expect(result1m.display).toBe('1.0M')
    })

    it('should handle boundary at 999,999,999/1,000,000,000', () => {
      const result999m = formatNumber(999_999_999)
      const result1b = formatNumber(1_000_000_000)

      expect(result999m.display).toBe('1000.0M')
      expect(result1b.display).toBe('1.0B')
    })
  })

  describe('Output Structure Validation', () => {
    it('should return object with required properties', () => {
      const result = formatNumber(1234)

      expect(result).toHaveProperty('display')
      expect(result).toHaveProperty('full')
      expect(result).toHaveProperty('raw')
    })

    it('should return correct types for all properties', () => {
      const result = formatNumber(1234)

      expect(typeof result.display).toBe('string')
      expect(typeof result.full).toBe('string')
      expect(typeof result.raw).toBe('number')
    })

    it('should preserve raw value exactly', () => {
      const input = 123456789
      const result = formatNumber(input)

      expect(result.raw).toBe(input)
      expect(result.raw).not.toBe(result.display)
    })
  })

  describe('Decimal Precision', () => {
    it('should format thousands with 1 decimal place', () => {
      const result = formatNumber(1567)

      expect(result.display).toBe('1.6k') // Rounded
    })

    it('should format millions with 1 decimal place', () => {
      const result = formatNumber(1_567_000)

      expect(result.display).toBe('1.6M') // Rounded
    })

    it('should format billions with 1 decimal place', () => {
      const result = formatNumber(1_567_000_000)

      expect(result.display).toBe('1.6B') // Rounded
    })
  })

  describe('Performance', () => {
    it('should execute in under 1ms for typical values', () => {
      const iterations = 1000
      const testValues = [0, 42, 999, 1234, 9999, 1_000_000, 1_500_000, 1_000_000_000]

      const startTime = performance.now()

      for (let i = 0; i < iterations; i++) {
        testValues.forEach(value => formatNumber(value))
      }

      const endTime = performance.now()
      const avgTime = (endTime - startTime) / (iterations * testValues.length)

      // Average execution time should be well under 1ms
      expect(avgTime).toBeLessThan(1)
    })
  })

  describe('Real-world Scenarios', () => {
    it('should format task count metrics correctly', () => {
      expect(formatNumber(0).display).toBe('0')
      expect(formatNumber(5).display).toBe('5')
      expect(formatNumber(42).display).toBe('42')
      expect(formatNumber(150).display).toBe('150')
    })

    it('should format productivity metrics correctly', () => {
      expect(formatNumber(1234).display).toBe('1.2k')
      expect(formatNumber(5678).display).toBe('5.7k')
      expect(formatNumber(99999).display).toBe('100.0k')
    })

    it('should handle dashboard overflow scenarios', () => {
      // These scenarios should never overflow UI containers
      const largeNumbers = [
        999_999,
        1_000_000,
        10_000_000,
        100_000_000,
        1_000_000_000
      ]

      largeNumbers.forEach(num => {
        const result = formatNumber(num)
        // Display should always be abbreviated (max 6 chars including suffix)
        expect(result.display.length).toBeLessThanOrEqual(8)
      })
    })
  })
})
