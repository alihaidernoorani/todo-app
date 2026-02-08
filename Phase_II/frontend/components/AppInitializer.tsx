"use client";

import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";

/**
 * App Initializer Component
 *
 * Performs startup validation and initialization:
 * - Validates environment variables
 * - Displays error UI if critical variables are missing
 *
 * Should be included once in the root layout.
 */
export function AppInitializer({ children }: { children: React.ReactNode }) {
  const [initError, setInitError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    try {
      // T075: Validate environment variables on startup
      // Check if critical environment variables are available
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;

      if (!apiUrl || apiUrl.trim() === "") {
        const errorMessage = "Missing required environment variable: NEXT_PUBLIC_API_URL";
        console.error("[AppInitializer]", errorMessage);

        // Only show error UI in production if critical variable is missing
        if (typeof window !== "undefined" && window.location.hostname !== "localhost") {
          setInitError(errorMessage);
        } else {
          // In development, just warn but continue
          console.warn("[AppInitializer] ⚠️ Using default API URL: http://localhost:8000");
        }
      } else {
        // Validation successful
        if (process.env.NODE_ENV === "development") {
          console.log("[AppInitializer] ✅ Environment validation passed");
          console.log("[AppInitializer] ✅ NEXT_PUBLIC_API_URL:", apiUrl);
        }
      }

      setIsInitialized(true);
    } catch (error) {
      console.error("[AppInitializer] Initialization failed:", error);

      if (error instanceof Error) {
        setInitError(error.message);
      } else {
        setInitError("An unexpected initialization error occurred");
      }

      setIsInitialized(true);
    }
  }, []);

  // Show loading state during initialization (brief)
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-stone-400 font-sans">Initializing...</p>
        </div>
      </div>
    );
  }

  // Show error UI if initialization failed
  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 px-4">
        <div className="max-w-lg w-full">
          <div className="relative bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 shadow-2xl p-8">
            {/* Error icon */}
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full" />
                <div className="relative bg-red-500/10 border border-red-500/30 rounded-full p-3">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
              </div>
            </div>

            {/* Error title */}
            <h2 className="text-2xl font-heading font-bold text-white text-center mb-3">
              Configuration Error
            </h2>

            {/* Error message */}
            <p className="text-stone-300 text-center mb-6 font-sans text-sm">
              {initError}
            </p>

            {/* Help text */}
            <div className="bg-stone-900/50 border border-stone-800 rounded-lg p-4">
              <p className="text-stone-400 text-xs font-sans mb-2">
                <strong className="text-stone-300">To fix this:</strong>
              </p>
              <ol className="text-stone-400 text-xs font-sans space-y-1 ml-4 list-decimal">
                <li>Create a <code className="text-amber-400">.env.local</code> file in the project root</li>
                <li>Add the missing environment variables</li>
                <li>Restart the development server</li>
              </ol>
            </div>

            {/* Retry button */}
            <div className="mt-6 text-center">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 hover:border-amber-500/40 transition-all font-medium font-sans text-amber-100 text-sm"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Initialization successful, render children
  return <>{children}</>;
}
