// app/layout.tsx
import "./globals.css";
import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import { QueryProvider } from "./provider";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: {
    default: "Eiga — Private cinema club for serious film discourse",
    template: "%s · Eiga",
  },
  description:
    "Eiga is a private, invite-only cinema club where a small group discusses one film per week in depth.",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000", // lock the browser UI to black
};

const RootLayout = ({ children }: { children: React.ReactNode }) => (
  <html
    lang="en"
    className={`dark ${jetbrainsMono.variable}`} // always dark
    suppressHydrationWarning
  >
    <body className="min-h-dvh antialiased font-mono">
      <QueryProvider>{children}</QueryProvider>
    </body>
  </html>
);

export default RootLayout;