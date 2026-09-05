import type { Product, SiteConfig } from "@/types/store";

export const DEMO_PRODUCTS: Product[] = [
  {
    id: "demo-gloss-rosa",
    nome: "Gloss Labial Rosa Candy",
    categoria: "R$ 10,00",
    fotos: ["https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=80"],
    preco_normal: 12,
    preco_desconto: 10,
    preco_pix: 9.5,
    estoque_qtd: 8,
    ativo: true
  },
  {
    id: "demo-kit-presente",
    nome: "Kit Presente Mini Spa",
    categoria: "Kits Presente",
    fotos: ["https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=900&q=80"],
    preco_normal: 44.9,
    preco_desconto: 39.9,
    preco_pix: 37.9,
    estoque_qtd: 4,
    ativo: true
  },
  {
    id: "demo-esmalte",
    nome: "Esmalte Brilho Estrelinha",
    categoria: "Unhas",
    fotos: ["https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&w=900&q=80"],
    preco_normal: 8,
    preco_desconto: 5,
    preco_pix: 5,
    estoque_qtd: 14,
    ativo: true
  },
  {
    id: "demo-pincel",
    nome: "Pincel Macio para Blush",
    categoria: "Acessórios",
    fotos: ["https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=80"],
    preco_normal: 18,
    preco_desconto: null,
    preco_pix: 16.9,
    estoque_qtd: 0,
    ativo: true
  },
  {
    id: "demo-premium",
    nome: "Hidratante Premium Flor Doce",
    categoria: "Produtos Premium",
    fotos: ["https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=900&q=80"],
    preco_normal: 64.9,
    preco_desconto: 54.9,
    preco_pix: 51.9,
    estoque_qtd: 3,
    ativo: true
  }
];

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  banners: [
    { id: "maquiagens", imagem: "/banners/maquiagens.jpg" },
    { id: "formas-de-pagamento", imagem: "/banners/formas-de-pagamento.jpg" },
    { id: "entregas", imagem: "/banners/entregas.jpg" }
  ]
};
