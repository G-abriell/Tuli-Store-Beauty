-- Reinicia a numeração dos pedidos (#PED-0001, #PED-0002, ...) para o zero.
--
-- Os pedidos existentes já foram apagados pela aplicação, mas a sequence
-- que gera o número do próximo pedido continua de onde parou. Sem este
-- passo, o próximo pedido criado continuaria a numeração antiga
-- (ex.: #PED-0038) em vez de recomeçar em #PED-0001.
--
-- Rode no SQL Editor do Supabase (ou psql) uma única vez.

begin;

-- Garantia extra: remove qualquer pedido remanescente antes de reiniciar a numeração.
delete from public.pedidos;

alter sequence public.pedido_numero_seq restart with 1;

commit;
