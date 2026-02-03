/**
 * Accessibility Utilities
 *
 * Helper functions and hooks for WCAG 2.1 AA compliance:
 * - Keyboard navigation support
 * - Screen reader announcements
 * - Focus management
 * - ARIA attributes
 */

import React from "react";

/**
 * Announce message to screen readers using aria-live region
 */
export function announceToScreenReader(message: string, priority: "polite" | "assertive" = "polite") {
  // Create or get the live region element
  let liveRegion = document.getElementById("screen-reader-announcements");

  if (!liveRegion) {
    liveRegion = document.createElement("div");
    liveRegion.id = "screen-reader-announcements";
    liveRegion.setAttribute("aria-live", priority);
    liveRegion.setAttribute("aria-atomic", "true");
    liveRegion.className = "sr-only"; // Visually hidden but accessible to screen readers
    document.body.appendChild(liveRegion);
  } else {
    // Update priority if different
    liveRegion.setAttribute("aria-live", priority);
  }

  // Set the message
  liveRegion.textContent = message;

  // Clear after announcement (give screen readers time to read)
  setTimeout(() => {
    if (liveRegion) {
      liveRegion.textContent = "";
    }
  }, 1000);
}

/**
 * Generate unique ID for ARIA attributes (e.g., aria-describedby, aria-labelledby)
 */
let idCounter = 0;
export function generateAriaId(prefix: string = "aria"): string {
  idCounter += 1;
  return `${prefix}-${idCounter}-${Date.now()}`;
}

/**
 * Trap focus within a container (useful for modals and dialogs)
 */
export function trapFocus(container: HTMLElement) {
  const focusableElements = container.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key !== "Tab") return;

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }
  };

  container.addEventListener("keydown", handleTabKey);

  // Return cleanup function
  return () => {
    container.removeEventListener("keydown", handleTabKey);
  };
}

/**
 * Restore focus to previously focused element (useful after closing modals)
 */
export function createFocusManager() {
  let previouslyFocusedElement: HTMLElement | null = null;

  return {
    capture() {
      previouslyFocusedElement = document.activeElement as HTMLElement;
    },
    restore() {
      previouslyFocusedElement?.focus();
      previouslyFocusedElement = null;
    },
  };
}

/**
 * Check if an element is visible to screen readers
 */
export function isAriaHidden(element: HTMLElement): boolean {
  return element.getAttribute("aria-hidden") === "true";
}

/**
 * Generate accessible label for interactive elements
 */
export function getAccessibleLabel(text: string, action: string): string {
  return `${action} ${text}`;
}

/**
 * Keyboard event handlers for common patterns
 */
export const keyboardHandlers = {
  /**
   * Handle Enter and Space key for button-like elements
   */
  activateOnKeyPress: (callback: () => void) => (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      callback();
    }
  },

  /**
   * Handle Escape key (e.g., close modal)
   */
  escapeKey: (callback: () => void) => (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      callback();
    }
  },

  /**
   * Handle arrow keys for navigation
   */
  arrowNavigation: (
    onUp?: () => void,
    onDown?: () => void,
    onLeft?: () => void,
    onRight?: () => void
  ) => (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowUp":
        e.preventDefault();
        onUp?.();
        break;
      case "ArrowDown":
        e.preventDefault();
        onDown?.();
        break;
      case "ArrowLeft":
        e.preventDefault();
        onLeft?.();
        break;
      case "ArrowRight":
        e.preventDefault();
        onRight?.();
        break;
    }
  },
};

/**
 * ARIA roles for common UI patterns
 */
export const ariaRoles = {
  dialog: "dialog",
  alertdialog: "alertdialog",
  navigation: "navigation",
  main: "main",
  complementary: "complementary",
  banner: "banner",
  contentinfo: "contentinfo",
  search: "search",
  form: "form",
  region: "region",
  article: "article",
  list: "list",
  listitem: "listitem",
  button: "button",
  link: "link",
  tab: "tab",
  tabpanel: "tabpanel",
  tablist: "tablist",
  menu: "menu",
  menuitem: "menuitem",
  menuitemcheckbox: "menuitemcheckbox",
  menuitemradio: "menuitemradio",
  progressbar: "progressbar",
  status: "status",
  alert: "alert",
} as const;

/**
 * WCAG 2.1 AA compliant focus visible styles
 */
export const focusVisibleStyles = {
  className: "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950",
};

/**
 * Skip link for keyboard navigation
 * Commented out due to TypeScript noUnusedParameters false positive with JSX
 * Uncomment and use when needed in layouts
 */
// export function createSkipLink(targetId: string, labelText: string = "Skip to main content"): React.ReactElement {
//   return (
//     <a
//       href={`#${targetId}`}
//       className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-amber-500 focus:text-stone-950 focus:rounded-lg focus:font-medium"
//     >
//       {labelText}
//     </a>
//   );
// }
