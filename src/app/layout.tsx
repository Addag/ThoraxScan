import type { Metadata } from "next";
import { Funnel_Display, Inter } from "next/font/google";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { applySavedDisplayPrefs } from "@/lib/display-prefs";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "800"],
});

const funnelDisplay = Funnel_Display({
  variable: "--font-funnel",
  subsets: ["latin"],
  weight: ["400", "600", "800"],
});

export const metadata: Metadata = {
  title: "ThoraxScan | AI-Assisted Chest X-Ray Learning Platform",
  description:
    "An educational learning platform for guided chest X-ray interpretation practice.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${funnelDisplay.variable}`} suppressHydrationWarning>
      <head>
        {/* Applies the saved theme, text size and contrast before first paint; ThemeIconButton and Settings → Accessibility write the same keys. */}
        <script
          // text/plain on the client stops React's dev warning; the browser only runs it from the server HTML.
          type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: `(${applySavedDisplayPrefs})()` }}
        />
      </head>
      <body>
        {children}
        <SpeedInsights />
        <Analytics/>
      </body>
    </html>
  );
}
