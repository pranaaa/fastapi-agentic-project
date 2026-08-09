import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "F&B Ideation — AI-powered brand & menu ideation",
  description:
    "Trend-backed product ideas and a full brand report for F&B founders in minutes.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="dark h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
        <ThemeProvider>
          {children}
          <Toaster position="top-right" theme="dark" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
