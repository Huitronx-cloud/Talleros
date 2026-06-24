-- ── Storage: quitar políticas que permiten listar archivos públicamente ──────
-- get_advisors (lint public_bucket_allows_listing) marcó 4 buckets cuya
-- política de SELECT en storage.objects no exige ningún filtro por taller,
-- así que cualquiera puede enumerar el listado completo de archivos vía la
-- API de Storage. Ninguna parte del código usa `.list()` en estos buckets
-- (las descargas van por getPublicUrl, que no depende de RLS), así que
-- quitar el SELECT no afecta nada visible.
--
-- pdfs-ordenes solo se escribe desde el server con el service role (que
-- ignora RLS), así que su política "Allow all" tampoco hace falta para nada.
-- notas-voz sí se sube desde el cliente con la sesión del usuario, así que
-- se reemplaza su "Allow all" por un INSERT equivalente (sin el SELECT).

drop policy if exists "permitir ver logos" on storage.objects;

drop policy if exists "lectura publica 1dwrj5l_0" on storage.objects;

drop policy if exists "Lectura pública de PDFs" on storage.objects;
drop policy if exists "Allow all on pdfs-ordenes" on storage.objects;

drop policy if exists "Allow all on notas-voz" on storage.objects;

create policy "notas-voz: insert"
  on storage.objects for insert
  with check (bucket_id = 'notas-voz');
