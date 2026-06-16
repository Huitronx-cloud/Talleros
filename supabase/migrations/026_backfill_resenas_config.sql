-- Antes de esta migración, el envío automático de reseñas leía directamente
-- talleres.google_review_url (sin tabla resenas_config). El flujo de la app
-- ahora usa resenas_config (activo/canal/plantillas), así que se crea un
-- registro inicial para talleres que ya tenían su URL configurada en el
-- flujo anterior, para que el envío automático no se interrumpa.
insert into public.resenas_config (taller_id, activo, canal, google_review_url)
select t.id, true, 'whatsapp', t.google_review_url
from public.talleres t
where t.google_review_url is not null
  and t.google_review_url <> ''
  and not exists (
    select 1 from public.resenas_config rc where rc.taller_id = t.id
  )
on conflict (taller_id) do nothing;
