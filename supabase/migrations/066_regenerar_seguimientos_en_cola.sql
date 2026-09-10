-- Regenera los 27 seguimientos que siguen en cola con el texto viejo.
--
-- Decían esto, y estaban esperando a que alguien los mandara:
--
--   "Hola Daniel caraveo  😊 ¿Cómo ha funcionado Volkswagen Jetta después del
--    servicio en el taller?"
--
-- Dos cosas mal en una frase. "el taller" es el respaldo que saltaba porque la
-- consulta pedía una columna inexistente (arreglado en el mismo cambio que trae
-- esta migración), y el emoji es de antes de que se quitaran de los mensajes a
-- clientes. Quedan así:
--
--   "Hola Daniel caraveo, ¿cómo ha funcionado Volkswagen Jetta después del
--    servicio en FASTCAR?"
--
-- ── Por qué son 27 updates a mano y no uno con replace() ───────────────────
--
-- Porque `wa_link` lleva el mensaje codificado dentro de la URL, y es el enlace
-- —no `mensaje_texto`— lo que se abre al tocar Enviar. Un replace() sobre texto
-- plano arreglaría lo que se ve en la lista y dejaría el enlace mandando el
-- mensaje viejo: lo peor de los dos mundos, y sin que nadie lo note.
--
-- Postgres no trae codificador de URL, así que el texto y el enlace se
-- generaron fuera con el MISMO código que usa la aplicación
-- (lib/whatsapp-link.ts), y cada fila se comprobó antes de escribirla aquí:
-- que ya no diga "el taller", que no le quede ningún emoji, que el teléfono
-- quede entre 10 y 15 dígitos con su lada, y que el texto sobreviva la ida y
-- vuelta por la codificación. Las 27 pasaron las cuatro.
--
-- El `and estado = 'pendiente'` de cada línea no sobra: si el taller manda o
-- descarta alguno entre que esto se escribe y se corre, esa fila se queda como
-- está en vez de reescribirse por detrás.
--
-- Verificación:
--   select count(*) from mensajes_pendientes
--   where tipo = 'seguimiento' and estado = 'pendiente'
--     and mensaje_texto like '%en el taller%';
--   -- debe dar 0

update public.mensajes_pendientes set
  mensaje_texto = 'Hola Daniel caraveo, ¿cómo ha funcionado Volkswagen Jetta después del servicio en FASTCAR?

Su opinión nos ayuda a mejorar. ¿Nos regalas una reseña en Google?',
  wa_link       = 'https://wa.me/529993573267?text=Hola%20Daniel%20caraveo%2C%20%C2%BFc%C3%B3mo%20ha%20funcionado%20Volkswagen%20Jetta%20despu%C3%A9s%20del%20servicio%20en%20FASTCAR%3F%0A%0ASu%20opini%C3%B3n%20nos%20ayuda%20a%20mejorar.%20%C2%BFNos%20regalas%20una%20rese%C3%B1a%20en%20Google%3F'
where id = '6e0c9799-300d-44a6-a413-36730f0d8ab2' and estado = 'pendiente';

update public.mensajes_pendientes set
  mensaje_texto = 'Hola CRISTIAN REYES, ¿cómo ha funcionado Nissan Versa después del servicio en FASTCAR?

Su opinión nos ayuda a mejorar. ¿Nos regalas una reseña en Google?',
  wa_link       = 'https://wa.me/529834383704?text=Hola%20CRISTIAN%20REYES%2C%20%C2%BFc%C3%B3mo%20ha%20funcionado%20Nissan%20Versa%20despu%C3%A9s%20del%20servicio%20en%20FASTCAR%3F%0A%0ASu%20opini%C3%B3n%20nos%20ayuda%20a%20mejorar.%20%C2%BFNos%20regalas%20una%20rese%C3%B1a%20en%20Google%3F'
where id = '06fe618f-8ae0-4b5a-9da3-3030bbffac39' and estado = 'pendiente';

update public.mensajes_pendientes set
  mensaje_texto = 'Hola diego mena, ¿cómo ha funcionado Ford figo después del servicio en FASTCAR?

