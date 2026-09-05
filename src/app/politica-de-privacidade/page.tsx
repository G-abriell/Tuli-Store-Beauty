import type { Metadata } from "next";
import LegalLayout from "@/components/LegalLayout";
import { LEGAL_DATA, SERVICOS_TERCEIROS } from "@/lib/legal-data";

export const metadata: Metadata = {
  title: "Política de Privacidade — Tuli Store Beauty",
  description: "Política de Privacidade do site Tuli Store Beauty em conformidade com a LGPD.",
  robots: { index: true, follow: true },
};

export default function PoliticaDePrivacidadePage() {
  return (
    <LegalLayout
      title="Política de Privacidade"
      subtitle="Como a Tuli Store Beauty coleta, usa e protege seus dados pessoais."
    >
      <p>
        A <strong>{LEGAL_DATA.CONTROLADOR_NOME}</strong> ("nós", "loja", "Tuli Store Beauty") respeita a sua
        privacidade e está comprometida em proteger seus dados pessoais em conformidade com a
        Lei nº 13.709/2018 (Lei Geral de Proteção de Dados — LGPD).
      </p>
      <p>
        Esta Política descreve quais dados coletamos, com qual finalidade, com quem compartilhamos,
        por quanto tempo os mantemos e quais são seus direitos como titular.
      </p>

      <h2>1. Dados pessoais que coletamos</h2>
      <p>
        Coletamos apenas os dados estritamente necessários para processar seu pedido de compra
        realizado pelo site. Não pedimos CPF, CNPJ, endereço residencial, data de nascimento,
        gênero, nem qualquer dado financeiro (como número de cartão).
      </p>
      <h3>1.1. Dados fornecidos por você no checkout</h3>
      <ul>
        <li><strong>Nome completo</strong> — para identificar o pedido;</li>
        <li><strong>E-mail</strong> — para enviar confirmação do pedido por e-mail transacional;</li>
        <li><strong>WhatsApp (telefone)</strong> — para confirmar o pedido via WhatsApp da loja;</li>
        <li><strong>Observações do pedido (opcional)</strong> — texto livre, até 500 caracteres, com instruções que você queira incluir.</li>
      </ul>
      <h3>1.2. Dados coletados automaticamente</h3>
      <ul>
        <li><strong>Endereço IP</strong> — usado apenas para limitar tentativas de abuso no checkout (rate limiting em memória, 6 pedidos/minuto) e para validar o captcha;</li>
        <li><strong>Dados de navegação essenciais</strong> — o site não usa Google Analytics nem pixels de marketing; portanto, não registramos seu comportamento de navegação.</li>
      </ul>

      <h2>2. Finalidade e base legal do tratamento</h2>
      <p>
        Tratamos seus dados pessoais para executar o contrato de compra que você celebra conosco ao
        finalizar um pedido. As bases legais invocadas são:
      </p>
      <ul>
        <li><strong>Execução de contrato (art. 7º, V, LGPD)</strong> — para processar, confirmar e entregar o seu pedido;</li>
        <li><strong>Legítimo interesse (art. 7º, IX, LGPD)</strong> — para segurança da loja, prevenção de fraudes e abuso do checkout (ex.: captcha e rate limiting por IP);</li>
        <li><strong>Consentimento (art. 8º, LGPD)</strong> — para o carregamento de scripts de terceiros não essenciais (como o captcha Cloudflare Turnstile), quando aplicável.</li>
      </ul>

      <h2>3. Compartilhamento de dados</h2>
      <p>
        Seus dados de pedido são compartilhados apenas com os seguintes processadores, todos com
        contrato e termos de privacidade próprios. Nenhum dado é vendido ou cedido a terceiros
        para marketing.
      </p>
      <table>
        <thead>
          <tr>
            <th>Processador</th>
            <th>Finalidade</th>
            <th>Dados enviados</th>
            <th>País</th>
          </tr>
        </thead>
        <tbody>
          {SERVICOS_TERCEIROS.map((s) => (
            <tr key={s.nome}>
              <td><a href={s.site} target="_blank" rel="noreferrer">{s.nome}</a></td>
              <td>{s.finalidade}</td>
              <td>{s.dados}</td>
              <td>{s.pais}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>4. Transferência internacional de dados</h2>
      <p>
        Os processadores listados acima estão localizados fora do Brasil (EUA). A transferência
        internacional dos seus dados pessoais para esses fornecedores ocorre nos termos do art. 33
        da LGPD e das cláusulas contratuais padrão adotadas por cada processador. Recomendamos a
        leitura das políticas de privacidade de cada um (links na tabela acima).
      </p>

      <h2>5. Retenção dos dados</h2>
      <p>
        Os dados do seu pedido (nome, e-mail, WhatsApp, itens, valor, forma de pagamento e entrega)
        são armazenados no banco de dados Supabase por <strong>{LEGAL_DATA.RETENCAO_PEIDOS_MESES} meses</strong> após
        o pedido ser concluído ou cancelado, para fins de registro comercial, fiscal e de
        atendimento ao cliente.
      </p>
      <p>
        Após esse prazo, os dados são anonimizados ou excluídos, exceto quando a retenção for
        exigida por obrigação legal ou regulatória.
      </p>

      <h2>6. Cookies e tecnologias similares</h2>
      <p>
        O site utiliza apenas cookies estritamente necessários para o funcionamento do painel
        administrativo (acessado apenas por nós). Não usamos cookies de analytics, marketing ou
        rastreamento. Para mais detalhes, consulte nossa{" "}
        <a href="/politica-de-cookies">Política de Cookies</a>.
      </p>

      <h2>7. Seus direitos como titular dos dados</h2>
      <p>
        Você pode exercer, a qualquer momento, os seguintes direitos previstos pela LGPD:
      </p>
      <ul>
        <li><strong>Confirmação e acesso</strong> aos seus dados que tratamos;</li>
        <li><strong>Correção</strong> de dados incompletos, inexatos ou desatualizados;</li>
        <li><strong>Eliminação</strong> dos seus dados (direito ao esquecimento);</li>
        <li><strong>Portabilidade</strong> dos dados a outro fornecedor;</li>
        <li><strong>Revogação do consentimento</strong> dado para tratamentos baseados em consentimento;</li>
        <li><strong>Informação sobre o compartilhamento</strong> de seus dados com terceiros.</li>
      </ul>
      <p>
        Para exercer qualquer um desses direitos, envie um e-mail para{" "}
        <a href={`mailto:${LEGAL_DATA.CONTROLADOR_EMAIL}`}>{LEGAL_DATA.CONTROLADOR_EMAIL}</a> ou uma
        mensagem pelo WhatsApp <a href="https://wa.me/5581983143861" target="_blank" rel="noreferrer">{LEGAL_DATA.CONTROLADOR_WHATSAPP}</a>,
        informando seu nome e o pedido ao qual os dados se referem. Responderemos em até 15 dias úteis.
      </p>

      <h2>8. Medidas de segurança</h2>
      <p>
        Adotamos medidas técnicas e organizacionais para proteger seus dados, incluindo:
      </p>
      <ul>
        <li>Conexão sempre via HTTPS (TLS);</li>
        <li>Cookies administrativos com flags <em>httpOnly</em>, <em>Secure</em> e <em>SameSite=Strict</em>;</li>
        <li>Política de Segurança de Conteúdo (CSP) restritiva, que bloqueia scripts não autorizados;</li>
        <li>Acesso ao painel administrativo protegido por autenticação e allowlist de e-mail;</li>
        <li>Rate limiting no checkout para prevenir abuso;</li>
        <li>Captcha anti-bot no formulário de pedido.</li>
      </ul>

      <h2>9. Crianças e adolescentes</h2>
      <p>
        O site não é direcionado a menores de 18 anos e não coleta deliberadamente dados de
        crianças ou adolescentes sem o consentimento dos responsáveis legais. Caso identifique
        que um pedido foi feito por menor, entraremos em contato para cancelamento e exclusão dos dados.
      </p>

      <h2>10. Alterações desta Política</h2>
      <p>
        Esta Política pode ser atualizada periodicamente. A data da última atualização está
        indicada no topo desta página. Recomendamos que você revise esta página ocasionalmente
        para se manter informado sobre quaisquer mudanças.
      </p>

      <h2>11. Encarregado pelo tratamento (DPO)</h2>
      <p>
        Para dúvidas, solicitações ou reclamações relacionadas a esta Política, entre em contato
        com o encarregado pelo tratamento de dados pessoais:
      </p>
      <ul>
        <li><strong>Loja:</strong> {LEGAL_DATA.CONTROLADOR_NOME_FANTASIA}</li>
        <li><strong>E-mail:</strong> <a href={`mailto:${LEGAL_DATA.CONTROLADOR_EMAIL}`}>{LEGAL_DATA.CONTROLADOR_EMAIL}</a></li>
        <li><strong>WhatsApp:</strong> <a href="https://wa.me/5581983143861" target="_blank" rel="noreferrer">{LEGAL_DATA.CONTROLADOR_WHATSAPP}</a></li>
        <li><strong>Instagram:</strong> <a href={LEGAL_DATA.CONTROLADOR_INSTAGRAM_URL} target="_blank" rel="noreferrer">{LEGAL_DATA.CONTROLADOR_INSTAGRAM}</a></li>
      </ul>
      <p>
        Você também pode registrar reclamação junto à Autoridade Nacional de Proteção de Dados
        (ANPD) pelo site <a href="https://www.gov.br/anpd" target="_blank" rel="noreferrer">gov.br/anpd</a>.
      </p>
    </LegalLayout>
  );
}
