-- Las cuentas de prueba, marcadas de una vez.
--
-- El dueño ha ido creando talleres para probar la aplicación, y están mezclados
-- con los de verdad. Eso ensucia cualquier medición: la de activación del
-- onboarding contaba como "taller activado" una cuenta suya con cinco órdenes
-- de prueba, y con 31 talleres en la cohorte, uno solo mueve el porcentaje dos
-- puntos. Los números tienen que salir de los clientes, no de nosotros.
--
-- Se marcan por id y no por nombre a propósito: hay cinco talleres llamados
-- "Leffimo" y dos "Chuy", y un ilike sobre el nombre podría llevarse por
-- delante un taller de verdad que se llame parecido.
--
-- Lista confirmada por el dueño el 08/09/2026.
--
-- NO se incluye el "Mariantonieta" del 26/05 (6ae461e7): tiene un correo,
-- marian228@hotmail.com, que no se parece a los suyos, y podría ser una
-- persona de verdad. Queda pendiente de confirmar. El otro "Mariantonieta",
-- el del 07/05, sí va: no tiene usuario, ni órdenes, ni clientes.

alter table public.talleres
  add column if not exists es_prueba boolean not null default false;

update public.talleres
set es_prueba = true
where id in (
  -- Basura de las primeras pruebas: sin usuario, sin órdenes y sin clientes.
  'f242635e-e5df-4c18-81c7-bd344d1eae57', -- Chuy
  'de5585e9-32bd-4c83-a214-d43e00dd8304', -- Chuy
  '3f91d91c-0980-4baa-b607-424569fb3fd6', -- Mariantonieta (07/05, sin usuario)
  '100fd395-da05-4acd-9dbd-96784c304dde', -- Chumata
  '35133a70-0916-4018-908d-1e8e38eab470', -- El Chuy
  '36218398-dea7-43da-839b-56901a10751d', -- Maldita Realidad
  'af63f67d-afc1-4e1c-9a35-4946e2136c2e', -- leffimo
  'b62ca513-0cc5-4f51-9c07-ba8651d32ff7', -- leffimo
  'bbca4884-c473-4257-8903-26df5f43b1d5', -- Leffimo
  'be8c5143-e7b1-42f0-bca4-a4bc8975000c', -- Maldititita
  '2878a410-5944-4ac8-8ae1-e5b13266e4b2', -- Leffimo
  '29f84147-8270-4dd7-92d9-3f19e203c602', -- leffimo
  '977a9df4-d364-44ae-aacf-8715819777d4', -- dsadsad
  '0f427fbf-a0e4-40b6-8916-a13a3cbfc39b', -- Leffcsd
  '7fa5e97d-0c76-44d4-bf1f-5b21266c177e', -- efwefrew
  'a5643f00-34ac-481b-b685-c626d772ba6e', -- popop
  '99867f76-4dc8-40d1-8359-2538aa56f3d9', -- Don chuy
  '826a16f4-bb06-4832-ac29-d1ed2fc62c24', -- Leffimo
  '5bcf707c-4af8-4c1c-b219-038054e46494', -- expande
  '517a842d-d098-4f8f-8dbe-b8cc53b0c8d2', -- El mike
  'adf2f266-6439-4a5e-af09-19222ac75b2f', -- Dogon
  -- Cuentas con las que el dueño trabaja de verdad para probar. Estas son las
  -- que ensuciaban las mediciones, porque sí tienen órdenes y clientes.
  'ef4cf77d-977b-4b91-8619-af41d96ce5bb', -- Huitron (huitronx@icloud.com)
  '54da48c8-89a9-4022-aade-7a5507330ddd', -- El Ivancho (tallerosapp@gmail.com)
  'fbfc14fe-7515-4c86-8cb3-e4e1802b7e30', -- Taller Mecánico Enzo (enzo@gmail.com)
  '86532550-78c4-4603-a700-e85a5b1c38c9'  -- Taller mecánico el Men (chuymtz@gmail.com)
);
