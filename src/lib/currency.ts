export const moneyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

export function formatMoney(value: number) {
  return moneyFormatter.format(Number.isFinite(value) ? value : 0);
}

export function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function bestUnitPrice(product: {
  preco_normal: number;
  preco_desconto: number | null;
  preco_pix: number | null;
}, payment?: string) {
  if (payment === "pix" && product.preco_pix != null) return product.preco_pix;
  return product.preco_desconto ?? product.preco_normal;
}
