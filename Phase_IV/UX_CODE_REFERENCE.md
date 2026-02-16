# TaskFlow UX Improvements - Code Reference Guide

Quick reference for developers reviewing or maintaining the UX improvements.

---

## 1. Mobile Account Menu (Bottom Sheet)

### AccountSheet Component
**File**: `/frontend/components/layout/AccountSheet.tsx`

```tsx
// Key features:
- Slides up from bottom with animation
- Touch-friendly menu items (min-height 48px)
- Backdrop blur overlay
- Safe area support for notched devices
- Escape key and click-outside-to-close

// Usage:
<AccountSheet open={isOpen} onOpenChange={setIsOpen} />
```

**Integration**: `/frontend/components/layout/MobileNav.tsx`
```tsx
const [isAccountSheetOpen, setIsAccountSheetOpen] = useState(false)

// Account nav item
{
  label: 'Account',
  icon: <UserCircle className="w-6 h-6" />,
  action: () => setIsAccountSheetOpen(true)
}
```

---

## 2. Mobile Spacing with Safe Area

### Dashboard Page
**File**: `/frontend/app/dashboard/page.tsx`

```tsx
<main
  id="main-content"
  className="space-y-8 p-6 md:p-10 pb-28 md:pb-10"
  style={{ paddingBottom: "calc(7rem + env(safe-area-inset-bottom, 0px))" }}
>
```

**Breakdown**:
- `p-6`: 24px padding mobile
- `md:p-10`: 40px padding desktop
- `pb-28`: 112px bottom padding mobile (clears bottom nav)
- `md:pb-10`: Normal padding on desktop
- `calc(7rem + env(...))`: Dynamic safe area for notches

### Mobile Nav Safe Area
**File**: `/frontend/components/layout/MobileNav.tsx`

```tsx
<nav
  style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
>
```

---

## 3. Responsive Typography

### CSS Utilities
**File**: `/frontend/app/globals.css`

```css
/* Mobile-first approach */
.text-responsive-base {
  font-size: 0.875rem; /* 14px mobile */
}

@media (min-width: 768px) {
  .text-responsive-base {
    font-size: 1rem; /* 16px desktop */
  }
}
```

### Usage Examples

**Page Headings** (`/frontend/app/dashboard/page.tsx`):
```tsx
<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
  Welcome back, {userName}
</h1>
```

**Task Titles** (`/frontend/components/dashboard/TaskItem.tsx`):
```tsx
<h3 className="text-sm md:text-base font-medium">
  {task.title}
</h3>
```

**Body Text**:
```tsx
<p className="text-sm md:text-base text-slate-600">
  Description text
</p>
```

---

## 4. Generous Spacing

### Spacing Scale Applied

| Element | Mobile | Desktop | Purpose |
|---------|--------|---------|---------|
| Dashboard main | `p-6` (24px) | `md:p-10` (40px) | Main container |
| Task cards | `p-5` (20px) | `md:p-6` (24px) | Card padding |
| Task lists | `space-y-5` (20px) | Same | Vertical spacing |
| Metrics grid | `gap-5` (20px) | `md:gap-6` (24px) | Grid gap |
| Modal content | `p-5` (20px) | `md:p-6` (24px) | Modal padding |

### Code Examples

**Metrics Grid** (`/frontend/components/dashboard/MetricsGrid.tsx`):
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
```

**Task List** (`/frontend/components/dashboard/TaskStream.tsx`):
```tsx
<motion.div layout className="space-y-5">
```

**Task Card** (`/frontend/components/dashboard/TaskItem.tsx`):
```tsx
className="bg-white rounded-lg border border-slate-200 p-5 md:p-6"
```

---

## 5. Floating Labels

### Implementation Pattern
**File**: `/frontend/components/dashboard/TaskForm.tsx`

```tsx
{/* Container with relative positioning */}
<div className="relative">
  {/* Floating label */}
  <label
    htmlFor="task-title"
    className={`
      absolute left-4 transition-all duration-200 pointer-events-none
      ${title || isSubmitting
        ? 'top-2 text-xs text-blue-600'
        : 'top-3.5 text-sm text-slate-500'
      }
    `}
  >
    Title <span className="text-red-500">*</span>
  </label>

  {/* Input with top padding for label */}
  <input
    id="task-title"
    className="w-full px-4 pt-6 pb-2 rounded-lg min-h-[56px]"
    value={title}
    onChange={(e) => setTitle(e.target.value)}
    autoFocus
  />
