"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Consentimento de cookies do Tuli Store Beauty.
 * Salvo no localStorage na chave TSB_COOKIE_CONSENT_KEY.
 * Vigência: 12 meses (após esse período, o banner reaparece).
 */

export const TSB_COOKIE_CONSENT_KEY = "tsb_cookie_consent";
export const TSB_COOKIE_CONSENT_TTL_MS = 1000 * 60 * 60 * 24 * 365; // 12 meses
/** Evento customizado disparado quando o consentimento muda. */
export const TSB_COOKIE_CONSENT_EVENT = "tsb:cookie-consent-change";
/** Evento customizado disparado quando o usuário pede para reabrir o banner. */
export const TSB_COOKIE_REOPEN_EVENT = "tsb:cookie-reopen-banner";

export type CookieConsentStatus = "unknown" | "accepted" | "rejected" | "customized";

export type CookieConsent = {
  status: CookieConsentStatus;
  /** Categoria: captcha (Cloudflare Turnstile) */
  captcha: boolean;
  /** Timestamp ISO da escolha */
  savedAt: string | null;
};

const DEFAULT_CONSENT: CookieConsent = {
  status: "unknown",
  captcha: false,
  savedAt: null,
};

function readFromStorage(): CookieConsent {
  if (typeof window === "undefined") return DEFAULT_CONSENT;
  try {
    const raw = window.localStorage.getItem(TSB_COOKIE_CONSENT_KEY);
    if (!raw) return DEFAULT_CONSENT;
    const parsed = JSON.parse(raw) as Partial<CookieConsent>;
    // Validar TTL
    if (parsed.savedAt) {
      const savedAt = Date.parse(parsed.savedAt);
      if (Number.isNaN(savedAt)) return DEFAULT_CONSENT;
      const age = Date.now() - savedAt;
      if (age > TSB_COOKIE_CONSENT_TTL_MS) {
        // Expirou — limpa e reaplica banner
        window.localStorage.removeItem(TSB_COOKIE_CONSENT_KEY);
        return DEFAULT_CONSENT;
      }
    }
    return {
      status: parsed.status ?? "unknown",
      captcha: Boolean(parsed.captcha),
      savedAt: parsed.savedAt ?? null,
    };
  } catch {
    return DEFAULT_CONSENT;
  }
}

function write(consent: Omit<CookieConsent, "savedAt">): CookieConsent {
  const full: CookieConsent = { ...consent, savedAt: new Date().toISOString() };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(TSB_COOKIE_CONSENT_KEY, JSON.stringify(full));
      // Notifica componentes que dependem do consentimento (ex.: para liberar o Turnstile)
      window.dispatchEvent(new CustomEvent(TSB_COOKIE_CONSENT_EVENT, { detail: full }));
    } catch {
      // ignore quota / private mode errors
    }
  }
  return full;
}

/**
 * Hook que controla o consentimento de cookies.
 * Lê o valor inicial do localStorage no cliente e expõe setters
 * para aceitar / rejeitar / personalizar / reabrir o banner.
 */
export function useCookieConsent() {
  const [consent, setConsent] = useState<CookieConsent>(DEFAULT_CONSENT);
  const [bannerOpen, setBannerOpen] = useState(false);

  // Lê o consentimento salvo no mount e abre o banner se não houver.
  useEffect(() => {
    const stored = readFromStorage();
    setConsent(stored);
    if (stored.status === "unknown") {
      // Pequeno delay para evitar flash de layout
      const t = window.setTimeout(() => setBannerOpen(true), 300);
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, []);

  // Escuta mudanças de outras abas/components (ex.: clique em "Gerenciar cookies" no rodapé)
  useEffect(() => {
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<CookieConsent>).detail;
      if (detail) setConsent(detail);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === TSB_COOKIE_CONSENT_KEY) setConsent(readFromStorage());
    };
    // Escuta pedidos para reabrir o banner (ex.: do CookieManageLink no rodapé)
    const onReopen = () => setBannerOpen(true);
    window.addEventListener(TSB_COOKIE_CONSENT_EVENT, onChange);
    window.addEventListener("storage", onStorage);
    window.addEventListener(TSB_COOKIE_REOPEN_EVENT, onReopen);
    return () => {
      window.removeEventListener(TSB_COOKIE_CONSENT_EVENT, onChange);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(TSB_COOKIE_REOPEN_EVENT, onReopen);
    };
  }, []);

  const acceptAll = useCallback(() => {
    const next = write({ status: "accepted", captcha: true });
    setConsent(next);
    setBannerOpen(false);
  }, []);

  const rejectNonEssential = useCallback(() => {
    const next = write({ status: "rejected", captcha: false });
    setConsent(next);
    setBannerOpen(false);
  }, []);

  const customize = useCallback((captcha: boolean) => {
    const next = write({ status: "customized", captcha });
    setConsent(next);
    setBannerOpen(false);
  }, []);

  const reopenBanner = useCallback(() => {
    setBannerOpen(true);
  }, []);

  return {
    consent,
    bannerOpen,
    acceptAll,
    rejectNonEssential,
    customize,
    reopenBanner,
  };
}
