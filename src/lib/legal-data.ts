/**
 * Dados legais centralizados do Tuli Store Beauty.
 * Usado pela Política de Privacidade, Política de Cookies, Termos de Uso e CookieBanner.
 * Alterar aqui atualiza todas as páginas automaticamente.
 */

export const LEGAL_DATA = {
  // Identificação do controlador (você, responsável pelo site)
  CONTROLADOR_NOME: "Tuli Store Beauty",
  CONTROLADOR_NOME_FANTASIA: "Tuli Store Beauty",
  CONTROLADOR_CNPJ: null as string | null, // Preencher se houver CNPJ (opcional para MEI/PF)
  CONTROLADOR_EMAIL: "tulistorebeauty@gmail.com",
  CONTROLADOR_WHATSAPP: "(81) 98314-3861",
  CONTROLADOR_INSTAGRAM: "@tulistorebeauty",
  CONTROLADOR_INSTAGRAM_URL: "https://www.instagram.com/tulistorebeauty",

  // Dados do site
  SITE_URL: "https://tulistorebeauty.netlify.app",
  SITE_NOME: "Tuli Store Beauty",

  // Data da última atualização das políticas (formato ISO)
  ULTIMA_ATUALIZACAO: "2026-09-03",

  // Período de retenção dos pedidos (em meses após conclusão)
  RETENCAO_PEIDOS_MESES: 6,
} as const;

/**
 * Lista de cookies essenciais usados pelo site.
 * Baseado na auditoria real do código.
 */
export const COOKIES_ESSENCIAIS = [
  {
    nome: "tsb_admin_access",
    finalidade: "Token de autenticação do painel administrativo (apenas em /admin)",
    duracao: "1 hora (renovável)",
    escopo: "Acesso ao /admin",
  },
  {
    nome: "tsb_admin_refresh",
    finalidade: "Renovação da sessão administrativa (apenas em /admin)",
    duracao: "30 dias",
    escopo: "Acesso ao /admin",
  },
] as const;

/**
 * Lista de scripts/cookies NÃO essenciais (sujeitos a consentimento).
 * Baseado na auditoria: Cloudflare Turnstile é o único que pode ser classificado
 * como não essencial para a navegação da vitrine (essencial apenas no checkout).
 */
export const COOKIES_NAO_ESSENCIAIS = [
  {
    nome: "Cloudflare Turnstile",
    categoria: "Segurança anti-bot",
    finalidade:
      "Widget de captcha no checkout para prevenir abuso e fraudes. Carrega script de challenges.cloudflare.com e envia o IP do visitante para validação.",
    duracao: "Sessão (token efêmero)",
    transferenciaInternacional: "EUA (Cloudflare, Inc.)",
    carregaApenasComConsentimento: true,
  },
] as const;

/**
 * Serviços de terceiros que processam dados (transferência internacional).
 */
export const SERVICOS_TERCEIROS = [
  {
    nome: "Supabase",
    pais: "EUA",
    finalidade: "Banco de dados (PostgreSQL) para armazenar produtos e pedidos",
    dados: "Nome, e-mail, WhatsApp, itens, valor e forma de pagamento do pedido",
    site: "https://supabase.com/privacy",
  },
  {
    nome: "Resend",
    pais: "EUA",
    finalidade: "Envio de e-mail transacional de confirmação do pedido",
    dados: "E-mail do destinatário e conteúdo do pedido",
    site: "https://resend.com/legal/privacy-policy",
  },
  {
    nome: "WhatsApp (Meta Platforms)",
    pais: "EUA",
    finalidade: "Confirmação manual do pedido pelo WhatsApp da loja",
    dados: "Nome, itens, valor e forma de pagamento (mensagem pré-preenchida que o cliente envia)",
    site: "https://www.whatsapp.com/legal/privacy-policy",
  },
  {
    nome: "Cloudflare Turnstile",
    pais: "EUA",
    finalidade: "Captcha anti-bot no checkout",
    dados: "Token efêmero + IP do visitante",
    site: "https://www.cloudflare.com/privacypolicy/",
  },
] as const;
