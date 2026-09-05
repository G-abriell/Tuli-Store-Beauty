import type { ReactNode } from "react";
import Link from "next/link";
import { LEGAL_DATA } from "@/lib/legal-data";

type LegalLayoutProps = {
  title: string;
  subtitle: string;
  lastUpdated?: string;
  children: ReactNode;
};

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  const meses = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  const mesNome = meses[parseInt(m, 10) - 1] ?? m;
  return `${parseInt(d, 10)} de ${mesNome} de ${y}`;
}

export default function LegalLayout({ title, subtitle, lastUpdated, children }: LegalLayoutProps) {
  const dataAtual = lastUpdated ?? LEGAL_DATA.ULTIMA_ATUALIZACAO;
  return (
    <main className="legalPage">
      <article className="legalArticle">
        <header className="legalHeader">
          <h1>{title}</h1>
          <p className="legalSubtitle">{subtitle}</p>
          <p className="legalUpdated">Última atualização: {formatDate(dataAtual)}</p>
        </header>
        <div className="legalBody">{children}</div>
        <footer className="legalFooter">
          <hr />
          <p>
            Em caso de dúvidas sobre esta política, entre em contato pelo e-mail{" "}
            <a href={`mailto:${LEGAL_DATA.CONTROLADOR_EMAIL}`}>{LEGAL_DATA.CONTROLADOR_EMAIL}</a>{" "}
            ou WhatsApp <a href={`https://wa.me/5581983143861`} target="_blank" rel="noreferrer">{LEGAL_DATA.CONTROLADOR_WHATSAPP}</a>.
          </p>
          <nav className="legalFooterNav">
            <Link href="/">← Voltar à loja</Link>
            <Link href="/politica-de-privacidade">Política de Privacidade</Link>
            <Link href="/politica-de-cookies">Política de Cookies</Link>
            <Link href="/termos-de-uso">Termos de Uso</Link>
          </nav>
        </footer>
      </article>
    </main>
  );
}
