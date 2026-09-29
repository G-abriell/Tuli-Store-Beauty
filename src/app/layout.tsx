import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import CookieBanner from "@/components/CookieBanner";
import { ConditionalTurnstile } from "@/components/ConditionalTurnstile";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-dm-sans"
});

export const metadata: Metadata = {
  title: "Tuli Store Beauty",
  description: "Loja virtual de cosméticos e acessórios de beleza.",
  icons: {
    icon: [{ url: "/logo-favicon.jpeg", type: "image/jpeg" }],
    shortcut: [{ url: "/logo-favicon.jpeg", type: "image/jpeg" }],
    apple: [{ url: "/logo-favicon.jpeg", type: "image/jpeg" }]
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={dmSans.variable}>
      <head>
        <meta charSet="utf-8" />
      </head>
      <body className={dmSans.className}>
        {/* Script do Turnstile só é carregado após consentimento explícito do usuário
            (cookie não essencial conforme Política de Cookies). */}
        <ConditionalTurnstile />
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
