-- Atualiza os banners da home para o novo formato (somente imagem, sem
-- título/subtítulo/etiqueta) e substitui pelos 3 banners novos.
--
-- Rode isso no SQL Editor do Supabase depois de subir o deploy com as
-- imagens em /public/banners (maquiagens.jpg, formas-de-pagamento.jpg,
-- entregas.jpg). Se preferir usar outras imagens, troque os caminhos
-- abaixo pela URL pública que aparece no painel admin > Banners da home
-- depois de enviar a foto por lá.

begin;

update public.site_config
set banners = '[
  { "id": "maquiagens", "imagem": "/banners/maquiagens.jpg" },
  { "id": "formas-de-pagamento", "imagem": "/banners/formas-de-pagamento.jpg" },
  { "id": "entregas", "imagem": "/banners/entregas.jpg" }
]'::jsonb
where id = 'default';

commit;
