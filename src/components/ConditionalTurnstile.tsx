"use client";

import Script from "next/script";
import { useCookieConsent } from "@/lib/use-cookie-consent";

/**
 * Carrega o script do Cloudflare Turnstile APENAS quando:
 * 1. A variável de ambiente NEXT_PUBLIC_TURNSTILE_SITE_KEY está definida; E
 * 2. O usuário deu consentimento explícito (status "accepted" ou "customized" com captcha=true).
 *
 * Antes do consentimento, nenhum script de terceiros é injetado, conforme
 * exigido pela LGPD e pela Política de Cookies do site.
 */
export function ConditionalTurnstile() {
  const { consent } = useCookieConsent();
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  if (!siteKey) return null;

  const consentGiven =
    consent.status === "accepted" ||
    (consent.status === "customized" && consent.captcha === true);

  if (!consentGiven) return null;

  return (
    <Script
      src="https://challenges.cloudflare.com/turnstile/v0/api.js"
      strategy="afterInteractive"
      async
      defer
    />
  );
}
