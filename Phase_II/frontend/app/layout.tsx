import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { WebVitalsReporter } from "@/components/WebVitalsReporter";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppInitializer } from "@/components/AppInitializer";

// T073: Optimized font loading with next/font for zero layout shift
// Inter for UI elements and data (sans-serif, highly readable)
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap", // Prevents FOIT (Flash of Invisible Text), enables FOUT with fallback
  preload: true, // Preload font files for faster rendering
  fallback: ["system-ui", "arial"], // System font fallback for instant text rendering
});

// Playfair Display for headers (serif, elegant)
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap", // Prevents FOIT (Flash of Invisible Text), enables FOUT with fallback
  preload: true, // Preload font files for faster rendering
  fallback: ["Georgia", "serif"], // Serif fallback for instant text rendering
});

export const metadata: Metadata = {
  title: "Command Center - Modern Task Dashboard",
  description: "High-performance luxury-grade task management dashboard with futuristic design",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className={`${inter.className} relative`}>
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
              {children}
            </AppInitializer>
          </ErrorBoundary>
        </div>
      </body>
    </html>
  );
}
