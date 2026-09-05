import type { Product } from "@/types/store";

export const PUBLIC_PRODUCT_SELECT =
  "id,nome,categoria,fotos,preco_normal,preco_desconto,preco_pix,estoque_qtd,ativo,descricao";

export function toProduct(row: Record<string, unknown>): Product {
  return {
    id: String(row.id),
    nome: String(row.nome),
    categoria: row.categoria as Product["categoria"],
    fotos: Array.isArray(row.fotos) ? row.fotos.map(String) : [],
    preco_normal: Number(row.preco_normal),
    preco_desconto: row.preco_desconto == null ? null : Number(row.preco_desconto),
    preco_pix: row.preco_pix == null ? null : Number(row.preco_pix),
    estoque_qtd: Number(row.estoque_qtd ?? 0),
    ativo: Boolean(row.ativo),
    descricao: row.descricao == null ? undefined : String(row.descricao)
  };
}

export function publicProduct(product: Product) {
  return {
    id: product.id,
    nome: product.nome,
    categoria: product.categoria,
    fotos: product.fotos,
    preco_normal: product.preco_normal,
    preco_desconto: product.preco_desconto,
    preco_pix: product.preco_pix,
    estoque_qtd: product.estoque_qtd,
    ativo: product.ativo,
    descricao: product.descricao
  };
}