Su opinión nos ayuda a mejorar. ¿Nos regalas una reseña en Google?',
  wa_link       = 'https://wa.me/529999681176?text=Hola%20diego%20mena%2C%20%C2%BFc%C3%B3mo%20ha%20funcionado%20Ford%20figo%20despu%C3%A9s%20del%20servicio%20en%20FASTCAR%3F%0A%0ASu%20opini%C3%B3n%20nos%20ayuda%20a%20mejorar.%20%C2%BFNos%20regalas%20una%20rese%C3%B1a%20en%20Google%3F'
where id = '66549405-0285-40ed-9986-d77e5a2e3d5a' and estado = 'pendiente';

update public.mensajes_pendientes set
  mensaje_texto = 'Hola CARLOS LARA, ¿cómo ha funcionado Nissan Versa después del servicio en FASTCAR?

Su opinión nos ayuda a mejorar. ¿Nos regalas una reseña en Google?',
  wa_link       = 'https://wa.me/529992688169?text=Hola%20CARLOS%20LARA%2C%20%C2%BFc%C3%B3mo%20ha%20funcionado%20Nissan%20Versa%20despu%C3%A9s%20del%20servicio%20en%20FASTCAR%3F%0A%0ASu%20opini%C3%B3n%20nos%20ayuda%20a%20mejorar.%20%C2%BFNos%20regalas%20una%20rese%C3%B1a%20en%20Google%3F'
where id = 'd9b02b28-2316-46e5-8aea-87096cb943d2' and estado = 'pendiente';

update public.mensajes_pendientes set
  mensaje_texto = 'Hola Daniel caraveo, ¿cómo ha funcionado Nissan Kicks después del servicio en FASTCAR?

Su opinión nos ayuda a mejorar. ¿Nos regalas una reseña en Google?',
  wa_link       = 'https://wa.me/529993573267?text=Hola%20Daniel%20caraveo%2C%20%C2%BFc%C3%B3mo%20ha%20funcionado%20Nissan%20Kicks%20despu%C3%A9s%20del%20servicio%20en%20FASTCAR%3F%0A%0ASu%20opini%C3%B3n%20nos%20ayuda%20a%20mejorar.%20%C2%BFNos%20regalas%20una%20rese%C3%B1a%20en%20Google%3F'
where id = 'e3090b54-c0fc-4891-98df-1bf436ab8dd7' and estado = 'pendiente';

update public.mensajes_pendientes set
  mensaje_texto = 'Hola JOSE NASSIM PINELO, ¿cómo ha funcionado Chevrolet S10 max después del servicio en FASTCAR?

Su opinión nos ayuda a mejorar. ¿Nos regalas una reseña en Google?',
  wa_link       = 'https://wa.me/529992163138?text=Hola%20JOSE%20NASSIM%20PINELO%2C%20%C2%BFc%C3%B3mo%20ha%20funcionado%20Chevrolet%20S10%20max%20despu%C3%A9s%20del%20servicio%20en%20FASTCAR%3F%0A%0ASu%20opini%C3%B3n%20nos%20ayuda%20a%20mejorar.%20%C2%BFNos%20regalas%20una%20rese%C3%B1a%20en%20Google%3F'
where id = '27242de9-37f8-4feb-979c-071af39452ec' and estado = 'pendiente';

update public.mensajes_pendientes set
  mensaje_texto = 'Hola Jaime Canul, ¿cómo ha funcionado Honda HR-V después del servicio en FASTCAR?

Su opinión nos ayuda a mejorar. ¿Nos regalas una reseña en Google?',
  wa_link       = 'https://wa.me/529993677778?text=Hola%20Jaime%20Canul%2C%20%C2%BFc%C3%B3mo%20ha%20funcionado%20Honda%20HR-V%20despu%C3%A9s%20del%20servicio%20en%20FASTCAR%3F%0A%0ASu%20opini%C3%B3n%20nos%20ayuda%20a%20mejorar.%20%C2%BFNos%20regalas%20una%20rese%C3%B1a%20en%20Google%3F'
where id = '05730fad-29a1-4937-a00b-02b9cf0f14f4' and estado = 'pendiente';

update public.mensajes_pendientes set
  mensaje_texto = 'Hola Alejandra Guadalupe Canul Gonzalz, ¿cómo ha funcionado Nissan Versa después del servicio en FASTCAR?

