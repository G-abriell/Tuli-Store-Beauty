import { z } from "zod";
import {
  CATEGORIES,
  DELIVERY_IDS,
  ORDER_STATUSES,
  PAYMENT_IDS
} from "@/lib/constants";

const currencySchema = z
  .number({ invalid_type_error: "Valor invalido" })
  .finite()
  .nonnegative()
  .max(99999);

const nullableCurrencySchema = z
  .union([currencySchema, z.null()])
  .optional()
  .transform((value) => value ?? null);

export function normalizeWhatsApp(value: string) {
  return value.replace(/\D/g, "");
}

const emailRegex =
  /^[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]*[a-zA-Z0-9])?@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/;

export const orderItemInputSchema = z.object({
  productId: z.string().min(1).max(120),
  qtd: z.number().int().min(1).max(99)
});

export const customerSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(5)
    .max(120)
    .regex(/^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/, "Nome deve conter apenas letras e espaços"),
  email: z.string().trim().max(160).regex(emailRegex, "E-mail inválido"),
  whatsapp: z
    .string()
    .trim()
    .min(10)
    .max(24)
    .transform(normalizeWhatsApp)
});

export const checkoutSchema = z.object({
  customer: customerSchema,
  items: z.array(orderItemInputSchema).min(1).max(50),
  forma_entrega: z.enum(DELIVERY_IDS),
  forma_pagamento: z.enum(PAYMENT_IDS),
  observacoes: z.string().trim().max(500).optional().default(""),
  turnstileToken: z.string().trim().max(2048).optional()
});

export const adminLoginSchema = z.object({
  email: z.string().trim().max(160).regex(emailRegex, "E-mail inválido"),
  password: z.string().min(8).max(200)
});

export const productAdminSchema = z.object({
  id: z.string().min(1).max(120).optional(),
  nome: z.string().trim().min(2).max(120),
  categoria: z.enum(CATEGORIES),
  fotos: z.array(z.string().trim().url()).max(8).default([]),
  preco_normal: currencySchema,
  preco_desconto: nullableCurrencySchema,
  preco_pix: nullableCurrencySchema,
  estoque_qtd: z.number().int().min(0).max(99999),
  ativo: z.boolean(),
  descricao: z.string().trim().max(2000).optional()
});

export const uploadPhotoSchema = z.object({
  fileName: z.string().trim().min(3).max(180),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  size: z.number().int().min(1).max(2_500_000),
  base64: z.string().min(20),
  folder: z.enum(["produtos", "banners"]).optional().default("produtos")
});

export const orderStatusUpdateSchema = z.object({
  id: z.string().min(1).max(40),
  status: z.enum(ORDER_STATUSES)
});

export const bannerSchema = z.object({
  id: z.string().trim().min(1).max(60),
  imagem: z.string().trim().min(1).max(2048)
});

export const siteConfigSchema = z.object({
  banners: z.array(bannerSchema).min(1).max(8)
});
