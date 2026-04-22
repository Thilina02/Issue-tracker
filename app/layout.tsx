import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "Issue Tracker",
  description: "Track and manage issues",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-zinc-50 antialiased dark:bg-zinc-950">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
