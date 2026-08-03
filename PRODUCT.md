# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Talleres mecánicos independientes de Latinoamérica, sobre todo de una a cinco personas. Los países con landing propia son México, Colombia y Perú; la cobertura declarada es toda LATAM excepto Brasil.

**No hay un único usuario primario: el producto sirve a los tres papeles del taller y muchas veces los tres son la misma persona en distintos momentos del día.**

- **El dueño que también repara.** Cotiza, atiende y mete las manos. Es quien paga y quien más usa el sistema. Necesita capturar rápido y entenderlo sin capacitación.
- **Quien recibe en mostrador.** Da de alta órdenes todo el día y responde "¿cómo va mi carro?". Necesita velocidad y no perder pasos.
- **El dueño que administra.** Supervisa sin reparar. Necesita ver ingresos, rendimiento por mecánico y qué se entregó.

El cliente final del taller (el dueño del vehículo) no es usuario del sistema: recibe un enlace y consulta el avance sin instalar nada ni crear cuenta.

Contexto físico: se usa de pie, con el teléfono en la mano, entre reparaciones y con interrupciones constantes.

## Product Purpose

Dejar registrado lo que el taller ya hace bien pero pierde: qué se aprobó, qué se cobró, qué falta entregar y quién no ha vuelto.

El taller no falla reparando. Falla en que la información vive repartida entre una libreta, mensajes sueltos y la memoria del dueño. TallerOS la concentra sin cambiar la forma de trabajar.

Éxito, hoy: que un taller registrado llegue a crear su primera orden y siga usándolo la segunda semana. El embudo actual pierde a casi todos entre el registro y la primera orden, así que **la activación importa más que captar más registros**.

## Positioning

El cliente ve el avance de su vehículo y aprueba la cotización **por WhatsApp**, sin instalar nada. La aprobación queda registrada con fecha y hora.

La diferencia no es tener WhatsApp, que cualquiera puede añadir. Es que el flujo completo (recibir el vehículo, documentar con fotos, cotizar, aprobar, entregar, pedir la reseña) ocurre en el canal que el taller y su cliente ya usan, y cada paso queda con evidencia.

**Contra lo que se compite de verdad: la libreta y el WhatsApp suelto.** El rival no es otro software: es "así lo hemos hecho siempre". Por eso el argumento no puede ser una lista de funciones contra un competidor, sino demostrar que vale la pena cambiar una costumbre que funciona a medias.

De ahí se deriva algo que la comunicación debe respetar: **no se ataca al WhatsApp ni a la forma de trabajar del taller**, porque WhatsApp es parte de la solución que se ofrece.

## Operating Context

- El vehículo entra, se documenta con fotos, se diagnostica, se cotiza, el cliente aprueba, se repara, se entrega con garantía digital y se pide reseña.
- Los mensajes a clientes se **encolan** y el taller los envía desde su propio WhatsApp con un toque (`wa.me`). El sistema no manda mensajes por su cuenta al cliente final.
- Roles en la aplicación: `propietario`, `admin`, `tecnico`, `recepcion`.
- Cobro en dólares vía Stripe; los precios se muestran convertidos a moneda local como referencia.
- Tareas automáticas diarias: recordatorios de mantenimiento, seguimiento posventa, reseñas, citas del día siguiente y contenido del blog.

## Capabilities and Constraints

Funciones confirmadas: órdenes de trabajo, clientes y vehículos con historial, cotizaciones con aprobación por WhatsApp, portal del cliente en tiempo real, fotos de diagnóstico, garantía digital firmada, citas, inventario, recordatorios de mantenimiento, reseñas automáticas en Google, promociones masivas y reportes por mecánico.

Planes vigentes: **Gratuito** (10 órdenes al mes, 20 clientes, 1 usuario), **Esencial** (24 USD/mes, sin topes, hasta 5 usuarios, recordatorios, reseñas e inventario) y **Pro** (49 USD/mes, usuarios ilimitados, reportes, promociones). Los primeros 14 días la cuenta corre con acceso completo y después pasa al plan gratuito **sin bloquear nada**.

`lib/plan-limits.ts` es la autoridad de qué incluye cada plan. Lo que diga la web tiene que corresponder con ese archivo.

Restricciones técnicas: Next.js en Vercel con plan Hobby (dos tareas programadas como máximo, 60 segundos por ejecución), Supabase con aislamiento por taller vía RLS. Las lecturas de Supabase necesitan `cache: 'no-store'`, o el Data Cache de Next devuelve datos congelados que sobreviven a los despliegues.

Sin decidir: si Pro incorporará gestión real de varias sucursales, que hoy se anuncia como su razón de ser pero no existe como función.

## Brand Commitments

Nombre: **TallerOS**. Dominio `tallerosapp.com`. Soporte y ventas por WhatsApp, más `hola@tallerosapp.com`.

Voz: español latino, directo, en el idioma del taller. Frases confirmadas en producción: *"¿Cómo va mi carro?"*, *"ya ahorita te confirmo"*. Nada de tono de España ni jerga corporativa.

Innegociables confirmados:

1. **WhatsApp es el canal con el cliente final.** Nunca se le pedirá al dueño del vehículo instalar una aplicación ni crear una cuenta.
2. **Todo tiene que funcionar desde el celular.** El taller trabaja con el teléfono en la mano; ninguna función puede depender de una computadora.

## Evidence on Hand

- **Un cliente de pago real: FASTCAR**, plan Esencial, 3 usuarios, 20 clientes y 30 órdenes. Es la única evidencia de uso sostenido que existe.
- Base con unas 73 cuentas registradas, de las cuales alrededor de 15 tienen algún cliente cargado y solo una llegó a las 8.
- Blog propio con artículos generados y publicados en `/blog`.
- Demostración pública del portal del cliente en `/demo`.

**Lo que no existe y no debe fabricarse:** casos de éxito documentados, métricas de resultados de clientes, y cualquier cifra de talleres activos que no salga de la base de datos. Los tres testimonios que hoy aparecen en la landing (Roberto Garza, Camila Restrepo, Miguel Quispe) **no corresponden a clientes reales**; se mantienen por decisión explícita del dueño del producto, pero no deben citarse como evidencia ni ampliarse con datos inventados.

## Product Principles

1. **La activación vale más que el registro.** Mientras el embudo pierda a casi todos antes de la primera orden, cualquier mejora se juzga por si acerca a un taller a usar el sistema de verdad, no por si trae más altas.
2. **Nada se bloquea, nada se borra.** Al terminar la prueba se pierden funciones, nunca el acceso ni la información ya cargada. Lo que el taller capturó es suyo.
3. **No cambiar cómo trabaja el taller.** El sistema se adapta al WhatsApp, al teléfono y a la libreta mental del mecánico, y no al revés.
4. **Lo que se promete es lo que hace.** La web, los correos y la aplicación tienen que decir lo mismo que aplica el código. Prometer un bloqueo que no ocurre, o vender en Pro algo que Esencial ya incluye, cuesta más que la venta que gana.
5. **Cada función que se cierra tiene que cerrarse de verdad.** Un candado en la interfaz sin el filtro correspondiente en el servidor o en la tarea automática no es un límite de plan, es una promesa rota esperando a que alguien la descubra.

## Accessibility & Inclusion

Se usa en pantalla de teléfono, a menudo bajo luz de taller y con una sola mano. Contraste real de texto sobre fondo y áreas táctiles suficientes son requisito, no adorno. La aplicación se puede instalar como PWA y funciona sin pasar por ninguna tienda.
