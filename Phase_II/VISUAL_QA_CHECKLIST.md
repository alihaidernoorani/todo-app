# TaskFlow - Visual QA Checklist

Complete visual quality assurance checklist for UX improvements.

---

## Device Testing Matrix

### Mobile Phones (Portrait)
- [ ] iPhone 14 Pro Max (430x932) - Has notch + safe area
- [ ] iPhone 12 (390x844) - Has notch
- [ ] iPhone SE (375x667) - No notch
- [ ] Samsung Galaxy S21 (360x800) - Punch hole
- [ ] Pixel 5 (393x851) - No notch
- [ ] Small phone (320x568) - Edge case

### Tablets
- [ ] iPad Pro 11" (834x1194)
- [ ] iPad Mini (768x1024)
- [ ] Android tablet (800x1280)

### Desktop
- [ ] Laptop (1366x768)
- [ ] Desktop HD (1920x1080)
- [ ] Large desktop (2560x1440)

---

## 1. Mobile Account Menu Testing

### Bottom Navigation
**Screen sizes**: 320px - 767px

- [ ] **Visual Check**: Account icon visible and properly sized
- [ ] **Visual Check**: Icon color correct (slate-500 inactive, blue-600 active)
- [ ] **Visual Check**: Label "Account" displays below icon
- [ ] **Visual Check**: Bottom nav has white background with top border
- [ ] **Visual Check**: Safe area padding visible on notched devices

### Account Bottom Sheet
**Trigger**: Tap Account in bottom nav

- [ ] **Animation**: Sheet slides up smoothly (0.3s duration)
- [ ] **Visual Check**: Backdrop is semi-transparent with blur effect
- [ ] **Visual Check**: Handle bar centered at top of sheet
- [ ] **Visual Check**: "Account" heading displays correctly
- [ ] **Visual Check**: Profile menu item with UserCircle icon visible
- [ ] **Visual Check**: Sign Out menu item with LogOut icon in red
- [ ] **Visual Check**: Divider line between Profile and Sign Out
- [ ] **Visual Check**: All menu items have 48px min-height (easy to tap)
- [ ] **Visual Check**: Sheet has rounded top corners (rounded-t-2xl)
- [ ] **Visual Check**: Bottom spacing accounts for safe area on notched devices

### Interactions
- [ ] **Interaction**: Tap backdrop → sheet closes
- [ ] **Interaction**: Press Escape → sheet closes
- [ ] **Interaction**: Tap Profile → sheet closes, stays on dashboard
- [ ] **Interaction**: Tap Sign Out → logs out, redirects to /login
- [ ] **Visual Check**: Closing animation smooth (slides down)

**Screenshot Required**: Bottom sheet open on iPhone 14 Pro

---

## 2. Mobile Spacing Testing

### Dashboard Page
**Screen sizes**: 320px - 767px

- [ ] **Visual Check**: Content has 24px (p-6) padding on sides
- [ ] **Visual Check**: Bottom padding clears bottom navigation
- [ ] **Visual Check**: Last task fully visible (not cut off)
- [ ] **Visual Check**: Scrolling smooth, no layout jumps
- [ ] **Visual Check**: Section headings have 20px (mb-5) bottom margin

### Safe Area (Notched Devices Only)
**Devices**: iPhone X, 11, 12, 13, 14 series

- [ ] **Visual Check**: Bottom nav respects safe area (notch visible below nav)
- [ ] **Visual Check**: Content clears bottom nav + safe area (no overlap)
- [ ] **Visual Check**: Account sheet bottom clears safe area

**Screenshot Required**: Dashboard bottom on iPhone 14 Pro showing safe area

---

## 3. Responsive Typography Testing

### Mobile (320px - 767px)
- [ ] **Visual Check**: Page title: 24px (text-2xl)
- [ ] **Visual Check**: Section headings: 16px (text-base)
- [ ] **Visual Check**: Task titles: 14px (text-sm)
- [ ] **Visual Check**: Task descriptions: 12px (text-xs)
- [ ] **Visual Check**: Body text: 14px (text-sm)
- [ ] **Visual Check**: Metric labels: 12px (text-xs)
- [ ] **Visual Check**: Metric values: 24px (text-2xl)

### Tablet (768px - 1023px)
- [ ] **Visual Check**: Page title: 30px (text-3xl)
- [ ] **Visual Check**: Section headings: 18px (text-lg)
- [ ] **Visual Check**: Task titles: 16px (text-base)
- [ ] **Visual Check**: Task descriptions: 14px (text-sm)
- [ ] **Visual Check**: Body text: 16px (text-base)
- [ ] **Visual Check**: Metric labels: 14px (text-sm)
- [ ] **Visual Check**: Metric values: 30px (text-3xl)

