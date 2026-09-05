import type { DeliveryId, OrderStatus, PaymentId, Product } from "@/types/store";

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Table<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

type ProductRow = Product & {
  criado_em: string;
  atualizado_em: string;
};

type ProductInsert = Omit<Product, "id"> & {
  id?: string;
};

type OrderRow = {
  id: string;
  cliente_nome: string;
  cliente_whatsapp: string;
  cliente_email: string;
  itens: Json;
  valor_total: number;
  forma_entrega: DeliveryId;
  forma_pagamento: PaymentId;
  status: OrderStatus;
  observacoes: string | null;
  criado_em: string;
};

type OrderInsert = Omit<OrderRow, "id" | "criado_em"> & {
  id?: string;
  criado_em?: string;
};

type SiteConfigRow = {
  id: string;
  banners: Json;
  atualizado_em: string;
};

export type Database = {
  public: {
    Tables: {
      produtos: Table<ProductRow, ProductInsert, Partial<ProductInsert>>;
      pedidos: Table<OrderRow, OrderInsert, Partial<OrderInsert>>;
      site_config: Table<SiteConfigRow, Omit<SiteConfigRow, "atualizado_em">, Partial<Omit<SiteConfigRow, "atualizado_em">>>;
    };
    Views: Record<string, never>;
    Functions: {
      reserve_order_stock: {
        Args: { order_items: Json };
        Returns: void;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
