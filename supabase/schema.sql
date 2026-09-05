create extension if not exists pgcrypto;

create sequence if not exists public.pedido_numero_seq;

create table if not exists public.produtos (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(nome) between 2 and 120),
  categoria text not null check (categoria in (
    'Produtos Premium',
    'R$ 10,00',
    'R$ 5,00',
    'Kits Presente',
    'Grandes Marcas',
    'Unhas',
    'Acessórios',
    'Infantil'
  )),
  fotos text[] not null default '{}',
  preco_normal numeric(10,2) not null check (preco_normal >= 0),
  preco_desconto numeric(10,2) check (preco_desconto is null or preco_desconto >= 0),
  preco_pix numeric(10,2) check (preco_pix is null or preco_pix >= 0),
  estoque_qtd integer not null default 0 check (estoque_qtd >= 0),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.pedidos (
  id text primary key default ('#PED-' || lpad(nextval('public.pedido_numero_seq')::text, 4, '0')),
  cliente_nome text not null check (char_length(cliente_nome) between 5 and 120),
  cliente_whatsapp text not null check (char_length(cliente_whatsapp) between 10 and 24),
  cliente_email text not null check (char_length(cliente_email) <= 160),
  itens jsonb not null check (jsonb_typeof(itens) = 'array'),
  valor_total numeric(10,2) not null check (valor_total >= 0),
  forma_entrega text not null check (forma_entrega in ('retirada_loja', 'retirada_icb', 'entrega_app')),
  forma_pagamento text not null check (forma_pagamento in ('pix', 'cartao', 'dinheiro')),
  status text not null default 'Pedido Feito - Aguardando Aprovação de Pagamento' check (status in (
    'Pedido Feito - Aguardando Aprovação de Pagamento',
    'Pagamento Aprovado / Em Separação',
    'Aguardando Retirada',
    'Aguardando Coleta / Em Rota de Entrega',
    'Pedido Concluído'
  )),
  observacoes text,
  criado_em timestamptz not null default now()
);

create table if not exists public.site_config (
  id text primary key default 'default',
  banners jsonb not null default '[]'::jsonb,
  atualizado_em timestamptz not null default now()
);

create or replace function public.touch_atualizado_em()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

drop trigger if exists produtos_touch_atualizado_em on public.produtos;
create trigger produtos_touch_atualizado_em
before update on public.produtos
for each row execute function public.touch_atualizado_em();

drop trigger if exists site_config_touch_atualizado_em on public.site_config;
create trigger site_config_touch_atualizado_em
before update on public.site_config
for each row execute function public.touch_atualizado_em();

create or replace function public.reserve_order_stock(order_items jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  item jsonb;
  product_id uuid;
  quantity integer;
begin
  if jsonb_typeof(order_items) <> 'array' then
    raise exception 'INVALID_ITEMS';
  end if;

  for item in select * from jsonb_array_elements(order_items)
  loop
    product_id := (item->>'produto_id')::uuid;
    quantity := (item->>'qtd')::integer;

    if quantity is null or quantity <= 0 then
      raise exception 'INVALID_QUANTITY';
    end if;

    update public.produtos
    set estoque_qtd = estoque_qtd - quantity
    where id = product_id
      and ativo = true
      and estoque_qtd >= quantity;

    if not found then
      raise exception 'INSUFFICIENT_STOCK';
    end if;
  end loop;
end;
$$;

revoke all on function public.reserve_order_stock(jsonb) from public;
grant execute on function public.reserve_order_stock(jsonb) to service_role;

alter table public.produtos enable row level security;
alter table public.pedidos enable row level security;
alter table public.site_config enable row level security;

drop policy if exists "Public can read active products" on public.produtos;
create policy "Public can read active products"
on public.produtos for select
to anon, authenticated
using (ativo = true);

drop policy if exists "Admins can manage products" on public.produtos;
create policy "Admins can manage products"
on public.produtos for all
to authenticated
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists "Public can create orders" on public.pedidos;
create policy "Public can create orders"
on public.pedidos for insert
to anon, authenticated
with check (status = 'Pedido Feito - Aguardando Aprovação de Pagamento');

drop policy if exists "Admins can read orders" on public.pedidos;
create policy "Admins can read orders"
on public.pedidos for select
to authenticated
using (auth.role() = 'authenticated');

drop policy if exists "Admins can update orders" on public.pedidos;
create policy "Admins can update orders"
on public.pedidos for update
to authenticated
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists "Public can read site config" on public.site_config;
create policy "Public can read site config"
on public.site_config for select
to anon, authenticated
using (id = 'default');

drop policy if exists "Admins can manage site config" on public.site_config;
create policy "Admins can manage site config"
on public.site_config for all
to authenticated
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('produtos', 'produtos', true, 2500000, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

insert into public.site_config (id, banners)
values (
  'default',
  '[
    { "id": "maquiagens", "imagem": "/banners/maquiagens.jpg" },
    { "id": "formas-de-pagamento", "imagem": "/banners/formas-de-pagamento.jpg" },
    { "id": "entregas", "imagem": "/banners/entregas.jpg" }
  ]'::jsonb
)
on conflict (id) do nothing;
