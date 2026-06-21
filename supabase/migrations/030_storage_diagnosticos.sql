-- ── Bucket de Storage: diagnosticos ────────────────────────────────────────────
-- Las fotos de diagnóstico se subían sin límite de tamaño/tipo a nivel de bucket
-- y sin políticas de RLS propias, dependiendo solo de la validación en el
-- cliente (fácil de saltarse). Se fija un límite de tamaño y tipos MIME, y se
-- restringe el acceso a los objetos por taller usando la ruta
-- `${taller_id}/${orden_id}/archivo`.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'diagnosticos',
  'diagnosticos',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update set
  file_size_limit     = excluded.file_size_limit,
  allowed_mime_types  = excluded.allowed_mime_types;

create policy "diagnosticos: select propio taller"
  on storage.objects for select
  using (
    bucket_id = 'diagnosticos'
    and (storage.foldername(name))[1] = (public.get_my_taller_id())::text
  );

create policy "diagnosticos: insert propio taller"
  on storage.objects for insert
  with check (
    bucket_id = 'diagnosticos'
    and (storage.foldername(name))[1] = (public.get_my_taller_id())::text
  );

create policy "diagnosticos: delete propio taller"
  on storage.objects for delete
  using (
    bucket_id = 'diagnosticos'
    and (storage.foldername(name))[1] = (public.get_my_taller_id())::text
  );
