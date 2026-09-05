import { INITIAL_ORDER_STATUS } from "@/lib/constants";
import { bestUnitPrice, roundMoney } from "@/lib/currency";
import { DEMO_PRODUCTS } from "@/lib/demo-data";
import { sendOrderStatusEmail } from "@/lib/email";
import { jsonResponse } from "@/lib/json";
import { PUBLIC_PRODUCT_SELECT, toProduct } from "@/lib/products";
import { checkRateLimit, requestIp } from "@/lib/rate-limit";
import { checkoutSchema } from "@/lib/schemas";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import type { OrderLine, Product, PublicOrder } from "@/types/store";

export const runtime = "nodejs";

function combineItems(items: { productId: string; qtd: number }[]) {
  const map = new Map<string, number>();
  for (const item of items) {
    map.set(item.productId, (map.get(item.productId) ?? 0) + item.qtd);
  }
  return [...map.entries()].map(([productId, qtd]) => ({ productId, qtd }));
}

function buildOrderLines(products: Product[], requested: { productId: string; qtd: number }[], payment: string): OrderLine[] {
  return requested.map((item) => {
    const product = products.find((candidate) => candidate.id === item.productId);
    if (!product) throw new Error("PRODUCT_NOT_FOUND");
    if (!product.ativo || product.estoque_qtd < item.qtd) throw new Error("INSUFFICIENT_STOCK");

    return {
      produto_id: product.id,
      nome: product.nome,
      qtd: item.qtd,
      preco_unit: bestUnitPrice(product, payment),
      foto: product.fotos[0]
    };
  });
}

async function verifyTurnstile(token: string | undefined, ip: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;

  const body = new URLSearchParams({
    secret,
    response: token,
    remoteip: ip === "unknown" ? "" : ip
  });

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body
    });
    const data = (await response.json()) as { success?: boolean };
    return Boolean(data.success);
  } catch (error) {
    console.error("Turnstile verification failed", error);
    return false;
  }
}

function demoOrder(parsed: ReturnType<typeof checkoutSchema.parse>) {
  const requested = combineItems(parsed.items);
  const lines = buildOrderLines(DEMO_PRODUCTS, requested, parsed.forma_pagamento);
  const subtotal = roundMoney(lines.reduce((total, item) => total + item.preco_unit * item.qtd, 0));
  const order: PublicOrder = {
    id: `PED-DEMO-${Date.now()}`,
    cliente_nome: parsed.customer.nome,
    cliente_email: parsed.customer.email,
    cliente_whatsapp: parsed.customer.whatsapp,
    itens: lines,
    valor_total: subtotal,
    forma_entrega: parsed.forma_entrega,
    forma_pagamento: parsed.forma_pagamento,
    status: INITIAL_ORDER_STATUS,
    observacoes: parsed.observacoes
  };

  return {
    order,
    whatsappUrl: buildWhatsAppUrl(order),
    emailSent: false,
    demo: true
  };
}

export async function POST(request: Request) {
  const ip = requestIp(request);
  const limited = checkRateLimit(`order:${ip}`, 6, 60_000);
  if (!limited.ok) {
    return jsonResponse({ error: "Tente novamente em instantes" }, { status: 429 });
  }

  const parsed = checkoutSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return jsonResponse({ error: "Dados inválidos para finalizar o pedido" }, { status: 400 });
  }

  const captchaOk = await verifyTurnstile(parsed.data.turnstileToken, ip);
  if (!captchaOk) {
    return jsonResponse({ error: "Não foi possível validar o checkout" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    try {
      return jsonResponse(demoOrder(parsed.data));
    } catch {
      return jsonResponse({ error: "Produto indisponível" }, { status: 409 });
    }
  }

  const requested = combineItems(parsed.data.items);
  const productIds = requested.map((item) => item.productId);

  const { data: rows, error: productsError } = await supabase
    .from("produtos")
    .select(PUBLIC_PRODUCT_SELECT)
    .in("id", productIds)
    .eq("ativo", true);

  if (productsError) {
    console.error("Failed to load products for order", productsError);
    const detail = productsError.message ? (productsError.code ? `${productsError.message} [${productsError.code}]` : productsError.message) : "erro desconhecido";
    return jsonResponse({ error: `Não foi possível validar os produtos: ${detail}` }, { status: 500 });
  }

  const products = (rows ?? []).map((row) => toProduct(row));
  if (products.length !== productIds.length) {
    return jsonResponse({ error: "Um ou mais produtos estão indisponíveis" }, { status: 409 });
  }

  let lines: OrderLine[];
  try {
    lines = buildOrderLines(products, requested, parsed.data.forma_pagamento);
  } catch {
    return jsonResponse({ error: "Estoque insuficiente para um ou mais produtos" }, { status: 409 });
  }

  const total = roundMoney(lines.reduce((total, item) => total + item.preco_unit * item.qtd, 0));
  const insertPayload = {
    cliente_nome: parsed.data.customer.nome,
    cliente_whatsapp: parsed.data.customer.whatsapp,
    cliente_email: parsed.data.customer.email,
    itens: lines,
    valor_total: total,
    forma_entrega: parsed.data.forma_entrega,
    forma_pagamento: parsed.data.forma_pagamento,
    status: INITIAL_ORDER_STATUS,
    observacoes: parsed.data.observacoes || null
  };

  const { data: orderRow, error: insertError } = await supabase
    .from("pedidos")
    .insert(insertPayload)
    .select("id,cliente_nome,cliente_whatsapp,cliente_email,itens,valor_total,forma_entrega,forma_pagamento,status,observacoes,criado_em")
    .single();

  if (insertError || !orderRow) {
    console.error("Failed to insert order", insertError);
    const detail = insertError?.message ? (insertError.code ? `${insertError.message} [${insertError.code}]` : insertError.message) : "erro desconhecido";
    return jsonResponse({ error: `Não foi possível criar o pedido: ${detail}` }, { status: 500 });
  }

  const { error: stockError } = await supabase.rpc("reserve_order_stock", {
    order_items: lines.map((line) => ({ produto_id: line.produto_id, qtd: line.qtd }))
  });

  if (stockError) {
    console.error("Failed to reserve stock", stockError);
    await supabase.from("pedidos").delete().eq("id", orderRow.id);
    return jsonResponse({ error: "Estoque insuficiente para um ou mais produtos" }, { status: 409 });
  }

  const order: PublicOrder = {
    id: String(orderRow.id),
    cliente_nome: String(orderRow.cliente_nome),
    cliente_whatsapp: String(orderRow.cliente_whatsapp),
    cliente_email: String(orderRow.cliente_email),
    itens: Array.isArray(orderRow.itens) ? (orderRow.itens as OrderLine[]) : lines,
    valor_total: Number(orderRow.valor_total),
    forma_entrega: orderRow.forma_entrega,
    forma_pagamento: orderRow.forma_pagamento,
    status: orderRow.status,
    observacoes: orderRow.observacoes,
    criado_em: orderRow.criado_em
  };

  const emailResult = await sendOrderStatusEmail(order, INITIAL_ORDER_STATUS);

  return jsonResponse({
    order,
    whatsappUrl: buildWhatsAppUrl(order),
    emailSent: emailResult.sent
  });
}
