import type { Metadata } from "next";
import { AppProvider } from "@/components/AppProvider";
import { Shell } from "@/components/Shell";
import { LanguageProvider } from "@/i18n/LanguageProvider";
import "./globals.css";
export const metadata: Metadata = {
  title: "Reality Rank — Your real main game",
  description:
    "Your personal ranked system for real-world growth. Build skills, ship meaningful work, and track what matters.",
  icons: { icon: "/favicon.svg" },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <LanguageProvider>
          <AppProvider>
            <Shell>{children}</Shell>
          </AppProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
