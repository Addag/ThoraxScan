import type { Metadata } from "next";
import { Funnel_Display, Inter } from "next/font/google";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";

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
        {/* Applies the saved theme before first paint; the header ThemeIconButton writes the same key. */}
        <script
          // text/plain on the client stops React's dev warning; the browser only runs it from the server HTML.
          type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(localStorage.getItem("theme")==="light")document.documentElement.setAttribute("data-theme","light")}catch(e){}})()`,
          }}
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