### Desktop (1024px+)
- [ ] **Visual Check**: Page title: 36px (text-4xl) on large screens
- [ ] **Visual Check**: All text comfortably readable
- [ ] **Visual Check**: No overly large or small text

### Resize Testing
- [ ] **Visual Check**: Text scales smoothly during resize (no jumps)
- [ ] **Visual Check**: Line heights adjust proportionally
- [ ] **Visual Check**: No text overflow or wrapping issues

**Screenshot Required**: Side-by-side mobile vs desktop typography

---

## 4. Spacing and Layout Testing

### Dashboard Main Container
- [ ] **Visual Check**: Mobile: 24px padding (p-6)
- [ ] **Visual Check**: Desktop: 40px padding (md:p-10)
- [ ] **Visual Check**: Sections have 32px vertical spacing (space-y-8)
- [ ] **Visual Check**: Layout feels spacious, not cramped

### Metrics Grid
- [ ] **Visual Check**: Mobile: 1 column layout
- [ ] **Visual Check**: Tablet: 2 columns
- [ ] **Visual Check**: Desktop: 4 columns
- [ ] **Visual Check**: Mobile gap: 20px (gap-5)
- [ ] **Visual Check**: Desktop gap: 24px (md:gap-6)
- [ ] **Visual Check**: Cards have equal heights

### Metric Cards
- [ ] **Visual Check**: Mobile: 20px padding (p-5)
- [ ] **Visual Check**: Desktop: 24px padding (md:p-6)
- [ ] **Visual Check**: Icon backgrounds: 40x40px with 8px border-radius
- [ ] **Visual Check**: 12px spacing between icon/label/value (space-y-3)
- [ ] **Visual Check**: Hover shadow transition smooth

### Task List
- [ ] **Visual Check**: 20px vertical spacing between tasks (space-y-5)
- [ ] **Visual Check**: Add Task button aligned right
- [ ] **Visual Check**: Button has 48px min-height (touch-friendly)

### Task Cards
- [ ] **Visual Check**: Mobile: 20px padding (p-5)
- [ ] **Visual Check**: Desktop: 24px padding (md:p-6)
- [ ] **Visual Check**: 12-16px gap between checkbox and content
- [ ] **Visual Check**: Priority badge properly aligned
- [ ] **Visual Check**: Edit/Delete buttons aligned right
- [ ] **Visual Check**: Icon buttons have 44x44px touch targets

**Screenshot Required**: Metrics grid and task list showing spacing

---

## 5. Task Form and Modal Testing

### Task Modal
- [ ] **Visual Check**: Modal centered on screen
- [ ] **Visual Check**: Backdrop semi-transparent with blur
- [ ] **Visual Check**: Modal has rounded corners (rounded-xl)
- [ ] **Visual Check**: Modal shadow visible (shadow-2xl)
- [ ] **Visual Check**: Close button in top-right has 44x44px touch target
- [ ] **Visual Check**: Mobile: 20px padding (p-5)
- [ ] **Visual Check**: Desktop: 24px padding (md:p-6)
- [ ] **Visual Check**: Max width 672px (max-w-2xl)

### Floating Labels - Title Input
- [ ] **Visual Check**: Initial state: Label at placeholder position (slate-500)
- [ ] **Interaction**: Click input → label floats to top-left
- [ ] **Visual Check**: Floating state: Label at top (12px, blue-600)
- [ ] **Interaction**: Type text → label stays at top
- [ ] **Interaction**: Delete all text → label returns to placeholder
- [ ] **Visual Check**: Transition smooth (duration-200)
- [ ] **Visual Check**: Input has 56px min-height
- [ ] **Visual Check**: Text doesn't overlap label when typing

### Floating Labels - Description Textarea
- [ ] **Visual Check**: Label behavior same as title
- [ ] **Visual Check**: Textarea expands with content (3 rows default)
- [ ] **Visual Check**: Character counter updates (x/2000)

### Floating Labels - Priority Select
- [ ] **Visual Check**: Label always at top (field has default value)
- [ ] **Visual Check**: Custom dropdown arrow visible
- [ ] **Visual Check**: Options: High, Medium, Low
- [ ] **Interaction**: Select changes update immediately

### Form Validation
- [ ] **Interaction**: Submit empty form → inline error below title
- [ ] **Visual Check**: Error message: "Title is required"
- [ ] **Visual Check**: Error has red background (bg-red-50)
- [ ] **Interaction**: Type 256 characters → error appears
- [ ] **Visual Check**: Character counter turns red when over limit

