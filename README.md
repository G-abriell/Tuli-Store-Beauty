# Tuli Store Beauty

MVP de loja virtual estilo cardapio digital: vitrine de produtos, sacola, checkout sem login, criacao de pedido, e-mail transacional e redirecionamento para WhatsApp com resumo preenchido.

## Rodar localmente

1. Instale dependencias:

```bash
npm install
```

2. Copie `.env.example` para `.env.local` e preencha as variaveis.
3. No Supabase, execute `supabase/schema.sql` no SQL Editor.
4. Crie o usuario ADM em Supabase Auth e defina `ADMIN_ALLOWED_EMAIL` com o e-mail dele.
5. Rode:

```bash
npm run dev
```

A vitrine usa dados demo quando o Supabase ainda nao esta configurado. Checkout real, admin, upload e e-mails dependem das variaveis de ambiente.

## Variaveis principais

- `NEXT_PUBLIC_SUPABASE_URL`: URL do projeto Supabase.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: chave anon public para Auth do ADM.
- `SUPABASE_SERVICE_ROLE_KEY`: usada somente nas rotas server-side.
- `SUPABASE_PRODUCT_BUCKET`: bucket de fotos, padrao `produtos`.
- `RESEND_API_KEY`: chave Resend.
- `RESEND_FROM_EMAIL`: remetente validado no Resend.
- `ADMIN_ALLOWED_EMAIL`: e-mail do unico ADM permitido.
- `NEXT_PUBLIC_STORE_ADDRESS`: endereco completo exibido na retirada na loja.
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` e `TURNSTILE_SECRET_KEY`: ativam protecao anti-bot no checkout.

## Deploy Netlify

O projeto ja inclui `netlify.toml` com `@netlify/plugin-nextjs` e security headers. Configure as mesmas variaveis de ambiente no painel da Netlify antes do deploy.

## Fluxos implementados

- Vitrine publica com filtro por categoria, busca, ordenacao por preco e bloqueio de item esgotado.
- Sacola com quantidade limitada ao estoque.
- Checkout com nome, e-mail, WhatsApp, entrega e pagamento filtrado.
- Regra de cupom: a cada 5 pedidos concluidos com valor minimo de R$ 20, o cliente recebe cupom de 10% limitado a R$ 5.
- Criacao de pedido no Supabase com status inicial.
- E-mail automatico ao criar pedido e e-mails manuais quando o ADM altera status.
- Painel ADM com login por Supabase Auth, CRUD de produtos, upload validado para Storage, listagem de pedidos e edicao de banners.

## Seguranca

- `.env*` fica fora do Git.
- `service_role` aparece apenas em rotas server-side.
- Inputs publicos e administrativos sao validados com Zod.
- Atualizacoes admin usam whitelist de campos.
- Erros retornados ao cliente sao genericos; detalhes ficam no log server-side.
- RLS e politicas basicas estao em `supabase/schema.sql`.
- Cookies do ADM sao `httpOnly`, `sameSite=strict` e `secure` em producao.
