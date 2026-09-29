import { DELIVERY_LABELS, PAYMENT_LABELS, STORE_CONTACTS } from "@/lib/constants";
import { formatMoney } from "@/lib/currency";
import type { DeliveryId, OrderLine, PaymentId } from "@/types/store";

type WhatsAppOrder = {
  id: string;
  cliente_nome: string;
  cliente_whatsapp: string;
  itens: Pick<OrderLine, "nome" | "qtd" | "preco_unit">[];
  valor_total: number;
  forma_pagamento: PaymentId;
  forma_entrega: DeliveryId;
  observacoes?: string | null;
};

export function orderCode(id: string) {
  return id.startsWith("#") ? id : `#${id}`;
}

export function buildWhatsAppText(order: WhatsAppOrder) {
  const linhas = order.itens.map(
    (item) => `▫️ *${item.qtd}x* ${item.nome} — ${formatMoney(item.preco_unit)}`
  );

  const obsLinhas = order.observacoes?.trim()
    ? ["", `📝 *Observações:* ${order.observacoes.trim()}`]
    : [];

  return [
    `✨ *NOVO PEDIDO — TULI STORE BEAUTY* ✨`,
    `----------------------------------------`,
    `👋 Olá! Meu nome é *${order.cliente_nome}*.`,
    `🛍️ Quero confirmar meu pedido *${orderCode(order.id)}*:`,
    "",
    `📋 *Itens do Pedido:*`,
    ...linhas,
    "",
    `----------------------------------------`,
    `💰 *Valor Total:* ${formatMoney(order.valor_total)}`,
    `💳 *Forma de Pagamento:* ${PAYMENT_LABELS[order.forma_pagamento] || order.forma_pagamento}`,
    `📦 *Forma de Entrega:* ${DELIVERY_LABELS[order.forma_entrega] || order.forma_entrega}`,
    `📱 *WhatsApp do Cliente:* ${order.cliente_whatsapp}`,
    ...obsLinhas,
    "",
    `💖 Aguardo a confirmação! Muito obrigado(a).`
  ].join("\n");
}

export function buildWhatsAppUrl(order: WhatsAppOrder) {
  const text = buildWhatsAppText(order);
  // Usa o endpoint direto https://api.whatsapp.com/send em vez do encurtador wa.me.
  // O wa.me faz redirecionamento 302 que corrompe caracteres UTF-8 multibyte (emojis)
  // em navegadores móveis e webviews, transformando-os em U+FFFD (?).
  return `https://api.whatsapp.com/send?phone=${STORE_CONTACTS.whatsappDigits}&text=${encodeURIComponent(text)}`;
}

export function buildWhatsAppUrls(order: WhatsAppOrder) {
  const text = buildWhatsAppText(order);
  const encoded = encodeURIComponent(text);
  return {
    webUrl: `https://api.whatsapp.com/send?phone=${STORE_CONTACTS.whatsappDigits}&text=${encoded}`,
    appUrl: `whatsapp://send?phone=${STORE_CONTACTS.whatsappDigits}&text=${encoded}`,
    text
  };
}
