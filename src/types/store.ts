import type { CATEGORIES, DELIVERY_IDS, ORDER_STATUSES, PAYMENT_IDS } from "@/lib/constants";

export type Category = (typeof CATEGORIES)[number];
export type DeliveryId = (typeof DELIVERY_IDS)[number];
export type PaymentId = (typeof PAYMENT_IDS)[number];
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type Product = {
  id: string;
  nome: string;
  categoria: Category;
  fotos: string[];
  preco_normal: number;
  preco_desconto: number | null;
  preco_pix: number | null;
  estoque_qtd: number;
  ativo: boolean;
  descricao?: string;
};

export type CartItem = {
  product: Product;
  qtd: number;
};

export type Customer = {
  nome: string;
  email: string;
  whatsapp: string;
};

export type OrderLine = {
  produto_id: string;
  nome: string;
  qtd: number;
  preco_unit: number;
  foto?: string;
};

export type PublicOrder = {
  id: string;
  cliente_nome: string;
  cliente_whatsapp: string;
  cliente_email: string;
  itens: OrderLine[];
  valor_total: number;
  forma_entrega: DeliveryId;
  forma_pagamento: PaymentId;
  status: OrderStatus;
  observacoes?: string | null;
  criado_em?: string;
};

export type BannerSlide = {
  id: string;
  imagem: string;
};

export type SiteConfig = {
  banners: BannerSlide[];
};
