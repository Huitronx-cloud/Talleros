-- El id del evento que TallerOS creó en el Google Calendar del taller.
--
-- `app/api/google/calendar/route.ts` ya intentaba guardarlo, pero la columna no
-- existía. Daba igual: ese endpoint fallaba antes de llegar aquí, porque su
-- consulta pedía columnas que `citas` no tiene y uniones que no existen. Y
-- tampoco se notaba, porque ninguna pantalla lo llamaba.
--
-- Sirve para saber qué citas ya están en el calendario y no ofrecer el botón
-- dos veces: pulsarlo de nuevo crearía un evento duplicado.

alter table public.citas add column if not exists google_calendar_event_id text;
