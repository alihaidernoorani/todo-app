/**
 * T046: Debounce Hook for Search/Filter Operations
 *
 * Performance optimization to prevent excessive API calls during rapid user input.
 * Delays execution until user stops typing for specified delay period.
 *
 * Usage:
 * ```tsx
 * const [searchQuery, setSearchQuery] = useState('')
 * const debouncedSearch = useDebounce(searchQuery, 300)
 *
 * useEffect(() => {
 *   if (debouncedSearch) {
 *     fetchSearchResults(debouncedSearch)
 *   }
 * }, [debouncedSearch])
 * ```
 */

import { useEffect, useState } from 'react'

/**
 * Hook that returns a debounced value after specified delay
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns Debounced value
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // Set up timer to update debounced value after delay
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Cleanup: clear timeout if value changes before delay expires
    // This ensures only the final value triggers the update
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Debounced callback hook for actions (e.g., API calls)
 *
 * @param callback - Function to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns Debounced callback function
 *
 * Usage:
 * ```tsx
 * const handleSearch = useDebouncedCallback((query: string) => {
 *   fetchSearchResults(query)
 * }, 300)
 *
 * <input onChange={(e) => handleSearch(e.target.value)} />
 * ```
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Cleanup timeout on unmount
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [timeoutId])

  return (...args: Parameters<T>) => {
    // Clear previous timeout
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    // Set new timeout
    const newTimeoutId = setTimeout(() => {
      callback(...args)
    }, delay)

    setTimeoutId(newTimeoutId)
  }
}
