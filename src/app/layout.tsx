import type { Metadata } from "next";

import "./globals.css";
import { SpeedInsights } from '@vercel/speed-insights/next';

import { ThemeProvider } from "@/components/providers/theme";

export const metadata: Metadata = {
  title: "Collabrixo",
  description: "A productivity tool for teams",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
         <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <SpeedInsights />

          </ThemeProvider>
      </body>
    </html>
  );
}