</div>
```

**Key Points**:
- Label positioned absolutely
- Transitions between two states (placeholder vs. floating)
- Input has extra top padding (`pt-6`) to accommodate label
- `pointer-events-none` prevents label from blocking clicks
- `min-h-[56px]` ensures touch-friendly height

### Custom Dropdown Arrow
```tsx
{/* Priority select with custom arrow */}
<div className="relative">
  <select className="appearance-none">...</select>
  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
    <svg className="w-4 h-4" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M19 9l-7 7-7-7" />
    </svg>
  </div>
</div>
```

---

## 6. Touch-Friendly Targets

### Minimum Heights

```tsx
// Buttons
className="min-h-[48px]"

// Form inputs
className="min-h-[56px]"  // Extra height for floating label

// Icon buttons
className="min-h-[44px] min-w-[44px]"
```

### Examples

**Primary Button** (`/frontend/components/dashboard/TaskStream.tsx`):
```tsx
<PrimaryButton
  className="min-h-[48px]"
  onClick={() => setIsModalOpen(true)}
>
  Add Task
</PrimaryButton>
```

**Close Button** (`/frontend/components/dashboard/TaskModal.tsx`):
```tsx
<button
  className="min-h-[44px] min-w-[44px] flex items-center justify-center"
  onClick={() => onOpenChange(false)}
>
  <X className="w-5 h-5" />
</button>
```

---

## 7. Error Handling (Already Implemented)

### ApiClient Error Mapping
**File**: `/frontend/lib/api/client.ts`

```typescript
function mapErrorToFriendlyMessage(error: any): string {
  if (error.status === 500) {
    return "Something went wrong on our end. Please try again."
  }
  if (error.status === 503) {
    return "Service temporarily unavailable. Please try again in a moment."
  }
  if (error.status === 401) {
    return "Your session has expired. Please sign in again."
  }
  if (error.status === 403) {
    return "You don't have permission to perform this action."
  }
  if (!navigator.onLine) {
    return "Unable to connect. Check your internet connection."
  }
  // ... more mappings
}
```

### Usage in API Requests
```typescript
try {
  const response = await fetch(url, options)
  if (!response.ok) {
    const friendlyMessage = mapErrorToFriendlyMessage({
      status: response.status
    })
    throw new Error(friendlyMessage)
  }
} catch (error) {
  // Error is already user-friendly
  throw error
}
```

---

## 8. Animation Patterns

### Slide Up Animation
**File**: `/frontend/components/layout/AccountSheet.tsx`

```tsx
// CSS keyframes
@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

// Usage
<div style={{ animation: "slideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1)" }}>
```

### Staggered List Animation
**File**: `/frontend/components/dashboard/MetricCard.tsx`

```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{
    duration: 0.5,
    delay: index * 0.1,  // Stagger based on index
    ease: [0.16, 1, 0.3, 1]
  }}
>
```

---

## CSS Custom Properties

### Safe Area Variables

```css
/* Mobile nav with safe area */
padding-bottom: env(safe-area-inset-bottom, 0px);

/* Dashboard with safe area */
padding-bottom: calc(7rem + env(safe-area-inset-bottom, 0px));
```

**Browser Support**:
- iOS Safari 11.2+
- Chrome 69+
- Firefox 69+
- Fallback: `0px` on unsupported browsers

---

## Testing Utilities

### Manual Testing Script

```bash
# Test mobile layout on various widths
npm run dev
# Open http://localhost:3000/dashboard
# Resize to: 320px, 375px, 428px, 768px, 1024px, 1920px

