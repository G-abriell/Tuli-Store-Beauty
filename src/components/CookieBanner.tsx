"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCookieConsent, TSB_COOKIE_REOPEN_EVENT } from "@/lib/use-cookie-consent";

/**
 * Banner de consentimento de cookies.
 *
 * - Aparece no canto inferior da tela, discretamente (não bloqueia a navegação).
 * - Opções: "Aceitar todos", "Apenas essenciais", "Gerenciar preferências".
 * - Salva a escolha no localStorage (12 meses) via hook useCookieConsent.
 * - Quando o usuário abre "Gerenciar preferências", exibe as categorias
 *   individualmente (apenas 1 categoria não essencial hoje: captcha).
 */
export default function CookieBanner() {
  const { consent, bannerOpen, acceptAll, rejectNonEssential, customize, reopenBanner } = useCookieConsent();
  const [showDetails, setShowDetails] = useState(false);
  const [captchaPref, setCaptchaPref] = useState(false);

  // Sincroniza o checkbox de preferência com o consentimento salvo
  useEffect(() => {
    if (consent.status !== "unknown") setCaptchaPref(consent.captcha);
  }, [consent.status, consent.captcha]);

  // Não renderiza nada no servidor (evita flash); só aparece quando bannerOpen é true
  // ou quando o usuário clica em "Gerenciar cookies" no rodapé.
  if (!bannerOpen) return null;

  const handleSavePreferences = () => {
    customize(captchaPref);
  };

  return (
    <div className={`cookieBanner${bannerOpen ? " visible" : ""}`} role="dialog" aria-live="polite" aria-label="Consentimento de cookies">
      <div className="cookieBannerInner">
        <div className="cookieBannerContent">
          <strong>🍪 Sua privacidade</strong>
          <p>
            Usamos apenas cookies essenciais para o funcionamento da loja. Opcionalmente, podemos
            carregar o <strong>captcha anti-bot</strong> do Cloudflare no checkout para sua
            segurança. Você pode aceitar, recusar ou personalizar — leia nossa{" "}
            <Link href="/politica-de-cookies">Política de Cookies</Link>.
          </p>
        </div>
        <div className="cookieBannerActions">
          <button type="button" className="cookieBtn cookieBtnLink" onClick={() => setShowDetails((s) => !s)}>
            {showDetails ? "Ocultar preferências" : "Gerenciar preferências"}
          </button>
          <button type="button" className="cookieBtn" onClick={rejectNonEssential}>
            Apenas essenciais
          </button>
          <button type="button" className="cookieBtn cookieBtnPrimary" onClick={acceptAll}>
            Aceitar todos
          </button>
        </div>

        {showDetails ? (
          <div className="cookieBannerDetails">
            <div className="cookieCategory">
              <div className="cookieCategoryHeader">
                <strong>Essenciais</strong>
                <span className="cookieCategoryStatus required">Sempre ativos</span>
              </div>
              <p>
                Cookies necessários para o funcionamento do painel administrativo (acessado
                apenas pela loja). Não rastreiam sua navegação.
              </p>
            </div>
            <div className="cookieCategory">
              <div className="cookieCategoryHeader">
                <strong>Segurança anti-bot (Cloudflare Turnstile)</strong>
                <span className={`cookieCategoryStatus ${captchaPref ? "enabled" : "disabled"}`}>
                  {captchaPref ? "Ativado" : "Desativado"}
                </span>
              </div>
              <p>
                Carrega script de <code>challenges.cloudflare.com</code> no checkout e envia seu
                IP para validação anti-fraude. Recomendado para sua segurança. Você pode recusar;
                nesse caso o captcha não será exibido.
              </p>
              <label className="cookieCategoryToggle">
                <input
                  type="checkbox"
                  checked={captchaPref}
                  onChange={(e) => setCaptchaPref(e.target.checked)}
                />
                Permitir captcha anti-bot
              </label>
            </div>
            <div className="cookieBannerActions">
              <button type="button" className="cookieBtn cookieBtnPrimary" onClick={handleSavePreferences}>
                Salvar preferências
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Link/botão para reabrir o banner de cookies.
 * Deve ser usado no rodapé da loja para que o usuário possa revisar sua escolha.
 *
 * Dispara um evento global (TSB_COOKIE_REOPEN_EVENT) que o CookieBanner
 * (instanciado no layout raiz) escuta para reabrir o banner. Isso é necessário
 * porque o CookieManageLink e o CookieBanner têm instâncias separadas do hook.
 */
export function CookieManageLink() {
  const handleClick = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(TSB_COOKIE_REOPEN_EVENT));
    }
  };
  return (
    <button type="button" className="cookieManageLink" onClick={handleClick}>
      Gerenciar cookies
    </button>
  );
}
