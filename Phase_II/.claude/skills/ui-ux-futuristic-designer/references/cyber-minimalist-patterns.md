# Cyber-Minimalist UI Patterns Reference

This document contains proven UI patterns for implementing Cyber-Minimalist design language with Glassmorphism, Bento grids, and Neon accents.

## Glassmorphism Components

### Glass Card Component
```jsx
const GlassCard = ({ children, className = "" }) => (
  <div className={`relative rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl ${className}`}>
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl"></div>
    <div className="relative p-6">{children}</div>
  </div>
);
```

### Neon Button Component
```jsx
const NeonButton = ({ children, variant = "primary", onClick }) => {
  const baseClasses = "px-6 py-3 rounded-lg font-semibold transition-all duration-300";
  const variants = {
    primary: "bg-cyan-500 text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-105",
    secondary: "bg-purple-500 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105",
    outline: "border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400/10"
  };

  return (
    <button className={`${baseClasses} ${variants[variant]}`} onClick={onClick}>
      {children}
    </button>
  );
};
```

## Bento Grid Layouts

### 2x2 Bento Grid
```jsx
const BentoGrid2x2 = () => (
  <div className="grid grid-cols-2 gap-4 max-w-4xl mx-auto">
    <div className="col-span-2 row-span-1 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800/50 p-6 border border-white/10 backdrop-blur-sm">
      <h3 className="text-xl font-bold text-white">Header Section</h3>
    </div>
    <div className="rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800/50 p-6 border border-white/10 backdrop-blur-sm">
      <h3 className="text-lg font-semibold text-white">Item 1</h3>
    </div>
    <div className="rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800/50 p-6 border border-white/10 backdrop-blur-sm">
      <h3 className="text-lg font-semibold text-white">Item 2</h3>
    </div>
  </div>
);
```

### 3x1 Tall Panel
```jsx
const TallPanel = () => (
  <div className="rounded-2xl bg-gradient-to-b from-gray-900 to-gray-800/50 p-6 border border-white/10 backdrop-blur-sm min-h-[400px]">
    <h3 className="text-xl font-bold text-white mb-4">Tall Panel Content</h3>
    <div className="space-y-4">
      <div className="h-16 bg-white/5 rounded-xl"></div>
      <div className="h-16 bg-white/5 rounded-xl"></div>
      <div className="h-16 bg-white/5 rounded-xl"></div>
    </div>
  </div>
);
```

## Neon Accent Effects

### Neon Text Glow
```css
.neon-text {
  color: white;
  text-shadow:
    0 0 5px rgba(56, 189, 248, 0.5),
    0 0 10px rgba(56, 189, 248, 0.3),
    0 0 20px rgba(56, 189, 248, 0.2);
}

.neon-text-purple {
  text-shadow:
    0 0 5px rgba(168, 85, 247, 0.5),
    0 0 10px rgba(168, 85, 247, 0.3),
    0 0 20px rgba(168, 85, 247, 0.2);
}
```

### Neon Border Animation
```css
.neon-border {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
}

.neon-border::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(45deg, #06b6d4, #8b5cf6, #06b6d4, #8b5cf6);
  border-radius: 18px;
  z-index: -1;
  animation: borderAnimation 3s linear infinite;
  background-size: 400% 400%;
}

@keyframes borderAnimation {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
```

## Dark Mode Color System

### Base Colors
```javascript
const darkColors = {
  // Backgrounds
  bg_primary: '#0a0a0a',
  bg_secondary: '#0f0f0f',
  bg_surface: '#171717',
  bg_glass: 'rgba(30, 30, 30, 0.3)',

  // Text
  text_primary: '#f5f5f5',
  text_secondary: '#a3a3a3',
  text_tertiary: '#737373',

  // Neons
  neon_cyan: '#06b6d4',
  neon_purple: '#a855f7',
  neon_emerald: '#10b981',
  neon_pink: '#ec4899',

  // Borders
  border_transparent: 'rgba(255, 255, 255, 0.1)'
};
```

## Responsive Patterns

### Adaptive Grid System
```jsx
const ResponsiveGrid = ({ children }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {children}
  </div>
);
```

### Mobile-First Glass Cards
```jsx
const MobileGlassCard = ({ children }) => (
  <div className="w-full rounded-xl bg-gradient-to-br from-gray-900 to-gray-800/50 p-4 border border-white/10 backdrop-blur-sm sm:p-6">
    {children}
  </div>
);
```

## Accessibility Considerations

### High Contrast Focus States
```css
.focus-neon:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.5);
}

.focus-purple:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.5);
}
```

### Semantic HTML with Glassmorphism
```jsx
<article className="rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800/50 border border-white/10 backdrop-blur-sm overflow-hidden">
  <header className="p-6 border-b border-white/10">
    <h2 className="text-xl font-bold text-white">Article Title</h2>
  </header>
  <div className="p-6">
    <p className="text-gray-300">Article content goes here...</p>
  </div>
  <footer className="p-6 border-t border-white/10">
    <time dateTime="2023-01-01" className="text-gray-400">January 1, 2023</time>
  </footer>
</article>
```

These patterns maintain accessibility standards while implementing the Cyber-Minimalist aesthetic.