Su opinión nos ayuda a mejorar. ¿Nos regalas una reseña en Google?',
  wa_link       = 'https://wa.me/529992772620?text=Hola%20Alejandra%20Guadalupe%20Canul%20Gonzalz%2C%20%C2%BFc%C3%B3mo%20ha%20funcionado%20Nissan%20Versa%20despu%C3%A9s%20del%20servicio%20en%20FASTCAR%3F%0A%0ASu%20opini%C3%B3n%20nos%20ayuda%20a%20mejorar.%20%C2%BFNos%20regalas%20una%20rese%C3%B1a%20en%20Google%3F'
where id = '53c70da9-f486-4914-9d0d-013930e6ac52' and estado = 'pendiente';

update public.mensajes_pendientes set
  mensaje_texto = 'Hola MARCELO PRIEGO, ¿cómo ha funcionado Nissan X-Trail después del servicio en FASTCAR?

Su opinión nos ayuda a mejorar. ¿Nos regalas una reseña en Google?',
  wa_link       = 'https://wa.me/529991111899?text=Hola%20MARCELO%20PRIEGO%2C%20%C2%BFc%C3%B3mo%20ha%20funcionado%20Nissan%20X-Trail%20despu%C3%A9s%20del%20servicio%20en%20FASTCAR%3F%0A%0ASu%20opini%C3%B3n%20nos%20ayuda%20a%20mejorar.%20%C2%BFNos%20regalas%20una%20rese%C3%B1a%20en%20Google%3F'
where id = 'cff87aab-f3a1-43cd-ad94-23e9ec1d237a' and estado = 'pendiente';

update public.mensajes_pendientes set
  mensaje_texto = 'Hola enrique trejo, ¿cómo ha funcionado Dodge stratus después del servicio en FASTCAR?

Su opinión nos ayuda a mejorar. ¿Nos regalas una reseña en Google?',
  wa_link       = 'https://wa.me/529991381974?text=Hola%20enrique%20trejo%2C%20%C2%BFc%C3%B3mo%20ha%20funcionado%20Dodge%20stratus%20despu%C3%A9s%20del%20servicio%20en%20FASTCAR%3F%0A%0ASu%20opini%C3%B3n%20nos%20ayuda%20a%20mejorar.%20%C2%BFNos%20regalas%20una%20rese%C3%B1a%20en%20Google%3F'
where id = '9d232b79-9b94-44a1-a8b6-18fcd95d4bb6' and estado = 'pendiente';

update public.mensajes_pendientes set
  mensaje_texto = 'Hola JOSE NASSIM PINELO, ¿cómo ha funcionado RAM 2500 después del servicio en FASTCAR?

Su opinión nos ayuda a mejorar. ¿Nos regalas una reseña en Google?',
  wa_link       = 'https://wa.me/529992163138?text=Hola%20JOSE%20NASSIM%20PINELO%2C%20%C2%BFc%C3%B3mo%20ha%20funcionado%20RAM%202500%20despu%C3%A9s%20del%20servicio%20en%20FASTCAR%3F%0A%0ASu%20opini%C3%B3n%20nos%20ayuda%20a%20mejorar.%20%C2%BFNos%20regalas%20una%20rese%C3%B1a%20en%20Google%3F'
where id = 'ecae3163-e934-4ef0-a565-fdcd9f02b548' and estado = 'pendiente';

update public.mensajes_pendientes set
  mensaje_texto = 'Hola Andres Blanco, ¿cómo ha funcionado Renault Duster después del servicio en FASTCAR?

Su opinión nos ayuda a mejorar. ¿Nos regalas una reseña en Google?',
  wa_link       = 'https://wa.me/529994927175?text=Hola%20Andres%20Blanco%2C%20%C2%BFc%C3%B3mo%20ha%20funcionado%20Renault%20Duster%20despu%C3%A9s%20del%20servicio%20en%20FASTCAR%3F%0A%0ASu%20opini%C3%B3n%20nos%20ayuda%20a%20mejorar.%20%C2%BFNos%20regalas%20una%20rese%C3%B1a%20en%20Google%3F'
where id = 'bb4cc38f-f7fe-4e0a-ad80-12e5eca40f0f' and estado = 'pendiente';

update public.mensajes_pendientes set
  mensaje_texto = 'Hola JOSE NASSIM PINELO, ¿cómo ha funcionado Chevrolet S 10 MAX después del servicio en FASTCAR?

