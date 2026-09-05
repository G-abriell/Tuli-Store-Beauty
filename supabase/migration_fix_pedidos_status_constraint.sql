-- Corrige o CHECK constraint da coluna status da tabela pedidos
-- para aceitar as strings com acentos usadas em src/lib/constants.ts:
--   "Pedido Feito - Aguardando Aprovação de Pagamento"
--   "Pagamento Aprovado / Em Separação"
--   "Aguardando Retirada"
--   "Aguardando Coleta / Em Rota de Entrega"
--   "Pedido Concluído"
--
-- Antes desta migration, o CHECK exigia as versões sem acento
-- ("Aprovacao", "Separacao", "Concluido"), o que fazia o INSERT
-- do checkout falhar com erro [23514].
--
-- Rode no SQL Editor do Supabase (ou psql) uma única vez.

begin;

alter table public.pedidos
  drop constraint if exists pedidos_status_check;

alter table public.pedidos
  add constraint pedidos_status_check check (status in (
    'Pedido Feito - Aguardando Aprovação de Pagamento',
    'Pagamento Aprovado / Em Separação',
    'Aguardando Retirada',
    'Aguardando Coleta / Em Rota de Entrega',
    'Pedido Concluído'
  ));

-- Atualiza o default da coluna para a versão acentuada,
-- caso alguém crie pedido direto no SQL sem passar pela app.
alter table public.pedidos
  alter column status set default 'Pedido Feito - Aguardando Aprovação de Pagamento';

-- Ajusta também a RLS policy de INSERT para aceitar a string acentuada.
-- (O DROP + CREATE abaixo é idempotente.)
drop policy if exists "Public can create orders" on public.pedidos;
create policy "Public can create orders"
  on public.pedidos for insert
  to anon, authenticated
  with check (status = 'Pedido Feito - Aguardando Aprovação de Pagamento');

-- Se já existiam pedidos gravados com a string sem acento
-- (improvável, dado que o INSERT sempre falhou), normalize-os:
update public.pedidos
  set status = 'Pedido Feito - Aguardando Aprovação de Pagamento'
  where status = 'Pedido Feito - Aguardando Aprovacao de Pagamento';
update public.pedidos
  set status = 'Pagamento Aprovado / Em Separação'
  where status = 'Pagamento Aprovado / Em Separacao';
update public.pedidos
  set status = 'Pedido Concluído'
  where status = 'Pedido Concluido';

commit;
