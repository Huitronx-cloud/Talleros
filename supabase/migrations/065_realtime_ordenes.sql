-- Enciende realtime para `ordenes`.
--
-- Igual que la 064 con `citas`: el componente que avisa a recepción cuando una
-- orden pasa a "listo" (components/recepcion/notificaciones-realtime.tsx) lleva
-- desde siempre suscrito a esta tabla, y nunca ha recibido un solo evento
-- porque la publicación `supabase_realtime` estaba vacía.
--
-- No basta con publicarla: el componente además decidía si avisar mirando
-- `payload.old.estado`, y con la replica identity por defecto el registro viejo
-- solo trae la clave primaria. Eso se arregla en el mismo cambio, del lado del
-- navegador, para no tener que poner `replica identity full` —que obligaría a
-- escribir la fila vieja entera en el WAL, jsonb de servicios incluido, en cada
-- actualización de cada orden— solo para saber un dato que el cliente puede
-- averiguar por su cuenta.
--
-- Verificación:
--   select tablename from pg_publication_tables where pubname = 'supabase_realtime';
--   -- debe listar citas y ordenes

alter publication supabase_realtime add table public.ordenes;
