import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "AILeaders OS", description: "AILeaders operating system" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
