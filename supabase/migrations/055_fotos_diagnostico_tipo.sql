-- La columna `tipo` de fotos_diagnostico, que el código lleva usando desde
-- siempre y que nunca existió.
--
-- Confirmado consultando information_schema el 06/09/2026: la tabla tiene id,
-- orden_id, taller_id, url, descripcion y created_at. Nada más. Y sin embargo:
--
--   · checklist-recepcion.tsx inserta con tipo 'recepcion'
--   · firma-digital.tsx inserta con tipo 'firma'
--   · el portal filtra por f.tipo para separar las tres clases de foto
--
-- Los dos inserts fallaban SIEMPRE. Nadie se enteró porque ninguno miraba el
-- error, hasta que se le puso comprobación al checklist y un taller vio el
-- aviso. Las fotos de recepción se subían al bucket y su fila nunca se creaba:
-- quedaban huérfanas, sin nada que las apuntara desde la orden.
--
-- La firma sí quedó guardada pese a todo, por un accidente afortunado: el
-- `update` de ordenes.firma_cliente_url va después del insert y, al no
-- comprobarse el error, la ejecución seguía. O sea que la imagen está en la
-- orden aunque su fila no se creara.
--
-- Las filas que ya existen vienen de fotos-diagnosticos.tsx, que no manda tipo:
-- son fotos de diagnóstico y se marcan como tales. El portal ya las enseñaba
-- —su filtro es "ni recepción ni firma"— así que rellenarlas no cambia nada de
-- lo que se ve hoy; solo deja de haber nulos.

alter table public.fotos_diagnostico
  add column if not exists tipo text not null default 'diagnostico';

update public.fotos_diagnostico
set tipo = 'diagnostico'
where tipo is null;

-- Solo estos tres valores. Es exactamente la clase de guardia que habría hecho
-- ruidoso este fallo desde el principio en vez de dejarlo dos meses callado.
alter table public.fotos_diagnostico
  drop constraint if exists fotos_diagnostico_tipo_check;

alter table public.fotos_diagnostico
  add constraint fotos_diagnostico_tipo_check
  check (tipo in ('diagnostico', 'recepcion', 'firma'));

create index if not exists fotos_diagnostico_orden_tipo_idx
  on public.fotos_diagnostico (orden_id, tipo);
