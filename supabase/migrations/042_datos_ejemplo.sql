-- ── Datos de ejemplo del primer arranque ──────────────────────────────────────
-- Un taller que entra por primera vez se encuentra el panel vacío y se va: de
-- 73 registros, apenas 15 llegaron a cargar un cliente. Al darse de alta se le
-- siembran dos clientes y una orden en curso para que vea el producto
-- funcionando desde el primer minuto.
--
-- Se marcan con es_ejemplo para poder hacer tres cosas que serían imposibles
-- con filas indistinguibles: enseñarlas como muestra en la interfaz, borrarlas
-- todas de golpe cuando el taller ya no las necesita, y —lo más importante—
-- dejarlas fuera de los topes del plan. Sin esto, un taller gratuito arrancaría
-- con 2 de sus 20 clientes y 1 de sus 10 órdenes mensuales ya gastados por
-- datos que no pidió.

alter table public.clientes add column if not exists es_ejemplo boolean not null default false;
alter table public.ordenes  add column if not exists es_ejemplo boolean not null default false;

-- Índices parciales: solo indexan las filas de ejemplo, que son un puñado por
-- taller. Sirven al borrado masivo sin cargar con el peso de los datos reales.
create index if not exists idx_clientes_ejemplo
  on public.clientes(taller_id) where es_ejemplo;
create index if not exists idx_ordenes_ejemplo
  on public.ordenes(taller_id)  where es_ejemplo;

comment on column public.clientes.es_ejemplo is
  'Fila sembrada al registrarse. No cuenta para los topes del plan y se puede borrar en bloque.';
comment on column public.ordenes.es_ejemplo is
  'Fila sembrada al registrarse. No cuenta para los topes del plan y se puede borrar en bloque.';

-- ── Reinicio del contador al retirar la muestra ───────────────────────────────
-- La orden de ejemplo consume el número 1 del taller. Si se borra sin más, el
-- primer trabajo real sería la orden #0002 y faltaría la #0001, que es justo el
-- tipo de detalle que hace desconfiar de un sistema de numeración.
--
-- Va como función con privilegios porque contadores_orden solo tiene política
-- de lectura, igual que siguiente_numero_orden. La condición de "no quedan
-- órdenes" se comprueba dentro: así nadie puede renumerar sobre trabajos que ya
-- existen, ni siquiera llamando a la función a mano.
create or replace function public.reiniciar_contador_orden(p_taller_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  if exists (select 1 from public.ordenes where taller_id = p_taller_id) then
    return;
  end if;

  update public.contadores_orden
     set ultimo_numero = 0
   where taller_id = p_taller_id;
end;
$$;
