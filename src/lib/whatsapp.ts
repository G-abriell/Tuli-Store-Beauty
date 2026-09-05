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
};

export function orderCode(id: string) {
  return id.startsWith("#") ? id : `#${id}`;
}

export function buildWhatsAppText(order: WhatsAppOrder) {
  const linhas = order.itens.map((item) => `- ${item.qtd}x ${item.nome} — ${formatMoney(item.preco_unit)}`);

  return [
    `*Novo Pedido — Tuli Store Beauty*`,
    `----------------------------------------`,
    `Olá! Meu nome é ${order.cliente_nome}.`,
    `Quero confirmar meu pedido ${orderCode(order.id)}:`,
    "",
    ...linhas,
    "",
    `----------------------------------------`,
    `*Total:* ${formatMoney(order.valor_total)}`,
    `*Forma de Pagamento:* ${PAYMENT_LABELS[order.forma_pagamento]}`,
    `*Forma de Entrega:* ${DELIVERY_LABELS[order.forma_entrega]}`,
    `*WhatsApp do Cliente:* ${order.cliente_whatsapp}`,
    "",
    `Aguardo a confirmação! Muito obrigado(a).`
  ].join("\n");
}

export function buildWhatsAppUrl(order: WhatsAppOrder) {
  const text = buildWhatsAppText(order);
  return `https://wa.me/${STORE_CONTACTS.whatsappDigits}?text=${encodeURIComponent(text)}`;
}
