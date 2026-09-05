export const STORE_CONTACTS = {
  whatsappDisplay: "(81) 98314-3861",
  whatsappDigits: "5581983143861",
  instagram: "@tulistorebeauty",
  tiktok: "@tulistorebeauty"
} as const;

export const CATEGORIES = [
  "Produtos Premium",
  "R$ 10,00",
  "R$ 5,00",
  "Kits Presente",
  "Grandes Marcas",
  "Unhas",
  "Acessórios",
  "Infantil"
] as const;

export const DELIVERY_IDS = ["retirada_loja", "retirada_icb", "entrega_app"] as const;

export const DELIVERY_LABELS: Record<(typeof DELIVERY_IDS)[number], string> = {
  retirada_loja: "Retirada no endereço da loja",
  retirada_icb: "Retirada no ICB/UPE",
  entrega_app: "Uber Flash / 99Entrega"
};

export const PAYMENT_IDS = ["pix", "cartao", "dinheiro"] as const;

export const PAYMENT_LABELS: Record<(typeof PAYMENT_IDS)[number], string> = {
  pix: "Pix",
  cartao: "Cartão",
  dinheiro: "Dinheiro"
};

export const ORDER_STATUSES = [
  "Pedido Feito - Aguardando Aprovação de Pagamento",
  "Pagamento Aprovado / Em Separação",
  "Aguardando Retirada",
  "Aguardando Coleta / Em Rota de Entrega",
  "Pedido Concluído"
] as const;

export const INITIAL_ORDER_STATUS = ORDER_STATUSES[0];
export const COMPLETED_ORDER_STATUS = ORDER_STATUSES[4];
