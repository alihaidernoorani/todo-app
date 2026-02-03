"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component
 *
 * Catches JavaScript errors in child components, logs errors,
 * and displays a fallback UI instead of crashing the app.
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 *
 * With custom fallback:
 * ```tsx
 * <ErrorBoundary fallback={<CustomErrorUI />}>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details to console
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    // Update state with error info
    this.setState({
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === "production") {
      // Example: Send to Sentry, LogRocket, etc.
      // Sentry.captureException(error, { contexts: { react: errorInfo } });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      // If custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI with glassmorphism styling
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 px-4">
          <div className="max-w-2xl w-full">
            {/* Error card with glassmorphism */}
            <div className="relative bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 shadow-2xl p-8 md:p-12">
              {/* Alert icon with amber glow */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full" />
                  <div className="relative bg-amber-500/10 border border-amber-500/30 rounded-full p-4">
                    <AlertCircle className="w-12 h-12 text-amber-500" />
                  </div>
                </div>
              </div>

              {/* Error title */}
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-white text-center mb-4">
                Something went wrong
              </h1>

              {/* Error description */}
              <p className="text-stone-300 text-center mb-8 font-sans">
                We encountered an unexpected error. Don't worry, your data is safe.
                Try refreshing the page or returning to the dashboard.
              </p>

              {/* Error details (development only) */}
              {process.env.NODE_ENV === "development" && this.state.error && (
                <details className="mb-8 bg-stone-900/50 border border-stone-800 rounded-lg p-4">
                  <summary className="cursor-pointer text-stone-400 font-medium font-sans mb-2">
                    Error Details (Development Only)
                  </summary>
                  <div className="text-xs text-stone-500 font-mono overflow-auto">
                    <p className="mb-2 text-amber-400">{this.state.error.toString()}</p>
                    {this.state.errorInfo && (
                      <pre className="whitespace-pre-wrap break-all">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                </details>
              )}

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {/* Try again button */}
                <button
                  onClick={this.handleReset}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all font-medium font-sans text-white"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>

                {/* Reload page button */}
                <button
                  onClick={this.handleReload}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all font-medium font-sans text-white"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reload Page
                </button>

                {/* Go home button (primary action) */}
                <button
                  onClick={this.handleGoHome}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 hover:border-amber-500/40 transition-all font-medium font-sans text-amber-100"
                >
                  <Home className="w-4 h-4" />
                  Go to Dashboard
                </button>
              </div>
            </div>

            {/* Help text */}
            <p className="text-center text-stone-500 text-sm mt-6 font-sans">
              If this problem persists, please contact support or check the browser console for more details.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-based error boundary helper
 * (Note: React doesn't have built-in hook error boundaries yet,
 * so this is a helper to use with the class-based ErrorBoundary)
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
): React.ComponentType<P> {
  return function WithErrorBoundaryWrapper(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
