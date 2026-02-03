/**
 * Environment Variable Validation Utility
 *
 * Validates required environment variables on application startup.
 * Throws errors in development for missing variables.
 * Logs warnings in production to avoid crashes.
 */

interface EnvConfig {
  /**
   * Required environment variables (will throw/warn if missing)
   */
  required?: Record<string, string>;

  /**
   * Optional environment variables with defaults
   */
  optional?: Record<string, { default: string; description?: string }>;

  /**
   * Whether to throw errors (development) or just warn (production)
   */
  strict?: boolean;
}

interface ValidatedEnv {
  /**
   * All environment variables (required + optional with defaults)
   */
  vars: Record<string, string>;

  /**
   * Validation status
   */
  isValid: boolean;

  /**
   * Missing required variables
   */
  missing: string[];
}

/**
 * Validate environment variables on startup
 */
export function validateEnv(config: EnvConfig = {}): ValidatedEnv {
  const { required = {}, optional = {}, strict = process.env.NODE_ENV === "development" } = config;

  const missing: string[] = [];
  const validated: Record<string, string> = {};

  // Check required variables
  for (const [key, description] of Object.entries(required)) {
    const value = process.env[key];

    if (!value || value.trim() === "") {
      missing.push(key);

      if (strict) {
        console.error(`[Env Validation] ❌ Missing required environment variable: ${key}`);
        console.error(`[Env Validation]    Description: ${description}`);
      } else {
        console.warn(`[Env Validation] ⚠️ Missing required environment variable: ${key}`);
        console.warn(`[Env Validation]    Description: ${description}`);
      }
    } else {
      validated[key] = value;

      if (process.env.NODE_ENV === "development") {
        console.log(`[Env Validation] ✅ ${key} is set`);
      }
    }
  }

  // Add optional variables with defaults
  for (const [key, { default: defaultValue, description }] of Object.entries(optional)) {
    const value = process.env[key];

    if (!value || value.trim() === "") {
      validated[key] = defaultValue;

      if (process.env.NODE_ENV === "development") {
        console.log(`[Env Validation] ℹ️ ${key} not set, using default: ${defaultValue}`);
        if (description) {
          console.log(`[Env Validation]    Description: ${description}`);
        }
      }
    } else {
      validated[key] = value;

      if (process.env.NODE_ENV === "development") {
        console.log(`[Env Validation] ✅ ${key} is set`);
      }
    }
  }

  const isValid = missing.length === 0;

  // Throw error in strict mode if validation fails
  if (!isValid && strict) {
    const errorMessage = `Environment validation failed. Missing required variables: ${missing.join(", ")}`;
    console.error(`[Env Validation] ${errorMessage}`);
    throw new Error(errorMessage);
  }

  return {
    vars: validated,
    isValid,
    missing,
  };
}

/**
 * Predefined validation for the Todo Dashboard application
 */
export function validateTodoDashboardEnv(): ValidatedEnv {
  // In client-side execution, be less strict as env vars might be bundled differently
  const isClient = typeof window !== "undefined";

  return validateEnv({
    required: {
      NEXT_PUBLIC_API_URL: "Backend API base URL (e.g., http://localhost:8000)",
    },
    optional: {
      NEXT_PUBLIC_ANALYTICS_ENDPOINT: {
        default: "",
        description: "Optional analytics endpoint for Web Vitals tracking",
      },
    },
    // Be less strict on client side, only strict on server side in development
    strict: !isClient && process.env.NODE_ENV === "development",
  });
}

/**
 * Get a validated environment variable
 * Throws error if variable is missing in development
 */
export function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key];

  if (!value || value.trim() === "") {
    if (defaultValue !== undefined) {
      return defaultValue;
    }

    if (process.env.NODE_ENV === "development") {
      throw new Error(`Missing required environment variable: ${key}`);
    }

    console.warn(`[Env] Missing environment variable: ${key}, returning empty string`);
    return "";
  }

  return value;
}

/**
 * Check if we're in a specific environment
 * Safe for both server and client-side execution
 */
export const isDevelopment = typeof process !== "undefined" && process.env.NODE_ENV === "development";
export const isProduction = typeof process !== "undefined" && process.env.NODE_ENV === "production";
export const isTest = typeof process !== "undefined" && process.env.NODE_ENV === "test";

/**
 * Get public environment variables (safe to expose in client bundle)
 * Safe for both server and client-side execution
 */
export function getPublicEnv() {
  return {
    apiUrl: getEnv("NEXT_PUBLIC_API_URL", "http://localhost:8000"),
    analyticsEndpoint: getEnv("NEXT_PUBLIC_ANALYTICS_ENDPOINT", ""),
    environment: (typeof process !== "undefined" ? process.env.NODE_ENV : undefined) || "development",
  };
}
