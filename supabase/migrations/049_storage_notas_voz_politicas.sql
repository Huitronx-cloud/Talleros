-- ── `notas-voz` se quedó solo con INSERT ────────────────────────────────────
--
-- Qué pasa:
--   La migración 036 sustituyó la política "Allow all on notas-voz" por un
--   INSERT sin filtro. Acertó en lo importante —subir sigue funcionando— pero
--   el bucket se quedó sin SELECT y sin DELETE, y sin acotar por taller.
--
--   Consecuencias:
--     · Borrar una nota de voz quita la fila de `notas_voz`, pero el .webm se
--       queda en Storage para siempre. Nadie lo puede borrar: no hay política.
--     · Si una subida deja el archivo huérfano (el audio entra pero la fila
--       falla), tampoco se puede limpiar.
--     · El INSERT no comprueba de qué taller es la carpeta, así que cualquier
--       usuario con sesión podía escribir en la carpeta de otro taller. No
--       expone nada de nadie —para leer hace falta la URL exacta— pero no hay
--       motivo para dejarlo abierto cuando el resto de buckets sí lo acotan.
--
--   La ruta que escribe `components/ordenes/nota-voz.tsx` es
--   `${taller_id}/${orden_id}/${timestamp}.webm`, igual de forma que
--   `diagnosticos`, así que sirve el mismo patrón de la migración 030.
--
-- Sobre la reproducción:
--   `nota-voz.tsx` reproduce con `getPublicUrl`, que solo funciona si el bucket
--   es público. Por eso se fija `public = true`: si ya lo era, no cambia nada;
--   si no lo era, las notas grabadas no se podían oír.
--
--   Que sea público significa que quien tenga la URL exacta puede oír el audio.
--   La URL lleva el id del taller, el de la orden y una marca de tiempo en
--   milisegundos, y no se publica en ningún sitio — es el mismo trato que ya
--   tienen `diagnosticos` (fotos de los vehículos) y `logos`.
--
-- Ejecutar en: Supabase > SQL Editor. Solo base de datos, no necesita
-- despliegue ni antes ni después.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('notas-voz', 'notas-voz', true)
on conflict (id) do update set public = true;

-- La de la 036, que dejaba escribir en la carpeta de cualquier taller.
drop policy if exists "notas-voz: insert" on storage.objects;

drop policy if exists "notas-voz: select propio taller" on storage.objects;
drop policy if exists "notas-voz: insert propio taller" on storage.objects;
drop policy if exists "notas-voz: delete propio taller" on storage.objects;

create policy "notas-voz: select propio taller"
  on storage.objects for select
  using (
    bucket_id = 'notas-voz'
    and (storage.foldername(name))[1] = (public.get_my_taller_id())::text
  );

create policy "notas-voz: insert propio taller"
  on storage.objects for insert
  with check (
    bucket_id = 'notas-voz'
    and (storage.foldername(name))[1] = (public.get_my_taller_id())::text
  );

create policy "notas-voz: delete propio taller"
  on storage.objects for delete
  using (
    bucket_id = 'notas-voz'
    and (storage.foldername(name))[1] = (public.get_my_taller_id())::text
  );

-- No lleva UPDATE a propósito: el nombre del archivo lleva marca de tiempo, así
-- que cada nota es un archivo nuevo y nunca se reemplaza ninguno. Ver la 048
-- para el caso contrario.

select policyname, cmd
from pg_policies
where schemaname = 'storage'
  and tablename  = 'objects'
  and policyname like 'notas-voz:%'
order by cmd;
