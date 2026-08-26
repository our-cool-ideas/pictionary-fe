import type { Metadata } from "next";
import { Geist, Geist_Mono, Fredoka, Comic_Neue } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Player-app-only ("gamified" theme — see globals.css's --font-play-* tokens).
// Loaded globally here (next/font requires a module-level call) but only
// actually rendered where a component opts into `font-play-display`/
// `font-play-body` — the admin panel never does, so it stays on Geist.
const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const comicNeue = Comic_Neue({
  variable: "--font-comic-neue",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Pictionary",
  description: "A Pictionary-style multiplayer drawing and guessing game",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fredoka.variable} ${comicNeue.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