### Submit Button
- [ ] **Visual Check**: Button has 48px min-height
- [ ] **Visual Check**: Plus icon on Create, Save icon on Update
- [ ] **Interaction**: Click submit → button shows loading spinner
- [ ] **Visual Check**: Button disabled during submit (opacity-50)

**Screenshot Required**: Modal with all form fields, labels in floating state

---

## 6. Error Handling Visual Testing

### Network Error
**Trigger**: Disable network, try creating task

- [ ] **Visual Check**: Inline error appears below affected task
- [ ] **Visual Check**: Error message: "Unable to connect. Check your internet connection."
- [ ] **Visual Check**: Retry button visible with ghost styling
- [ ] **Visual Check**: Task border changes to red (border-red-200)
- [ ] **Interaction**: Click retry → error clears, request retries

### Server Error (500)
**Trigger**: Mock 500 response

- [ ] **Visual Check**: Error message: "Something went wrong on our end. Please try again."
- [ ] **Visual Check**: Retry button works

### Session Expired (401)
**Trigger**: Mock 401 response or wait for session expiry

- [ ] **Visual Check**: Redirects to /login
- [ ] **Visual Check**: Error message shown: "Your session has expired. Please sign in again."

### Optimistic Update Rollback
**Trigger**: Network error during task creation

- [ ] **Visual Check**: Task appears immediately (optimistic)
- [ ] **Visual Check**: Task has blue border (optimistic-pending)
- [ ] **Visual Check**: Spinner visible on task
- [ ] **Interaction**: Error occurs → task removes from list (rollback)
- [ ] **Visual Check**: Error notification appears

**Screenshot Required**: Inline error with retry button

---

## 7. Animation and Transitions

### Bottom Sheet Animation
- [ ] **Visual Check**: Slides up smoothly (0.3s cubic-bezier)
- [ ] **Visual Check**: Backdrop fades in simultaneously
- [ ] **Visual Check**: No jank or stuttering
- [ ] **Visual Check**: Closes with slide down animation

### Task List Stagger
- [ ] **Visual Check**: Tasks fade in one after another
- [ ] **Visual Check**: 100ms delay between each (index * 0.1)
- [ ] **Visual Check**: Smooth spring-like ease

### Metric Cards Stagger
- [ ] **Visual Check**: Cards animate in left to right
- [ ] **Visual Check**: Opacity + Y position transition
- [ ] **Visual Check**: No layout shift during animation

### Hover Effects
- [ ] **Visual Check**: Task cards: Shadow intensifies on hover
- [ ] **Visual Check**: Metric cards: Shadow + border color change
- [ ] **Visual Check**: Buttons: Background color darkens
- [ ] **Visual Check**: Transitions smooth (duration-200 to duration-300)

### Checkbox Animation
- [ ] **Interaction**: Toggle checkbox → celebratory scale animation
- [ ] **Visual Check**: Blue to green transition
- [ ] **Visual Check**: Checkmark draws smoothly

**Screenshot Required**: Staggered animation mid-sequence (video preferred)

---

## 8. Color and Contrast Testing

### Color Palette Verification
- [ ] **Visual Check**: Primary white: #ffffff (backgrounds)
- [ ] **Visual Check**: Secondary slate: #f8fafc (page background)
- [ ] **Visual Check**: Tech blue: #2563eb (accents, links, active states)
- [ ] **Visual Check**: Text slate-900: #0f172a (headings)
- [ ] **Visual Check**: Text slate-600: #475569 (body)
- [ ] **Visual Check**: Text slate-500: #64748b (labels)

### Contrast Ratios (WCAG AA: 4.5:1 minimum)
- [ ] **Test**: slate-900 on white → Should pass
- [ ] **Test**: slate-600 on white → Should pass
- [ ] **Test**: blue-600 on white → Should pass
- [ ] **Test**: Red error text on red-50 → Should pass
- [ ] **Test**: Placeholder text (slate-400) → Should pass

**Tool**: Use Chrome DevTools contrast checker or WebAIM

---

## 9. Accessibility Testing

### Keyboard Navigation
- [ ] **Interaction**: Tab through form → order logical
- [ ] **Interaction**: Tab to Add Task button → focus visible
- [ ] **Interaction**: Enter on button → opens modal
- [ ] **Interaction**: Tab through modal form → all fields reachable
- [ ] **Interaction**: Escape in modal → closes modal
- [ ] **Interaction**: Shift+Tab → reverse navigation works

