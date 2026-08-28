-- ── Devolverle al bucket `logos` sus políticas de RLS ────────────────────────
--
-- Qué pasaba:
--   Subir el logo del taller fallaba con "new row violates row-level security
--   policy". No es de una cuenta ni de un taller: le pasa a todo el mundo desde
--   la migración 036.
--
--   La 036 quitó políticas de `storage.objects` que permitían listar archivos
--   sin filtrar por taller. Para `notas-voz` quitó la suya y **volvió a crear**
--   el INSERT equivalente, porque ese bucket se escribe desde el cliente. Para
--   `logos` quitó `"permitir ver logos"` y no creó nada, razonando que las
--   descargas van por `getPublicUrl` y no dependen de RLS. Cierto para leer —
--   pero los logos también se SUBEN desde el cliente, en dos sitios:
--     · components/configuracion/form-configuracion.tsx
--     · app/(auth)/onboarding/OnboardingForm.tsx
--   Sin política de INSERT, la subida se rechaza siempre.
--
--   Tardó en salir a la luz porque el onboarding hacía `if (!uploadError)` sin
--   rama `else`: si fallaba, seguía al paso siguiente sin logo y sin avisar.
--   Solo daba la cara en Configuración.
--
-- Qué hace esto:
--   Le pone al bucket `logos` las mismas políticas que ya tiene `diagnosticos`
--   desde la migración 030, acotadas por la carpeta del taller. La ruta que
--   escribe el código es `${taller_id}/logo.${ext}`, así que el primer tramo
--   del nombre es el taller y `get_my_taller_id()` —que sale de la sesión, no
--   de nada que mande el cliente— es lo que decide.
--
--   Se añade UPDATE, que `diagnosticos` no necesita pero `logos` sí: la subida
--   usa `upsert: true` y el archivo siempre se llama igual, así que a partir
--   del segundo logo la operación es un UPDATE, no un INSERT.
--
--   El SELECT acotado por taller no reabre lo que la 036 vino a cerrar: aquello
--   era una política sin ningún filtro, que dejaba enumerar los archivos de
--   todos los talleres.
--
-- Sobre `public = true`:
--   Es lo que el código ya da por hecho — `getPublicUrl` en los dos formularios
--   — y hace falta de verdad: el logo aparece en los PDF y en las páginas que
--   ve el cliente final, que no tiene sesión. Si el bucket ya estaba público,
--   esta línea no cambia nada.
--
-- Ejecutar en: Supabase > SQL Editor. No necesita despliegue previo ni
-- posterior: el código ya intenta subir el logo, lo único que falta es el
-- permiso. En cuanto corra, la subida funciona.
-- ---------------------------------------------------------------------------

-- 1) El bucket: público, 2 MB (lo mismo que valida el formulario) y solo
--    imágenes. `on conflict` para que sirva tanto si ya existe como si no.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'logos',
  'logos',
  true,
  2097152, -- 2 MB, igual que el límite del formulario
  -- SVG va incluido porque es lo que promete la interfaz ("PNG, JPG o SVG") y
  -- hay talleres que ya subieron uno. Se sirve desde el dominio de Supabase,
  -- no desde tallerosapp.com, así que no comparte origen con la app.
  array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update set
  public              = true,
  file_size_limit     = excluded.file_size_limit,
  allowed_mime_types  = excluded.allowed_mime_types;

-- 2) Las políticas. `drop ... if exists` primero para poder re-ejecutar el
--    archivo entero sin que reviente en el segundo intento.
drop policy if exists "logos: select propio taller" on storage.objects;
drop policy if exists "logos: insert propio taller" on storage.objects;
drop policy if exists "logos: update propio taller" on storage.objects;
drop policy if exists "logos: delete propio taller" on storage.objects;

create policy "logos: select propio taller"
  on storage.objects for select
  using (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = (public.get_my_taller_id())::text
  );

create policy "logos: insert propio taller"
  on storage.objects for insert
  with check (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = (public.get_my_taller_id())::text
  );

-- El que faltaba para que `upsert` funcione al reemplazar un logo existente.
create policy "logos: update propio taller"
  on storage.objects for update
  using (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = (public.get_my_taller_id())::text
  )
  with check (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = (public.get_my_taller_id())::text
  );

create policy "logos: delete propio taller"
  on storage.objects for delete
  using (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = (public.get_my_taller_id())::text
  );

-- 3) Comprobar cómo quedó.
select id, public, file_size_limit, allowed_mime_types
from storage.buckets
where id = 'logos';

select policyname, cmd
from pg_policies
where schemaname = 'storage' and tablename = 'objects' and policyname like 'logos:%'
order by policyname;
