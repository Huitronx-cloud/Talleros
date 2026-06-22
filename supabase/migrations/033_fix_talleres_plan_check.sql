-- ── Corregir talleres_plan_check para permitir 'trial' y 'esencial' ───────────
-- El check original (001_initial.sql) solo permitía 'gratis', 'basico', 'pro'.
-- handle_new_user() (024_missing_tables.sql) inserta plan='trial', y el resto
-- de la app (lib/plan-limits.ts, lib/stripe.ts) usa 'trial' | 'esencial' | 'pro'.
-- Esto rompía TODO registro nuevo: el insert en talleres violaba el check,
-- abortaba la transacción y Supabase Auth devolvía "Database error creating
-- new user" al crear la cuenta.

alter table public.talleres drop constraint if exists talleres_plan_check;

alter table public.talleres
  add constraint talleres_plan_check
  check (plan in ('gratis', 'basico', 'trial', 'esencial', 'pro'));
