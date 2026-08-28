-- ── `diagnosticos` necesita UPDATE, igual que lo necesitaba `logos` ─────────
--
-- Qué pasa:
--   La migración 030 le dio al bucket `diagnosticos` políticas de SELECT,
--   INSERT y DELETE acotadas por carpeta de taller. Faltó UPDATE.
--
--   Casi todo lo que se sube ahí lleva la marca de tiempo en el nombre
--   (`recepcion_${Date.now()}`, `firma_${Date.now()}`, `${Date.now()}.jpg`),
--   así que cada subida es un archivo nuevo y el INSERT basta. Pero
--   `components/ui/FotoVehiculo.tsx` escribe siempre en la misma ruta:
--
--       ${taller_id}/${cliente_id}/vehiculo.${ext}
--
--   con `upsert: true`. La primera foto del vehículo de un cliente entra como
--   INSERT y funciona. Al **reemplazarla** —el mecánico repite la foto porque
--   salió movida, o el cliente vuelve con el mismo coche— la operación pasa a
--   ser un UPDATE, no hay política que lo permita, y falla.
--
--   El componente lo enseña como "Error subiendo la foto. Intenta de nuevo",
--   sin decir el motivo, así que el taller reintenta y vuelve a fallar siempre.
--
--   Es exactamente el mismo hueco que tenía `logos` (migración 047) y por el
--   mismo motivo: `upsert` necesita INSERT **y** UPDATE, y engaña porque la
--   primera vez funciona.
--
-- Ejecutar en: Supabase > SQL Editor. Solo base de datos, no necesita
-- despliegue ni antes ni después.
-- ---------------------------------------------------------------------------

drop policy if exists "diagnosticos: update propio taller" on storage.objects;

create policy "diagnosticos: update propio taller"
  on storage.objects for update
  using (
    bucket_id = 'diagnosticos'
    and (storage.foldername(name))[1] = (public.get_my_taller_id())::text
  )
  with check (
    bucket_id = 'diagnosticos'
    and (storage.foldername(name))[1] = (public.get_my_taller_id())::text
  );

-- Comprobar cómo quedó: deben salir cuatro (select, insert, update, delete).
select policyname, cmd
from pg_policies
where schemaname = 'storage'
  and tablename  = 'objects'
  and policyname like 'diagnosticos:%'
order by cmd;