# Test with Chrome DevTools Device Toolbar
# Enable: "Show media queries"
# Enable: "Show rulers"
# Test devices: iPhone 12, Pixel 5, iPad, Desktop
```

### Accessibility Testing

```bash
# Install axe DevTools Chrome extension
# Run automated scan on /dashboard page
# Check for:
# - Color contrast (4.5:1 minimum)
# - Touch targets (44x44px minimum)
# - Keyboard navigation
# - Screen reader announcements
```

---

## Common Patterns Cheat Sheet

### Responsive Padding
```tsx
className="p-6 md:p-10"           // Main containers
className="p-5 md:p-6"            // Cards and modals
className="px-4 py-2"             // Small buttons
```

### Responsive Typography
```tsx
className="text-2xl md:text-3xl lg:text-4xl"  // Large headings
className="text-base md:text-lg"              // Medium headings
className="text-sm md:text-base"              // Body text
className="text-xs md:text-sm"                // Small text
```

### Responsive Spacing
```tsx
className="space-y-5"             // List vertical spacing
className="gap-5 md:gap-6"        // Grid gaps
className="mb-5"                  // Section margins
```

### Touch Targets
```tsx
className="min-h-[48px]"          // Buttons
className="min-h-[56px]"          // Inputs with floating labels
className="min-h-[44px] min-w-[44px]"  // Icon buttons
```

---

## Performance Considerations

### GPU Acceleration
```css
/* Use transform/opacity for animations (GPU accelerated) */
.animate {
  transform: translateY(0);
  opacity: 1;
  transition: transform 0.3s, opacity 0.3s;
}

/* Avoid animating these (CPU bound) */
/* ❌ width, height, margin, padding, top, left */
```

### Layout Shift Prevention
```tsx
// Fixed heights prevent CLS
className="h-32"              // Metric cards
className="min-h-[56px]"      // Inputs
className="h-16"              // Bottom nav

// Responsive images
<img className="w-full h-auto" />
```

---

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Floating labels | ✅ | ✅ | ✅ | ✅ |
| Safe area insets | ✅ 69+ | ✅ 69+ | ✅ 11.2+ | ✅ 79+ |
| Backdrop blur | ✅ 76+ | ✅ 103+ | ✅ 9+ | ✅ 79+ |
| Container queries | ✅ 105+ | ✅ 110+ | ✅ 16+ | ✅ 105+ |

**Fallbacks Implemented**:
- Safe area: Fallback to `0px`
- Backdrop blur: Solid background fallback
- Floating labels: Degrade to static labels

---

## Quick Fixes

### Label not floating?
```tsx
// Check conditional has correct logic
${value || isSubmitting ? 'top-2' : 'top-3.5'}

// Ensure transition class is present
className="transition-all duration-200"
```

### Content cut off on mobile?
```tsx
// Add safe-area-inset-bottom
style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}

// Or use calc() for combination
style={{ paddingBottom: "calc(7rem + env(safe-area-inset-bottom, 0px))" }}
```

### Text too small/large?
```tsx
// Use responsive classes
className="text-sm md:text-base"  // Not: "text-base"
```

### Spacing feels cramped?
```tsx
// Increase padding
className="p-5 md:p-6"  // Not: "p-4"

// Increase gaps
className="gap-5 md:gap-6"  // Not: "gap-4"
```

---

## Related Documentation

- Spec: `/specs/004-modern-ui-ux-dashboard/spec.md`
- Tasks: `/specs/004-modern-ui-ux-dashboard/tasks.md`
- Summary: `/UX_IMPROVEMENTS_SUMMARY.md`
- Design System: `/frontend/app/globals.css`
