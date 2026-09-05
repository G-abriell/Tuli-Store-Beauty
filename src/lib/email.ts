import { Resend } from "resend";
import { DELIVERY_LABELS, ORDER_STATUSES, PAYMENT_LABELS, STORE_CONTACTS } from "@/lib/constants";
import { formatMoney } from "@/lib/currency";
import { orderCode } from "@/lib/whatsapp";
import type { DeliveryId, OrderLine, OrderStatus, PaymentId } from "@/types/store";

type EmailOrder = {
  id: string;
  cliente_nome: string;
  cliente_email: string;
  itens: Pick<OrderLine, "nome" | "qtd" | "preco_unit">[];
  valor_total: number;
  forma_entrega: DeliveryId;
  forma_pagamento: PaymentId;
};

const SUBJECTS: Record<OrderStatus, string> = {
  [ORDER_STATUSES[0]]: "Recebemos seu pedido",
  [ORDER_STATUSES[1]]: "Pagamento aprovado e pedido em separação",
  [ORDER_STATUSES[2]]: "Seu pedido está aguardando retirada",
  [ORDER_STATUSES[3]]: "Seu pedido está aguardando coleta ou em rota",
  [ORDER_STATUSES[4]]: "Pedido concluído. Obrigada pela compra"
};

const STATUS_MESSAGES: Record<OrderStatus, string> = {
  [ORDER_STATUSES[0]]: "Seu pedido foi recebido e está aguardando aprovação de pagamento.",
  [ORDER_STATUSES[1]]: "Seu pagamento foi aprovado e já estamos separando seus produtos.",
  [ORDER_STATUSES[2]]: "Seu pedido está pronto para retirada. Combine o melhor horário pelo WhatsApp.",
  [ORDER_STATUSES[3]]: "Seu pedido está aguardando coleta ou já está em rota pelo app combinado.",
  [ORDER_STATUSES[4]]: `Pedido concluído. Obrigada pela compra! Acompanhe novidades no Instagram ${STORE_CONTACTS.instagram}.`
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function orderHtml(order: EmailOrder, status: OrderStatus) {
  const lines = order.itens
    .map((item) => `<li>${item.qtd}x ${escapeHtml(item.nome)} - ${formatMoney(item.preco_unit)}</li>`)
    .join("");

  return `
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Tuli Store Beauty - Atualização do pedido</title>
  </head>
  <body>
    <div style="font-family:Arial,sans-serif;color:#3f2d35;line-height:1.5">
      <h1 style="color:#c74478">Tuli Store Beauty</h1>
      <p>Oi, ${escapeHtml(order.cliente_nome)}.</p>
      <p>${escapeHtml(STATUS_MESSAGES[status])}</p>
      <p><strong>Pedido:</strong> ${escapeHtml(orderCode(order.id))}</p>
      <ul>${lines}</ul>
      <p><strong>Total:</strong> ${formatMoney(order.valor_total)}</p>
      <p><strong>Pagamento:</strong> ${escapeHtml(PAYMENT_LABELS[order.forma_pagamento])}</p>
      <p><strong>Entrega:</strong> ${escapeHtml(DELIVERY_LABELS[order.forma_entrega])}</p>
      <p>WhatsApp da loja: ${STORE_CONTACTS.whatsappDisplay}</p>
    </div>
  </body>
</html>
  `;
}

export async function sendOrderStatusEmail(order: EmailOrder, status: OrderStatus) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from || !order.cliente_email) {
    return { sent: false, skipped: true };
  }

  try {
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from,
      to: order.cliente_email,
      subject: SUBJECTS[status],
      html: orderHtml(order, status)
    });

    return { sent: true, id: result.data?.id };
  } catch (error) {
    console.error("Failed to send order email", error);
    return { sent: false, skipped: false };
  }
}
