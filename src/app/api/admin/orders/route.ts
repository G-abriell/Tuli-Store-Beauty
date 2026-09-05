import { requireAdmin } from "@/lib/admin-auth";
import { sendOrderStatusEmail } from "@/lib/email";
import { jsonResponse } from "@/lib/json";
import { orderStatusUpdateSchema } from "@/lib/schemas";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { OrderLine, PublicOrder } from "@/types/store";

export const runtime = "nodejs";

function toOrder(row: Record<string, unknown>): PublicOrder {
  return {
    id: String(row.id),
    cliente_nome: String(row.cliente_nome),
    cliente_whatsapp: String(row.cliente_whatsapp),
    cliente_email: String(row.cliente_email),
    itens: Array.isArray(row.itens) ? (row.itens as OrderLine[]) : [],
    valor_total: Number(row.valor_total),
    forma_entrega: row.forma_entrega as PublicOrder["forma_entrega"],
    forma_pagamento: row.forma_pagamento as PublicOrder["forma_pagamento"],
    status: row.status as PublicOrder["status"],
    observacoes: row.observacoes == null ? null : String(row.observacoes),
    criado_em: row.criado_em == null ? undefined : String(row.criado_em)
  };
}

export async function GET() {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const supabase = getSupabaseAdmin();
  if (!supabase) return jsonResponse({ error: "Supabase não configurado" }, { status: 503 });

  const { data, error } = await supabase
    .from("pedidos")
    .select("id,cliente_nome,cliente_whatsapp,cliente_email,itens,valor_total,forma_entrega,forma_pagamento,status,observacoes,criado_em")
    .order("criado_em", { ascending: false });

  if (error) {
    console.error("Failed to list orders", error);
    return jsonResponse({ error: "Não foi possível listar pedidos" }, { status: 500 });
  }

  return jsonResponse({ orders: (data ?? []).map((row) => toOrder(row)) });
}

export async function PUT(request: Request) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const parsed = orderStatusUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return jsonResponse({ error: "Status inválido" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return jsonResponse({ error: "Supabase não configurado" }, { status: 503 });

  const { data: currentRow, error: currentError } = await supabase
    .from("pedidos")
    .select("id,cliente_nome,cliente_whatsapp,cliente_email,itens,valor_total,forma_entrega,forma_pagamento,status,observacoes,criado_em")
    .eq("id", parsed.data.id)
    .single();

  if (currentError || !currentRow) {
    return jsonResponse({ error: "Pedido não encontrado" }, { status: 404 });
  }

  const currentOrder = toOrder(currentRow);
  const { data: updatedRow, error } = await supabase
    .from("pedidos")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.id)
    .select("id,cliente_nome,cliente_whatsapp,cliente_email,itens,valor_total,forma_entrega,forma_pagamento,status,observacoes,criado_em")
    .single();

  if (error || !updatedRow) {
    console.error("Failed to update order status", error);
    return jsonResponse({ error: "Não foi possível atualizar o pedido" }, { status: 500 });
  }

  const updatedOrder = toOrder(updatedRow);
  await sendOrderStatusEmail(updatedOrder, parsed.data.status);

  return jsonResponse({ order: updatedOrder });
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const supabase = getSupabaseAdmin();
  if (!supabase) return jsonResponse({ error: "Supabase não configurado" }, { status: 503 });

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return jsonResponse({ error: "Pedido inválido" }, { status: 400 });

  const { data: orderRow, error: fetchError } = await supabase
    .from("pedidos")
    .select("id, itens")
    .eq("id", id)
    .single();

  if (fetchError || !orderRow) {
    return jsonResponse({ error: "Pedido não encontrado" }, { status: 404 });
  }

  // Devolve as quantidades de cada item ao estoque do respectivo produto
  const items = Array.isArray(orderRow.itens) ? (orderRow.itens as OrderLine[]) : [];
  for (const item of items) {
    const prodId = item.produto_id;
    const qtd = Number(item.qtd) || 0;
    if (prodId && qtd > 0) {
      const { data: prod } = await supabase
        .from("produtos")
        .select("estoque_qtd")
        .eq("id", prodId)
        .single();
      if (prod) {
        await supabase
          .from("produtos")
          .update({ estoque_qtd: prod.estoque_qtd + qtd })
          .eq("id", prodId);
      }
    }
  }

  const { error } = await supabase.from("pedidos").delete().eq("id", id);
  if (error) {
    console.error("Failed to delete order", error);
    return jsonResponse({ error: `Não foi possível remover o pedido: ${error.message}` }, { status: 500 });
  }

  return jsonResponse({ ok: true });
}
