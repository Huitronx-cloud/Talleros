-- Poner a cada taller la moneda de su país
-- ---------------------------------------------------------------------------
-- Qué pasaba:
--   El alta nunca escribía `moneda`, así que todos los talleres se quedaban con
--   el valor por defecto de la columna: MXN. Veintiún talleres de ocho países
--   —Argentina, Perú, Venezuela, Guatemala, Canadá, Ecuador, Costa Rica y dos
--   de Colombia— veían su dinero en pesos mexicanos: en las órdenes, en las
--   cotizaciones, en los reportes y en los WhatsApp que le mandan a su cliente.
--
--   El selector de moneda en Configuración sí existe y tiene las 16 monedas,
--   pero nadie entra a cambiarlo: no sabes que está mal hasta que ves un
--   importe raro, y para entonces ya te fuiste.
--
-- Qué hace esto:
--   Solo toca talleres cuya moneda sigue siendo MXN y cuyo país NO es México.
--   Quien ya eligió su moneda a mano no se toca — por eso el filtro es
--   `moneda = 'MXN'` y no "distinto de la moneda del país".
--
--   Los importes NO se convierten ni se recalculan: un taller argentino que
--   escribió 15000 quería decir quince mil pesos argentinos, y lo único que
--   cambia es que dejará de leerse "15,000 MX$" para leerse "15.000,00 AR$".
--
-- Ejecutar en: Supabase > SQL Editor
--   1º  migrations/046_monedas_latam.sql — sin ella la columna solo acepta MXN
--       y COP, y el update de abajo revienta en la primera fila argentina.
--   2º  desplegar el código nuevo.
--   3º  este archivo.
-- ---------------------------------------------------------------------------

-- 1) Ver a quién va a afectar, antes de tocar nada.
select t.pais, t.moneda as moneda_actual, count(*) as talleres
from talleres t
where t.moneda = 'MXN'
  and upper(coalesce(t.pais, 'MX')) not in ('MX', 'MEXICO', 'MÉXICO')
group by t.pais, t.moneda
order by talleres desc;

-- 2) Aplicar.
update talleres t
set moneda = m.moneda
from (values
  ('AR', 'ARS'), ('CO', 'COP'), ('CL', 'CLP'), ('PE', 'PEN'),
  ('EC', 'USD'), ('VE', 'USD'), ('BO', 'BOB'), ('PY', 'PYG'),
  ('UY', 'UYU'), ('GT', 'GTQ'), ('CR', 'CRC'), ('PA', 'USD'),
  ('HN', 'HNL'), ('SV', 'USD'), ('NI', 'NIO'), ('DO', 'DOP'),
  ('US', 'USD'), ('CA', 'CAD')
) as m(codigo, moneda)
where upper(t.pais) = m.codigo
  and t.moneda = 'MXN';

-- 3) Confirmar cómo quedó el reparto.
select coalesce(pais, '—') as pais, coalesce(moneda, 'sin moneda') as moneda,
       count(*) as talleres
from talleres
group by pais, moneda
order by talleres desc;