Su opinión nos ayuda a mejorar. ¿Nos regalas una reseña en Google?',
  wa_link       = 'https://wa.me/529992163138?text=Hola%20JOSE%20NASSIM%20PINELO%2C%20%C2%BFc%C3%B3mo%20ha%20funcionado%20Chevrolet%20S%2010%20MAX%20despu%C3%A9s%20del%20servicio%20en%20FASTCAR%3F%0A%0ASu%20opini%C3%B3n%20nos%20ayuda%20a%20mejorar.%20%C2%BFNos%20regalas%20una%20rese%C3%B1a%20en%20Google%3F'
where id = 'a14225c4-ba63-4547-96e6-67c2d244f3ec' and estado = 'pendiente';

update public.mensajes_pendientes set
  mensaje_texto = 'Hola JOSE NASSIM PINELO, ¿cómo ha funcionado Ford 3500 después del servicio en FASTCAR?

Su opinión nos ayuda a mejorar. ¿Nos regalas una reseña en Google?',
  wa_link       = 'https://wa.me/529992163138?text=Hola%20JOSE%20NASSIM%20PINELO%2C%20%C2%BFc%C3%B3mo%20ha%20funcionado%20Ford%203500%20despu%C3%A9s%20del%20servicio%20en%20FASTCAR%3F%0A%0ASu%20opini%C3%B3n%20nos%20ayuda%20a%20mejorar.%20%C2%BFNos%20regalas%20una%20rese%C3%B1a%20en%20Google%3F'
where id = 'c0b58c8f-bfc0-4b53-9bb3-d4e189592270' and estado = 'pendiente';

update public.mensajes_pendientes set
  mensaje_texto = 'Hola jorge serrano, ¿cómo ha funcionado Honda CR-V después del servicio en FASTCAR?

Su opinión nos ayuda a mejorar. ¿Nos regalas una reseña en Google?',
  wa_link       = 'https://wa.me/525555088340?text=Hola%20jorge%20serrano%2C%20%C2%BFc%C3%B3mo%20ha%20funcionado%20Honda%20CR-V%20despu%C3%A9s%20del%20servicio%20en%20FASTCAR%3F%0A%0ASu%20opini%C3%B3n%20nos%20ayuda%20a%20mejorar.%20%C2%BFNos%20regalas%20una%20rese%C3%B1a%20en%20Google%3F'
where id = 'a8ed4480-b94f-4ff8-91b6-ab699aac92e2' and estado = 'pendiente';

update public.mensajes_pendientes set
  mensaje_texto = 'Hola Marcos David Chacón Medina, ¿cómo ha funcionado Kia FORTE después del servicio en FASTCAR?

Su opinión nos ayuda a mejorar. ¿Nos regalas una reseña en Google?',
  wa_link       = 'https://wa.me/529992509647?text=Hola%20Marcos%20David%20Chac%C3%B3n%20Medina%2C%20%C2%BFc%C3%B3mo%20ha%20funcionado%20Kia%20FORTE%20despu%C3%A9s%20del%20servicio%20en%20FASTCAR%3F%0A%0ASu%20opini%C3%B3n%20nos%20ayuda%20a%20mejorar.%20%C2%BFNos%20regalas%20una%20rese%C3%B1a%20en%20Google%3F'
where id = '20c1b241-bebe-4802-91e7-b39603132536' and estado = 'pendiente';

update public.mensajes_pendientes set
  mensaje_texto = 'Hola GONZALO MARQUEZ HIJO, ¿cómo ha funcionado Acura RDX después del servicio en FASTCAR?

Su opinión nos ayuda a mejorar. ¿Nos regalas una reseña en Google?',
  wa_link       = 'https://wa.me/523313186670?text=Hola%20GONZALO%20MARQUEZ%20HIJO%2C%20%C2%BFc%C3%B3mo%20ha%20funcionado%20Acura%20RDX%20despu%C3%A9s%20del%20servicio%20en%20FASTCAR%3F%0A%0ASu%20opini%C3%B3n%20nos%20ayuda%20a%20mejorar.%20%C2%BFNos%20regalas%20una%20rese%C3%B1a%20en%20Google%3F'
where id = 'a2f41381-d7d6-41ad-92ec-947e18463f85' and estado = 'pendiente';

update public.mensajes_pendientes set
  mensaje_texto = 'Hola Miguel, ¿cómo ha funcionado Suzuki S-Cross después del servicio en FASTCAR?

