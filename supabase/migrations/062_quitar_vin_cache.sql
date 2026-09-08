-- Se retira el caché de VIN junto con la función que lo usaba.
--
-- "Buscar refacción" se dio marcha atrás por decisión del dueño del producto.
-- El motivo no fue técnico: la pantalla mandaba al mecánico a un catálogo de
-- terceros, ese catálogo cobra, y llevarle nuestros talleres era regalarle
-- clientes. Sin catálogo al final del camino, decodificar el VIN se quedaba a
-- medias — enseñaba el motor y ahí acababa la historia.
--
-- Se mira si vale la pena guardar la tabla por si vuelve: no. Tenía una sola
-- fila, y es un caché — se rellena solo consultando otra vez. Lo que sí queda
-- guardado es el conocimiento, en el histórico del repositorio: qué devuelve
-- NHTSA para un Jetta de Puebla, para una NP300 de Jiutepec y para un Virtus
-- brasileño, y por qué su año no se puede creer sin comprobarlo.
--
-- Si algún día se retoma, esta tabla se vuelve a crear en cinco minutos con la
-- migración 060, que sigue en el histórico.

drop table if exists public.vin_cache;
