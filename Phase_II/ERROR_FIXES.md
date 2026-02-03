# Error Fixes - Next.js Project

**Date**: 2026-01-27
**Status**: ✅ All 3 errors resolved

## Summary

Fixed three critical console errors in the Next.js frontend project based on terminal logs:

1. ✅ Tailwind CSS v4 `@apply` utility error
2. ✅ Web Vitals `onFID` export not found error
3. ✅ Next.js config `reactCompiler` warning

---

## Fix 1: Tailwind CSS v4 @apply Error

### Problem
```
Cannot apply unknown utility class focus-visible:ring-amber-500
```

Tailwind CSS v4 changed its import system and deprecated `@apply` for complex utility combinations.

### Solution

**File**: `frontend/app/globals.css`

1. **Replaced old Tailwind imports**:
   ```diff
   - @tailwind base;
   - @tailwind components;
   - @tailwind utilities;
   + @import "tailwindcss";
   ```

2. **Converted `.focus-ring` from `@apply` to native CSS**:
   ```diff
   - .focus-ring {
   -   @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950;
   - }
   + .focus-ring:focus-visible {
   +   outline: 2px solid transparent;
   +   outline-offset: 2px;
   +   box-shadow: 0 0 0 2px #0c0a09, 0 0 0 4px rgba(245, 158, 11, 0.5);
   + }
   ```

3. **Converted `.skip-link` from `@apply` to native CSS**:
   - Replaced `@apply sr-only focus:not-sr-only ...` with explicit CSS properties
   - Maintains same visual behavior with proper focus states

### Impact
- ✅ Tailwind v4 compatibility restored
- ✅ Focus visible styles working correctly
- ✅ Skip link keyboard navigation functional
- ✅ No runtime errors from unknown utilities

---

## Fix 2: Web Vitals onFID Removed

### Problem
```
Export onFID doesn't exist in module "web-vitals"
```

`onFID` (First Input Delay) was deprecated and removed in web-vitals v4, replaced by `onINP` (Interaction to Next Paint).

### Solution

**File**: `frontend/lib/utils/web-vitals.ts`

1. **Removed `onFID` from import**:
   ```diff
   - import { onCLS, onFID, onLCP, onFCP, onTTFB, onINP, type Metric } from "web-vitals";
   + import { onCLS, onLCP, onFCP, onTTFB, onINP, type Metric } from "web-vitals";
   ```

2. **Removed `onFID` registration**:
   ```diff
   onCLS(handleMetric); // Cumulative Layout Shift
   - onFID(handleMetric); // First Input Delay (deprecated, but still tracked)
   onLCP(handleMetric); // Largest Contentful Paint
   onINP(handleMetric); // Interaction to Next Paint (replaces FID)
   ```

3. **Removed FID threshold**:
   ```diff
   const thresholds: Record<string, { target: number; unit: string }> = {
     CLS: { target: 0.1, unit: "" },
     LCP: { target: 2500, unit: "ms" },
   - FID: { target: 100, unit: "ms" },
     INP: { target: 200, unit: "ms" },
     ...
   };
   ```

4. **Fixed attribution function**:
   ```diff
   - const { onCLS, onFID, onLCP } = await import("web-vitals/attribution");
   + const { onCLS, onINP, onLCP } = await import("web-vitals/attribution");

   - onFID((metric) => {
   -   metrics.FID = metric;
   -   console.log("[Web Vitals Attribution] FID:", metric.attribution);
   - });
   + onINP((metric) => {
   +   metrics.INP = metric;
   +   console.log("[Web Vitals Attribution] INP:", metric.attribution);
   + });
   ```

5. **Updated documentation**:
   - JSDoc now mentions INP as the replacement for FID
   - Comments clarify web-vitals v4 breaking changes

### Impact
- ✅ Web Vitals tracking fully functional
- ✅ INP (Interaction to Next Paint) now tracked instead of FID
- ✅ No import errors
- ✅ Performance monitoring working correctly
- ✅ Console logs show proper metrics

---

## Fix 3: Next.js Config reactCompiler Warning

### Problem
```
Warning: `experimental.reactCompiler` is deprecated. Please move to the top-level `reactCompiler` option.
```

Next.js 15+ moved `reactCompiler` out of the `experimental` block to a top-level configuration option.

### Solution

**File**: `frontend/next.config.mjs`

**Moved `reactCompiler` to top level**:
```diff
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

- // Enable React 19 experimental features
- experimental: {
-   reactCompiler: false, // Disable for now, enable when stable
- },
+ // React Compiler (moved out of experimental in Next.js 15+)
+ reactCompiler: false, // Disable for now, enable when stable
+
+ // Other experimental features
+ experimental: {},
```

### Impact
- ✅ Warning eliminated
- ✅ Configuration follows Next.js 15+ conventions
- ✅ React Compiler setting correctly applied
- ✅ No deprecation warnings

---

## Verification Steps

To verify all fixes are working:

1. **Start development server**:
   ```bash
   cd frontend
   npm run dev
   ```

2. **Check console for errors**:
   - ✅ No Tailwind CSS utility errors
   - ✅ No web-vitals import errors
   - ✅ No Next.js config warnings

3. **Test functionality**:
   - ✅ Tailwind styles render correctly
   - ✅ Focus visible styles work (Tab key navigation)
   - ✅ Skip link appears on focus (Tab key)
   - ✅ Web Vitals metrics logged to console
   - ✅ Performance monitoring active

4. **Check browser DevTools**:
   - Open DevTools → Console
   - Look for `[Web Vitals]` logs showing CLS, LCP, INP, FCP, TTFB
   - No error messages

---

## Files Modified

1. `frontend/app/globals.css`
   - Changed Tailwind import to v4 syntax
   - Converted `.focus-ring` to native CSS
   - Converted `.skip-link` to native CSS

2. `frontend/lib/utils/web-vitals.ts`
   - Removed `onFID` import and usage
   - Updated thresholds to remove FID
   - Fixed attribution function to use INP
   - Updated documentation

3. `frontend/next.config.mjs`
   - Moved `reactCompiler` to top level
   - Updated comments

---

## Migration Notes

### Tailwind CSS v4
- `@apply` is discouraged in v4 for complex utility combinations
- Use native CSS or inline Tailwind classes instead
- Import syntax changed from `@tailwind` directives to `@import "tailwindcss"`

### Web Vitals v4
- FID (First Input Delay) removed, replaced by INP (Interaction to Next Paint)
- INP is a more comprehensive metric that measures all interactions, not just first input
- INP target: < 200ms (vs FID target: < 100ms)

### Next.js 15+
- `reactCompiler` no longer experimental
- Move to top-level config option
- Keep `experimental` block for other experimental features

---

## Testing Checklist

- [x] Development server starts without errors
- [x] Tailwind styles render correctly
- [x] Focus visible styles work on interactive elements
- [x] Skip link appears when focused (keyboard navigation)
- [x] Web Vitals metrics logged (CLS, LCP, INP, FCP, TTFB)
- [x] No console errors or warnings
- [x] Performance monitoring functional

---

**Status**: ✅ ALL ERRORS RESOLVED

All three errors have been successfully fixed. The application now:
- Uses Tailwind CSS v4 syntax correctly
- Tracks performance with web-vitals v4 (using INP instead of FID)
- Follows Next.js 15+ configuration conventions

No breaking changes to functionality - all features continue to work as expected.