### Focus States
- [ ] **Visual Check**: Focus ring visible on all interactive elements
- [ ] **Visual Check**: Ring color: blue-500 with 30% opacity
- [ ] **Visual Check**: Ring offset: 2px
- [ ] **Visual Check**: Ring not blocked by other elements

### Screen Reader (Manual Test)
- [ ] **Test**: VoiceOver/NVDA announces modal title
- [ ] **Test**: Form labels properly associated with inputs
- [ ] **Test**: Buttons have descriptive labels
- [ ] **Test**: Error messages announced
- [ ] **Test**: Loading states announced

### Touch Targets (Minimum 44x44px)
- [ ] **Visual Check**: All buttons 44x44px or larger
- [ ] **Visual Check**: Form inputs 56px tall (extra for floating label)
- [ ] **Visual Check**: Icon buttons 44x44px
- [ ] **Visual Check**: Bottom nav items 48px tall
- [ ] **Visual Check**: Account sheet menu items 48px tall

**Tool**: Use Accessibility Insights overlay

---

## 10. Cross-Browser Testing

### Chrome (Latest)
- [ ] **Visual Check**: All layouts correct
- [ ] **Visual Check**: Backdrop blur works
- [ ] **Visual Check**: Safe area insets work
- [ ] **Visual Check**: Animations smooth

### Firefox (Latest)
- [ ] **Visual Check**: All layouts match Chrome
- [ ] **Visual Check**: Backdrop blur works (v103+)
- [ ] **Visual Check**: No vendor prefix issues

### Safari (iOS 14+)
- [ ] **Visual Check**: All layouts correct
- [ ] **Visual Check**: Backdrop blur works
- [ ] **Visual Check**: Safe area insets work (critical)
- [ ] **Visual Check**: -webkit prefixes working

### Safari (macOS)
- [ ] **Visual Check**: Desktop layout correct
- [ ] **Visual Check**: Backdrop blur works
- [ ] **Visual Check**: Form inputs styled correctly

### Edge (Latest)
- [ ] **Visual Check**: Matches Chrome behavior
- [ ] **Visual Check**: No Chromium-specific issues

**Screenshot Required**: Side-by-side Chrome vs Safari

---

## 11. Performance Visual Checks

### Loading States
- [ ] **Visual Check**: Skeleton loaders maintain layout structure
- [ ] **Visual Check**: No Cumulative Layout Shift (CLS)
- [ ] **Visual Check**: Smooth transition from skeleton to content

### Image Loading
- [ ] **Visual Check**: No layout shift when images load
- [ ] **Visual Check**: Placeholder dimensions match actual image

### Font Loading
- [ ] **Visual Check**: No FOUT (Flash of Unstyled Text)
- [ ] **Visual Check**: Fallback fonts similar to web fonts

**Tool**: Chrome DevTools Performance tab, check for layout shifts

---

## 12. Edge Cases

### Very Long Text
- [ ] **Test**: 255-character task title → doesn't break layout
- [ ] **Test**: 2000-character description → line-clamp works
- [ ] **Visual Check**: Text truncates with ellipsis

### No Tasks
- [ ] **Visual Check**: Empty state displays with illustration
- [ ] **Visual Check**: CTA button "Create your first task" works
- [ ] **Visual Check**: Layout centered and attractive

### Many Tasks (100+)
- [ ] **Visual Check**: Scroll performance smooth
- [ ] **Visual Check**: No layout issues
- [ ] **Visual Check**: Virtualization (if implemented) works

### Slow Network
- [ ] **Visual Check**: Loading states visible long enough
- [ ] **Visual Check**: Optimistic updates feel instant
- [ ] **Visual Check**: No flash of incorrect state

### Offline Mode
- [ ] **Visual Check**: Error message appropriate
- [ ] **Visual Check**: Retry button works when back online

---

## Sign-Off

### Tester Information
- **Tester Name**: ___________________________
- **Date**: ___________________________
- **Environment**: Production / Staging / Local
- **Browser**: ___________________________
- **Device**: ___________________________

### Overall Assessment
- [ ] **Pass**: All critical items checked
- [ ] **Pass with Issues**: Minor issues documented
- [ ] **Fail**: Major issues found, needs rework

### Issues Found
1. ________________________________________________
2. ________________________________________________
3. ________________________________________________

### Screenshots Attached
- [ ] Bottom sheet on iPhone 14 Pro
- [ ] Safe area spacing on notched device
- [ ] Mobile vs desktop typography comparison
- [ ] Metrics grid and task list spacing
- [ ] Modal with floating labels
- [ ] Inline error with retry button
- [ ] Cross-browser comparison

### Approval
- [ ] **Approved by**: ___________________________
- [ ] **Date**: ___________________________
