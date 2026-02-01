"use client";

import { onCLS, onLCP, onFCP, onTTFB, onINP, type Metric } from "web-vitals";

/**
 * Web Vitals Tracking Utility
 *
 * Measures Core Web Vitals:
 * - CLS (Cumulative Layout Shift) - Target: 0px (zero shift)
 * - LCP (Largest Contentful Paint) - Target: < 2.5s
 * - INP (Interaction to Next Paint) - Target: < 200ms
 *
 * Also tracks additional metrics:
 * - FCP (First Contentful Paint) - Target: < 1.8s
 * - TTFB (Time to First Byte) - Target: < 600ms
 *
 * Note: FID (First Input Delay) was removed in web-vitals v4, replaced by INP
 */

interface WebVitalsConfig {
  /**
   * Enable console logging of metrics (default: false in production)
   */
  debug?: boolean;

  /**
   * Custom analytics endpoint to send metrics
   */
  analyticsEndpoint?: string;

  /**
   * Callback for custom handling of metrics
   */
  onMetric?: (metric: Metric) => void;
}

/**
 * Initialize Web Vitals tracking
 */
export function initWebVitals(config: WebVitalsConfig = {}) {
  const { debug = process.env.NODE_ENV === "development", analyticsEndpoint, onMetric } = config;

  const handleMetric = (metric: Metric) => {
    // Log to console in debug mode
    if (debug) {
      console.log(`[Web Vitals] ${metric.name}:`, {
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
        id: metric.id,
      });
    }

    // Send to analytics endpoint if configured
    if (analyticsEndpoint) {
      sendToAnalytics(analyticsEndpoint, metric);
    }

    // Custom callback
    if (onMetric) {
      onMetric(metric);
    }

    // Alert if thresholds are exceeded (development only)
    if (debug) {
      checkThresholds(metric);
    }
  };

  // Register Core Web Vitals
  onCLS(handleMetric); // Cumulative Layout Shift
  onLCP(handleMetric); // Largest Contentful Paint
  onINP(handleMetric); // Interaction to Next Paint (replaces FID)

  // Register additional metrics
  onFCP(handleMetric); // First Contentful Paint
  onTTFB(handleMetric); // Time to First Byte
}

/**
 * Send metric to analytics endpoint
 */
async function sendToAnalytics(endpoint: string, metric: Metric) {
  try {
    const body = JSON.stringify({
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
      navigationType: metric.navigationType,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    });

    // Use sendBeacon for reliability (doesn't block page unload)
    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, body);
    } else {
      // Fallback to fetch with keepalive
      fetch(endpoint, {
        method: "POST",
        body,
        headers: { "Content-Type": "application/json" },
        keepalive: true,
      }).catch((error) => {
        console.error("[Web Vitals] Failed to send metric:", error);
      });
    }
  } catch (error) {
    console.error("[Web Vitals] Error sending metric:", error);
  }
}

/**
 * Check if metrics exceed performance thresholds
 */
function checkThresholds(metric: Metric) {
  const thresholds: Record<string, { target: number; unit: string }> = {
    CLS: { target: 0.1, unit: "" }, // Target: 0px (0.1 is "good" threshold)
    LCP: { target: 2500, unit: "ms" },
    INP: { target: 200, unit: "ms" },
    FCP: { target: 1800, unit: "ms" },
    TTFB: { target: 600, unit: "ms" },
  };

  const threshold = thresholds[metric.name];
  if (threshold && metric.value > threshold.target) {
    console.warn(
      `[Web Vitals] ⚠️ ${metric.name} exceeds target:`,
      `${metric.value.toFixed(2)}${threshold.unit} > ${threshold.target}${threshold.unit}`,
      `(rating: ${metric.rating})`
    );
  } else if (threshold) {
    console.log(
      `[Web Vitals] ✅ ${metric.name} meets target:`,
      `${metric.value.toFixed(2)}${threshold.unit} <= ${threshold.target}${threshold.unit}`,
      `(rating: ${metric.rating})`
    );
  }
}

/**
 * Get Web Vitals attribution for debugging
 * (Requires web-vitals/attribution import)
 *
 * Note: FID was removed in web-vitals v4, use INP instead
 */
export async function getWebVitalsAttribution() {
  try {
    const { onCLS, onINP, onLCP } = await import("web-vitals/attribution");

    const metrics: Partial<Record<string, Metric>> = {};

    onCLS((metric) => {
      metrics.CLS = metric;
      console.log("[Web Vitals Attribution] CLS:", metric.attribution);
    });

    onINP((metric) => {
      metrics.INP = metric;
      console.log("[Web Vitals Attribution] INP:", metric.attribution);
    });

    onLCP((metric) => {
      metrics.LCP = metric;
      console.log("[Web Vitals Attribution] LCP:", metric.attribution);
    });

    return metrics;
  } catch (error) {
    console.error("[Web Vitals] Attribution not available:", error);
    return {};
  }
}
