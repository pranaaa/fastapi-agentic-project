import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Menu Muse — AI-powered brand & menu ideation for F&B founders",
  description:
    "Trend-backed product ideas, competitive analysis, unit economics, and a 90-day launch playbook — generated in minutes by a pipeline of specialized agents.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`h-full antialiased ${inter.variable} ${serif.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-[hsl(var(--background))] text-[hsl(var(--foreground))] font-sans">
        <ThemeProvider>
          {children}
          <Toaster position="top-right" theme="dark" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
