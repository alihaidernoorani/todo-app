import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { WebVitalsReporter } from "@/components/WebVitalsReporter";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppInitializer } from "@/components/AppInitializer";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

// T073: Optimized font loading with next/font for zero layout shift
// Inter for UI elements and data (sans-serif, highly readable)
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap", // Prevents FOIT (Flash of Invisible Text), enables FOUT with fallback
  preload: true, // Preload font files for faster rendering
  fallback: ["system-ui", "arial"], // System font fallback for instant text rendering
});

// Poppins for headers (modern, geometric, highly readable)
const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap", // Prevents FOIT (Flash of Invisible Text), enables FOUT with fallback
  preload: true, // Preload font files for faster rendering
  fallback: ["system-ui", "arial"], // Sans-serif fallback for instant text rendering
});

export const metadata: Metadata = {
  title: "TaskFlow",
  description: "High-performance luxury-grade task management dashboard with clean modern design",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <body className={`${inter.className} relative transition-colors duration-300`}>
        {/* T077: Skip link for keyboard navigation */}
        <a
          href="#main-content"
          className="skip-link"
        >
          Skip to main content
        </a>
        {/* T063: View Transitions API support */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (!document.startViewTransition) {
                document.startViewTransition = function(callback) {
                  callback();
                  return { finished: Promise.resolve(), ready: Promise.resolve() };
                };
              }
            `,
          }}
        />
        {/* Digital texture layer (applied via CSS ::before) */}
        <div className="relative z-10 min-h-screen">
          {/* T071: Web Vitals tracking */}
          <WebVitalsReporter />

          {/* T074: Error boundary for unhandled errors */}
          <ErrorBoundary>
            {/* T075: Environment variable validation */}
            <AppInitializer>
              {/* Theme context provider */}
              <ThemeProvider>
                {/* Auth context provider */}
                <AuthProvider>
                  {children}
                </AuthProvider>
              </ThemeProvider>
            </AppInitializer>
          </ErrorBoundary>
        </div>
      </body>
    </html>
  );
}