Su opinión nos ayuda a mejorar. ¿Nos regalas una reseña en Google?',
  wa_link       = 'https://wa.me/529992358198?text=Hola%20Miguel%2C%20%C2%BFc%C3%B3mo%20ha%20funcionado%20Suzuki%20S-Cross%20despu%C3%A9s%20del%20servicio%20en%20FASTCAR%3F%0A%0ASu%20opini%C3%B3n%20nos%20ayuda%20a%20mejorar.%20%C2%BFNos%20regalas%20una%20rese%C3%B1a%20en%20Google%3F'
where id = '92875228-4a4f-4bc2-8edd-2b06fd1f4580' and estado = 'pendiente';

update public.mensajes_pendientes set
  mensaje_texto = 'Hola Alejandra Guadalupe Canul Gonzalz, ¿cómo ha funcionado Nissan Versa después del servicio en FASTCAR?

Su opinión nos ayuda a mejorar. ¿Nos regalas una reseña en Google?',
  wa_link       = 'https://wa.me/529992772620?text=Hola%20Alejandra%20Guadalupe%20Canul%20Gonzalz%2C%20%C2%BFc%C3%B3mo%20ha%20funcionado%20Nissan%20Versa%20despu%C3%A9s%20del%20servicio%20en%20FASTCAR%3F%0A%0ASu%20opini%C3%B3n%20nos%20ayuda%20a%20mejorar.%20%C2%BFNos%20regalas%20una%20rese%C3%B1a%20en%20Google%3F'
where id = '41f59adc-eea5-42ba-9af9-8e4cb5bb7508' and estado = 'pendiente';

update public.mensajes_pendientes set
  mensaje_texto = 'Hola Leonardo morales repilado, ¿cómo ha funcionado Chevrolet Beat después del servicio en FASTCAR?

Su opinión nos ayuda a mejorar. ¿Nos regalas una reseña en Google?',
  wa_link       = 'https://wa.me/529992757189?text=Hola%20Leonardo%20morales%20repilado%2C%20%C2%BFc%C3%B3mo%20ha%20funcionado%20Chevrolet%20Beat%20despu%C3%A9s%20del%20servicio%20en%20FASTCAR%3F%0A%0ASu%20opini%C3%B3n%20nos%20ayuda%20a%20mejorar.%20%C2%BFNos%20regalas%20una%20rese%C3%B1a%20en%20Google%3F'
where id = 'ad52764b-efc3-4218-85dd-3d51d06b48b3' and estado = 'pendiente';

update public.mensajes_pendientes set
  mensaje_texto = 'Hola ALVARO, ¿cómo ha funcionado Ford Focus después del servicio en FASTCAR?

Su opinión nos ayuda a mejorar. ¿Nos regalas una reseña en Google?',
  wa_link       = 'https://wa.me/529993095047?text=Hola%20ALVARO%2C%20%C2%BFc%C3%B3mo%20ha%20funcionado%20Ford%20Focus%20despu%C3%A9s%20del%20servicio%20en%20FASTCAR%3F%0A%0ASu%20opini%C3%B3n%20nos%20ayuda%20a%20mejorar.%20%C2%BFNos%20regalas%20una%20rese%C3%B1a%20en%20Google%3F'
where id = '9edcba99-b764-4e12-8591-76d4d8c526fa' and estado = 'pendiente';

update public.mensajes_pendientes set
  mensaje_texto = 'Hola Aurora Alanis, ¿cómo ha funcionado Ford Escape después del servicio en Chilli Garage?

Su opinión nos ayuda a mejorar. ¿Nos regalas una reseña en Google?',
  wa_link       = 'https://wa.me/528130547194?text=Hola%20Aurora%20Alanis%2C%20%C2%BFc%C3%B3mo%20ha%20funcionado%20Ford%20Escape%20despu%C3%A9s%20del%20servicio%20en%20Chilli%20Garage%3F%0A%0ASu%20opini%C3%B3n%20nos%20ayuda%20a%20mejorar.%20%C2%BFNos%20regalas%20una%20rese%C3%B1a%20en%20Google%3F'
where id = 'db467898-b106-4aee-a011-c6bd5b501ce8' and estado = 'pendiente';

update public.mensajes_pendientes set
  mensaje_texto = 'Hola Jose Juan Perez, ¿cómo ha funcionado Nissan X-Trail después del servicio en ZUÑIGA AUTOMOTRIZ?

