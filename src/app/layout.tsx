import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProvider } from "@/lib/store";

export const metadata: Metadata = {
  title: {
    default: "AssignmentFlow — finish today's step",
    template: "%s · AssignmentFlow",
  },
  description:
    "Break big assignments into small daily targets. Earn rewards, rest guilt-free, and finish one step at a time.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#3556c8",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}