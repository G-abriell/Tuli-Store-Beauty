import type { Metadata } from "next";
import "./globals.css";
import CookieBanner from "@/components/CookieBanner";
import { ConditionalTurnstile } from "@/components/ConditionalTurnstile";

export const metadata: Metadata = {
  title: "Tuli Store Beauty",
  description: "Loja virtual de cosméticos e acessórios de beleza.",
  icons: {
    icon: [{ url: "/logo-favicon.jpeg", type: "image/jpeg" }],
    shortcut: [{ url: "/logo-favicon.jpeg", type: "image/jpeg" }],
    apple: [{ url: "/logo-favicon.jpeg", type: "image/jpeg" }]
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
      </head>
      <body>
        {/* Script do Turnstile só é carregado após consentimento explícito do usuário
            (cookie não essencial conforme Política de Cookies). */}
        <ConditionalTurnstile />
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