Su opinión nos ayuda a mejorar. ¿Nos regalas una reseña en Google?',
  wa_link       = 'https://wa.me/524424646742?text=Hola%20Jose%20Juan%20Perez%2C%20%C2%BFc%C3%B3mo%20ha%20funcionado%20Nissan%20X-Trail%20despu%C3%A9s%20del%20servicio%20en%20ZU%C3%91IGA%20AUTOMOTRIZ%3F%0A%0ASu%20opini%C3%B3n%20nos%20ayuda%20a%20mejorar.%20%C2%BFNos%20regalas%20una%20rese%C3%B1a%20en%20Google%3F'
where id = 'b9e33385-4637-4101-806c-6407d4d04d96' and estado = 'pendiente';

update public.mensajes_pendientes set
  mensaje_texto = 'Hola Angelica santiago, ¿cómo ha funcionado Chevrolet Tracker después del servicio en FASTCAR?

Su opinión nos ayuda a mejorar. ¿Nos regalas una reseña en Google?',
  wa_link       = 'https://wa.me/529992646938?text=Hola%20Angelica%20santiago%2C%20%C2%BFc%C3%B3mo%20ha%20funcionado%20Chevrolet%20Tracker%20despu%C3%A9s%20del%20servicio%20en%20FASTCAR%3F%0A%0ASu%20opini%C3%B3n%20nos%20ayuda%20a%20mejorar.%20%C2%BFNos%20regalas%20una%20rese%C3%B1a%20en%20Google%3F'
where id = 'a85c8878-909b-46fc-9043-2ee9d48c9ff5' and estado = 'pendiente';

update public.mensajes_pendientes set
  mensaje_texto = 'Hola JOSE NASSIM PINELO, ¿cómo ha funcionado Chevrolet S10 max después del servicio en FASTCAR?

Su opinión nos ayuda a mejorar. ¿Nos regalas una reseña en Google?',
  wa_link       = 'https://wa.me/529992163138?text=Hola%20JOSE%20NASSIM%20PINELO%2C%20%C2%BFc%C3%B3mo%20ha%20funcionado%20Chevrolet%20S10%20max%20despu%C3%A9s%20del%20servicio%20en%20FASTCAR%3F%0A%0ASu%20opini%C3%B3n%20nos%20ayuda%20a%20mejorar.%20%C2%BFNos%20regalas%20una%20rese%C3%B1a%20en%20Google%3F'
where id = 'a8e90f5c-de14-4eaf-950e-8f9bbc23b56d' and estado = 'pendiente';

update public.mensajes_pendientes set
  mensaje_texto = 'Hola William vargas, ¿cómo ha funcionado Lexus Is350 después del servicio en Saucinc Autoservicio?

Su opinión nos ayuda a mejorar. ¿Nos regalas una reseña en Google?',
  wa_link       = 'https://wa.me/593991521772?text=Hola%20William%20vargas%2C%20%C2%BFc%C3%B3mo%20ha%20funcionado%20Lexus%20Is350%20despu%C3%A9s%20del%20servicio%20en%20Saucinc%20Autoservicio%3F%0A%0ASu%20opini%C3%B3n%20nos%20ayuda%20a%20mejorar.%20%C2%BFNos%20regalas%20una%20rese%C3%B1a%20en%20Google%3F'
where id = 'c66df9b3-afef-459f-8ee3-fbae5620d867' and estado = 'pendiente';

update public.mensajes_pendientes set
  mensaje_texto = 'Hola William vargas, ¿cómo ha funcionado FAW R7 después del servicio en Saucinc Autoservicio?

Su opinión nos ayuda a mejorar. ¿Nos regalas una reseña en Google?',
  wa_link       = 'https://wa.me/593991521772?text=Hola%20William%20vargas%2C%20%C2%BFc%C3%B3mo%20ha%20funcionado%20FAW%20R7%20despu%C3%A9s%20del%20servicio%20en%20Saucinc%20Autoservicio%3F%0A%0ASu%20opini%C3%B3n%20nos%20ayuda%20a%20mejorar.%20%C2%BFNos%20regalas%20una%20rese%C3%B1a%20en%20Google%3F'
where id = '9a06bd7b-6698-45b0-8356-86366df37f79' and estado = 'pendiente';
