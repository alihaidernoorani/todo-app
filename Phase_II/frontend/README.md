# Modern UI/UX Dashboard - Frontend

High-performance luxury-grade Next.js 16 dashboard with **Midnight Stone** aesthetic and futuristic design enhancements.

## Design System: Cyber-Minimalism

### Visual Language

- **Midnight Stone Palette**: Deep blacks (#0c0a09), amber accents (#f59e0b)
- **Glassmorphism**: Transparent layers with backdrop-blur effects
- **Digital Textures**: Subtle noise filters on backgrounds
- **1px Ghost Borders**: Ultra-subtle edge definition (rgba(255,255,255,0.08))
- **Neon Glows**: Strategic amber/cyan accent glows for interactive states

### Typography

- **Headers**: Playfair Display (serif, elegant) - `.heading-futuristic`
- **UI/Data**: Inter (sans-serif, highly readable)

### Key CSS Utilities

```css
/* Glassmorphism */
.glass                  /* Standard glass card */
.glass-dark             /* Darker glass variant */
.glass-card             /* Glass card with padding */

/* Ghost Borders */
.border-ghost           /* 1px ultra-subtle border */
.border-ghost-amber     /* 1px amber-tinted border */

/* Neon Glows */
.glow-amber             /* Amber neon glow effect */
.glow-amber-subtle      /* Subtle amber glow */
.glow-cyan              /* Cyan neon glow */

/* Tactile Interactions */
.tactile-button         /* 3D deforming button effect */
.optimistic-pending     /* Pulsing glow for pending states */
.optimistic-synced      /* Subtle green for synced states */

/* Command Center */
.command-panel          /* High-end panel with accents */
.heading-futuristic     /* Gradient text heading */
.text-glow              /* Text with shadow glow */

/* Loading States */
.shimmer                /* Animated gradient skeleton */
```

### Status Indicators

```jsx
<div className="status-dot status-dot-active" />   // Green pulsing dot
<div className="status-dot status-dot-pending" />  // Amber glowing dot
<div className="status-dot status-dot-error" />    // Red solid dot
```

## Tech Stack

- **Framework**: Next.js 16 (App Router, React Server Components)
- **UI Library**: React 19 (useOptimistic for instant updates)
- **Styling**: Tailwind CSS v4 + Custom CSS Layers
- **Animations**: Framer Motion (spring physics)
- **Authentication**: Better Auth (JWT in HttpOnly cookies)
- **Icons**: Lucide React
- **Fonts**: Inter + Playfair Display (Google Fonts)

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Copy `.env.local.example` to `.env.local` and configure:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
BETTER_AUTH_SECRET=<same-as-backend>
BETTER_AUTH_URL=http://localhost:3000
```

### 3. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Project Structure

```
frontend/
├── app/
│   ├── (auth)/              # Authentication routes (no sidebar)
│   │   └── sign-in/         # Sign-in page
│   ├── (dashboard)/         # Dashboard routes (with sidebar)
│   │   └── page.tsx         # Main dashboard
│   ├── api/auth/            # Better Auth API routes
│   ├── layout.tsx           # Root layout (fonts, providers)
│   └── globals.css          # Futuristic design system CSS
├── components/
│   ├── ui/                  # Atomic components
│   ├── layout/              # Sidebar, Topbar, MobileNav
│   ├── dashboard/           # Dashboard-specific components
│   └── atoms/               # Base atomic components
├── lib/
│   ├── api/                 # API client and methods
│   ├── auth/                # Better Auth utilities
│   ├── hooks/               # Custom React hooks
│   └── utils/               # Helper functions
└── public/                  # Static assets
```

## Design Principles

### 1. **Zero Layout Shift (CLS = 0px)**
- All skeleton loaders match final component dimensions
- Fixed heights for metric cards
- Pre-allocated space for dynamic content

### 2. **Sub-100ms Perceived Latency**
- React 19 `useOptimistic` for instant UI updates
- Optimistic mutations with rollback on error
- Shimmer loaders for streaming SSR

### 3. **High-End Command Center Aesthetic**
- Deep black backgrounds with digital texture overlay
- Strategic amber accents for CTAs and highlights
- Glassmorphism for depth and layering
- Neon glows for status indicators and active states

### 4. **Tactile Maximalism**
- Buttons deform on click (3D press effect)
- Smooth spring animations for toggles
- Hover effects with backdrop-blur increase

### 5. **Accessibility First**
- Full ARIA compliance
- Keyboard navigation support
- Focus-visible ring styles
- Proper contrast ratios

## Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
```

## Phase 1 Status: ✅ COMPLETE

- [x] Next.js 16 project initialized
- [x] Tailwind v4 with Midnight Stone design tokens
- [x] Futuristic CSS utilities (glassmorphism, digital textures)
- [x] Route group structure (auth, dashboard)
- [x] TypeScript strict mode configured
- [x] Global styles with cyber-minimalism patterns
- [x] Font loading optimized (Inter, Playfair Display)

**Next Phase**: Phase 2 - Foundational (API Client, Better Auth integration)
