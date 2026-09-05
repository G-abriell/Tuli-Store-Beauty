import type { Metadata } from "next";
import LegalLayout from "@/components/LegalLayout";
import { LEGAL_DATA, COOKIES_ESSENCIAIS, COOKIES_NAO_ESSENCIAIS } from "@/lib/legal-data";

export const metadata: Metadata = {
  title: "Política de Cookies — Tuli Store Beauty",
  description: "Política de Cookies do site Tuli Store Beauty: quais cookies usamos, finalidade e como gerenciar.",
  robots: { index: true, follow: true },
};

export default function PoliticaDeCookiesPage() {
  return (
    <LegalLayout
      title="Política de Cookies"
      subtitle="Quais cookies e tecnologias similares usamos, e como você pode gerenciá-los."
    >
      <p>
        Esta Política explica quais cookies e tecnologias de armazenamento similares a{" "}
        <strong>{LEGAL_DATA.CONTROLADOR_NOME}</strong> utiliza, com qual finalidade, por quanto
        tempo permanecem e como você pode gerenciar suas preferências.
      </p>

      <h2>1. O que são cookies</h2>
      <p>
        Cookies são pequenos arquivos de texto armazenados no seu navegador quando você visita um
        site. Eles permitem que o site "lembre" de informações sobre sua visita, como preferências
        de idioma ou itens em um carrinho de compras.
      </p>
      <p>
        Além dos cookies, este site também pode usar <strong>armazenamento local</strong>{" "}
        (<em>localStorage</em> / <em>sessionStorage</em>) e carregar <strong>scripts de terceiros</strong>.
        Esta Política cobre todas essas tecnologias.
      </p>

      <h2>2. Categorias de cookies usados por este site</h2>
      <p>
        Os cookies e tecnologias que usamos são divididos em duas categorias:
      </p>

      <h3>2.1. Cookies essenciais</h3>
      <p>
        São necessários para o funcionamento básico do site. Não podem ser desativados, pois
        sem eles o site não funcionaria corretamente (ex.: autenticação do painel administrativo,
        controle de sessão). Estes cookies não rastreiam sua navegação nem coletam dados para marketing.
      </p>
      <table>
        <thead>
          <tr>
            <th>Cookie</th>
            <th>Finalidade</th>
            <th>Duração</th>
            <th>Escopo</th>
          </tr>
        </thead>
        <tbody>
          {COOKIES_ESSENCIAIS.map((c) => (
            <tr key={c.nome}>
              <td><code>{c.nome}</code></td>
              <td>{c.finalidade}</td>
              <td>{c.duracao}</td>
              <td>{c.escopo}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        <strong>Observação:</strong> os cookies essenciais listados acima são definidos apenas
        quando um administrador faz login no painel administrativo (rota <code>/admin</code>).
        Visitantes comuns da loja não recebem nenhum cookie essencial.
      </p>

      <h3>2.2. Cookies e scripts não essenciais (opcionais)</h3>
      <p>
        Não são obrigatórios para o funcionamento do site, mas melhoram a segurança. Estes
        scripts só são carregados após o seu consentimento explícito.
      </p>
      <table>
        <thead>
          <tr>
            <th>Cookie / Script</th>
            <th>Categoria</th>
            <th>Finalidade</th>
            <th>Duração</th>
            <th>Transferência internacional</th>
          </tr>
        </thead>
        <tbody>
          {COOKIES_NAO_ESSENCIAIS.map((c) => (
            <tr key={c.nome}>
              <td><strong>{c.nome}</strong></td>
              <td>{c.categoria}</td>
              <td>{c.finalidade}</td>
              <td>{c.duracao}</td>
              <td>{c.transferenciaInternacional}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>3. Tecnologias que NÃO usamos</h2>
      <p>
        Para sua tranquilidade, este site <strong>NÃO utiliza</strong> nenhuma das seguintes
        tecnologias de rastreamento:
      </p>
      <ul>
        <li>Google Analytics ou Tag Manager;</li>
        <li>Meta Pixel / Facebook Pixel;</li>
        <li>Hotjar, Microsoft Clarity ou outras ferramentas de session replay;</li>
        <li>Netlify Analytics / Netlify RUM;</li>
        <li>Cloudflare Web Analytics;</li>
        <li>Cookies de marketing, afiliação ou publicidade;</li>
        <li>SDKs de redes sociais com tracking (botões "Curtir"/"Compartilhar" que enviam dados);</li>
        <li>Chatbots de terceiros.</li>
      </ul>

      <h2>4. Como o site lembra da sua escolha</h2>
      <p>
        Quando você aceita ou rejeita os cookies não essenciais, sua escolha é salva no{" "}
        <code>localStorage</code> do seu navegador, na chave <code>tsb_cookie_consent</code>.
        Esse registro contém:
      </p>
      <ul>
        <li>O status do consentimento (aceito / recusado / personalizado);</li>
        <li>Quais categorias específicas você autorizou (ex.: <code>captcha: true/false</code>);</li>
        <li>A data e hora em que o consentimento foi dado.</li>
      </ul>
      <p>
        Esse dado fica salvo por <strong>12 meses</strong>, após os quais o banner é exibido
        novamente para você renovar o consentimento. Ele não é enviado para nenhum servidor —
        fica apenas no seu navegador.
      </p>

      <h2>5. Como gerenciar ou revogar o consentimento</h2>
      <p>
        Você pode alterar sua escolha a qualquer momento de duas formas:
      </p>
      <ul>
        <li>
          <strong>Pelo rodapé do site:</strong> clique no link{" "}
          <em>"Gerenciar cookies"</em> no rodapé de qualquer página para reabrir o banner de
          consentimento;
        </li>
        <li>
          <strong>Direto pelo navegador:</strong> abra as configurações do seu navegador,
          localize a seção de cookies/armazenamento local, encontre o site{" "}
          <code>{LEGAL_DATA.SITE_URL.replace(/^https?:\/\//, "")}</code> e remova a entrada{" "}
          <code>tsb_cookie_consent</code>. O banner será exibido novamente na próxima visita.
        </li>
      </ul>
      <p>
        Ao revogar o consentimento, qualquer script não essencial previamente carregado (ex.:
        Cloudflare Turnstile) continuará funcionando apenas na página atual — para que ele deixe
        de carregar, basta recarregar a página.
      </p>

      <h2>6. Cookies de terceiros</h2>
      <p>
        O único serviço de terceiro que pode carregar cookies ou scripts no seu navegador é o{" "}
        <strong>Cloudflare Turnstile</strong> (captcha anti-bot), conforme listado na seção 2.2
        acima. Consulte a política de privacidade da Cloudflare em{" "}
        <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noreferrer">cloudflare.com/privacypolicy</a>{" "}
        para mais informações sobre como eles tratam dados.
      </p>

      <h2>7. Alterações a esta Política</h2>
      <p>
        Esta Política pode ser atualizada sempre que introduzirmos novos cookies ou alterarmos a
        forma como usamos os existentes. A data da última atualização está indicada no topo.
      </p>

      <h2>8. Contato</h2>
      <p>
        Em caso de dúvidas sobre esta Política de Cookies, entre em contato pelo e-mail{" "}
        <a href={`mailto:${LEGAL_DATA.CONTROLADOR_EMAIL}`}>{LEGAL_DATA.CONTROLADOR_EMAIL}</a> ou
        pelo WhatsApp <a href="https://wa.me/5581983143861" target="_blank" rel="noreferrer">{LEGAL_DATA.CONTROLADOR_WHATSAPP}</a>.
      </p>
    </LegalLayout>
  );
}
