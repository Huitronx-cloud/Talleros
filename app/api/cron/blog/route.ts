import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { createClient } from '@supabase/supabase-js'

const TEMAS = [
  // Negocio y administración del taller
  { titulo: 'Por qué los talleres mecánicos pierden clientes sin saberlo', slug: 'talleres-mecanicos-pierden-clientes', pais: null },
  { titulo: 'El error más caro que cometen los talleres mecánicos', slug: 'error-mas-caro-talleres-mecanicos', pais: null },
  { titulo: 'Cómo administrar un taller mecánico sin perder el control', slug: 'administrar-taller-mecanico-sin-perder-control', pais: null },
  { titulo: 'Los errores de administración que más le cuestan a un taller mecánico', slug: 'errores-administracion-taller-mecanico', pais: null },
  { titulo: 'Cómo organizar el día a día de un taller con varios mecánicos', slug: 'organizar-dia-taller-varios-mecanicos', pais: null },
  { titulo: 'Cómo organizar las órdenes de trabajo en tu taller mecánico', slug: 'organizar-ordenes-trabajo-taller-mecanico', pais: null },
  { titulo: 'Tablero Kanban para talleres mecánicos: qué es y cómo usarlo', slug: 'kanban-taller-mecanico', pais: null },
  { titulo: 'Cómo llevar el inventario de un taller mecánico sin perder dinero', slug: 'inventario-taller-mecanico', pais: null },
  { titulo: 'Cotizaciones profesionales en tu taller: cómo hacerlas bien', slug: 'cotizaciones-profesionales-taller-mecanico', pais: null },
  { titulo: 'Cómo calcular el precio de tus servicios en un taller mecánico', slug: 'calcular-precios-servicios-taller-mecanico', pais: null },
  { titulo: 'Garantía digital en talleres mecánicos: cómo proteger tu negocio', slug: 'garantia-digital-taller-mecanico', pais: null },
  { titulo: 'Digitalizar tu taller mecánico: por dónde empezar', slug: 'digitalizar-taller-mecanico-por-donde-empezar', pais: null },
  { titulo: 'Taller mecánico sin papel: cómo hacer la transición', slug: 'taller-mecanico-sin-papel', pais: null },
  { titulo: 'Cómo llevar el control de horas trabajadas por mecánico', slug: 'control-horas-trabajadas-taller', pais: null },
  { titulo: 'Sistemas POS para talleres mecánicos: cómo elegir el correcto', slug: 'pos-talleres-mecanicos-elegir', pais: null },
  { titulo: 'Cómo medir la productividad real de un taller mecánico', slug: 'medir-productividad-taller-mecanico', pais: null },
  { titulo: 'KPIs que todo dueño de taller mecánico debe seguir cada semana', slug: 'kpi-taller-mecanico', pais: null },
  { titulo: 'Cómo hacer una bitácora de servicios efectiva en tu taller', slug: 'bitacora-servicios-taller-mecanico', pais: null },
  { titulo: 'Manejo de garantías en un taller mecánico paso a paso', slug: 'manejo-garantias-taller-mecanico', pais: null },
  { titulo: 'Cómo organizar las citas de tu taller sin chocar agendas', slug: 'organizar-citas-taller-sin-chocar', pais: null },
  { titulo: 'Plantillas de órdenes de trabajo que ahorran tiempo en tu taller', slug: 'plantillas-ordenes-trabajo-taller', pais: null },
  { titulo: 'Cómo manejar el flujo de vehículos en un taller mecánico pequeño', slug: 'flujo-vehiculos-taller-pequeno', pais: null },
  { titulo: 'Cómo reducir el tiempo de entrega de un vehículo sin sacrificar calidad', slug: 'reducir-tiempo-entrega-vehiculo-taller', pais: null },
  { titulo: 'Procesos estándar (SOP) en un taller mecánico: por qué importan', slug: 'sop-taller-mecanico', pais: null },
  { titulo: 'Cómo manejar varios vehículos en simultáneo sin perder el control', slug: 'manejar-varios-vehiculos-taller', pais: null },
  { titulo: 'Cómo organizar las herramientas de tu taller para no perder tiempo', slug: 'organizar-herramientas-taller-mecanico', pais: null },
  { titulo: 'Cómo aprovechar mejor el espacio físico de tu taller mecánico', slug: 'aprovechar-espacio-taller-mecanico', pais: null },
  { titulo: 'Cómo manejar urgencias y servicios express en tu taller mecánico', slug: 'urgencias-express-taller-mecanico', pais: null },
  { titulo: 'Cómo digitalizar las firmas de aceptación en tu taller mecánico', slug: 'digitalizar-firmas-aceptacion-taller', pais: null },
  { titulo: 'Cómo manejar el inventario de refacciones críticas en tu taller', slug: 'inventario-refacciones-criticas-taller', pais: null },
  { titulo: 'Sistema de tickets de servicio: cómo implementarlo en tu taller', slug: 'sistema-tickets-servicio-taller', pais: null },
  { titulo: 'Cómo controlar la entrada y salida de vehículos en tu taller', slug: 'entrada-salida-vehiculos-taller', pais: null },
  { titulo: 'Protocolo de recepción de vehículos: lo que separa talleres buenos de mediocres', slug: 'protocolo-recepcion-vehiculos-taller', pais: null },
  { titulo: 'Cómo manejar las llaves de los vehículos en tu taller sin perder ninguna', slug: 'manejo-llaves-vehiculos-taller', pais: null },
  { titulo: 'Check-list de revisión de 25 puntos para clientes nuevos', slug: 'check-list-revision-25-puntos', pais: null },
  { titulo: 'Cómo coordinar varios mecánicos trabajando en una misma orden', slug: 'multiples-mecanicos-misma-orden', pais: null },
  { titulo: 'Cómo evitar la doble venta de la misma refacción en tu taller', slug: 'evitar-doble-venta-refaccion-taller', pais: null },
  { titulo: 'Cómo manejar el papeleo de un taller mecánico sin colapsar', slug: 'manejar-papeleo-taller-mecanico', pais: null },
  { titulo: 'Diagrama de flujo de un servicio de mantenimiento típico', slug: 'diagrama-flujo-servicio-mantenimiento', pais: null },
  { titulo: 'Cómo programar mantenimientos preventivos por modelo de vehículo', slug: 'programar-mantenimientos-preventivos-modelo', pais: null },
  { titulo: 'Cómo armar la lista de servicios que ofrece tu taller mecánico', slug: 'lista-servicios-taller-mecanico', pais: null },
  { titulo: 'Catálogo de servicios en línea para tu taller mecánico', slug: 'catalogo-servicios-en-linea-taller', pais: null },
  { titulo: 'Cómo manejar las solicitudes urgentes de clientes en tu taller', slug: 'solicitudes-urgentes-clientes-taller', pais: null },
  { titulo: 'Cómo decidir qué servicios subcontratar y cuáles no en tu taller', slug: 'subcontratar-servicios-taller-mecanico', pais: null },
  { titulo: 'Cómo manejar los reclamos por servicio mal hecho en tu taller', slug: 'reclamos-servicio-mal-hecho-taller', pais: null },
  { titulo: 'Cómo crear una bitácora digital de los vehículos que pasan por tu taller', slug: 'bitacora-digital-vehiculos-taller', pais: null },
  { titulo: 'Sistema de cola para clientes que esperan en tu taller mecánico', slug: 'sistema-cola-clientes-taller', pais: null },
  { titulo: 'Cómo manejar talleres mecánicos con turnos rotativos', slug: 'talleres-turnos-rotativos', pais: null },

  // El negocio: rentabilidad y finanzas del taller
  { titulo: 'Cuánto debería ganar realmente un taller mecánico al mes', slug: 'cuanto-debe-ganar-taller-mecanico', pais: null },
  { titulo: 'Por qué tu taller trabaja mucho y gana poco', slug: 'taller-trabaja-mucho-gana-poco', pais: null },
  { titulo: 'Cómo saber si tu taller mecánico es rentable de verdad', slug: 'taller-mecanico-rentable-de-verdad', pais: null },
  { titulo: 'Costos fijos vs variables en un taller mecánico: cómo separarlos', slug: 'costos-fijos-variables-taller-mecanico', pais: null },
  { titulo: 'Cómo calcular el punto de equilibrio de tu taller mecánico', slug: 'punto-equilibrio-taller-mecanico', pais: null },
  { titulo: 'Margen de utilidad por servicio: cómo medirlo en tu taller', slug: 'margen-utilidad-servicio-taller', pais: null },
  { titulo: 'Cómo manejar el flujo de caja en tu taller mecánico', slug: 'flujo-caja-taller-mecanico', pais: null },
  { titulo: 'Cuentas por cobrar: cómo evitar que tus clientes te queden a deber', slug: 'cuentas-por-cobrar-taller-mecanico', pais: null },
  { titulo: 'Cómo hacer un presupuesto anual para tu taller mecánico', slug: 'presupuesto-anual-taller-mecanico', pais: null },
  { titulo: 'Cómo financiar la compra de equipo nuevo para tu taller', slug: 'financiar-equipo-taller-mecanico', pais: null },
  { titulo: 'Comprar o rentar el local de tu taller: cómo decidir', slug: 'comprar-rentar-local-taller', pais: null },
  { titulo: 'Cómo ahorrar en gastos operativos sin sacrificar calidad', slug: 'ahorrar-gastos-operativos-taller', pais: null },
  { titulo: 'Cómo cobrar el diagnóstico en tu taller mecánico sin perder clientes', slug: 'cobrar-diagnostico-taller-mecanico', pais: null },
  { titulo: 'Por qué cobrar barato te está quebrando el taller', slug: 'cobrar-barato-quiebra-taller', pais: null },
  { titulo: 'Cómo subir precios en tu taller sin perder clientes', slug: 'subir-precios-taller-sin-perder-clientes', pais: null },
  { titulo: 'Factura electrónica para talleres mecánicos en México', slug: 'factura-electronica-talleres-mexico', pais: 'MX' },
  { titulo: 'Facturación electrónica en Colombia para talleres mecánicos', slug: 'facturacion-electronica-talleres-colombia', pais: 'CO' },
  { titulo: 'SUNAT y facturación electrónica para talleres mecánicos en Perú', slug: 'sunat-facturacion-talleres-peru', pais: 'PE' },
  { titulo: 'Cómo declarar impuestos siendo dueño de un taller mecánico', slug: 'declarar-impuestos-taller-mecanico', pais: null },
  { titulo: 'Régimen fiscal para talleres mecánicos en México: cuál te conviene', slug: 'regimen-fiscal-talleres-mexico', pais: 'MX' },
  { titulo: 'Cómo manejar el IVA en un taller mecánico sin tropezarte', slug: 'manejar-iva-taller-mecanico', pais: null },
  { titulo: 'Cuánto cuesta abrir un taller mecánico en México hoy', slug: 'cuanto-cuesta-abrir-taller-mexico', pais: 'MX' },
  { titulo: 'Cuánto cuesta abrir un taller mecánico en Colombia hoy', slug: 'cuanto-cuesta-abrir-taller-colombia', pais: 'CO' },
  { titulo: 'Cuánto cuesta abrir un taller mecánico en Perú hoy', slug: 'cuanto-cuesta-abrir-taller-peru', pais: 'PE' },
  { titulo: 'Cómo separar las finanzas del taller de las personales', slug: 'separar-finanzas-taller-personales', pais: null },
  { titulo: 'Cómo saber si te estás pagando bien como dueño de taller', slug: 'pagarse-bien-dueno-taller', pais: null },
  { titulo: 'Cómo manejar pagos en efectivo, transferencia y tarjeta en tu taller', slug: 'manejar-pagos-multiples-taller', pais: null },
  { titulo: 'Cómo aceptar pagos con tarjeta sin que te coman las comisiones', slug: 'aceptar-tarjeta-sin-comisiones-taller', pais: null },
  { titulo: 'Cómo hacer cotizaciones que conviertan más en tu taller mecánico', slug: 'cotizaciones-que-convierten-taller', pais: null },
  { titulo: 'Por qué tu taller pierde dinero en cada orden y no te das cuenta', slug: 'taller-pierde-dinero-cada-orden', pais: null },
  { titulo: 'Cómo establecer la tarifa por hora de mano de obra en tu taller', slug: 'tarifa-hora-mano-obra-taller', pais: null },
  { titulo: 'Cómo ahorrar en compra de refacciones sin perder calidad', slug: 'ahorrar-compra-refacciones-taller', pais: null },
  { titulo: 'Crédito para dueños de talleres mecánicos: opciones reales', slug: 'credito-duenos-talleres-mecanicos', pais: null },

  // Consejos para dueños de taller
  { titulo: 'Cómo delegar tareas en tu taller mecánico y dejar de hacerlo todo tú', slug: 'delegar-tareas-taller-mecanico', pais: null },
  { titulo: 'Cómo contratar al mecánico correcto para tu taller', slug: 'contratar-mecanico-correcto-taller', pais: null },
  { titulo: 'Consejos para dueños de taller que están empezando', slug: 'consejos-duenos-taller-que-empiezan', pais: null },
  { titulo: 'Cómo un dueño de taller puede dejar de trabajar 12 horas al día', slug: 'dueno-taller-dejar-trabajar-12-horas', pais: null },

  // Equipo humano y mecánicos
  { titulo: 'Cómo contratar a un mecánico junior y formarlo desde cero', slug: 'contratar-mecanico-junior-formar', pais: null },
  { titulo: 'Cómo evaluar el desempeño de un mecánico en tu taller', slug: 'evaluar-desempeno-mecanico-taller', pais: null },
  { titulo: 'Plan de carrera para mecánicos: cómo armar el tuyo', slug: 'plan-carrera-mecanicos-taller', pais: null },
  { titulo: 'Cuánto pagarle a un mecánico para retenerlo en tu taller', slug: 'cuanto-pagar-mecanico-retener', pais: null },
  { titulo: 'Bonos por desempeño en un taller mecánico: cómo estructurarlos', slug: 'bonos-desempeno-taller-mecanico', pais: null },
  { titulo: 'Cómo motivar a tu equipo de mecánicos sin gastar más', slug: 'motivar-equipo-mecanicos-sin-gastar', pais: null },
  { titulo: 'Cómo lidiar con un mecánico estrella que se quiere ir', slug: 'mecanico-estrella-se-quiere-ir', pais: null },
  { titulo: 'Cómo despedir a un mecánico sin que la cague tu taller', slug: 'despedir-mecanico-sin-afectar-taller', pais: null },
  { titulo: 'Capacitación técnica para mecánicos: cómo y dónde', slug: 'capacitacion-tecnica-mecanicos', pais: null },
  { titulo: 'Cómo armar un equipo de mecánicos desde cero', slug: 'armar-equipo-mecanicos-desde-cero', pais: null },
  { titulo: 'Roles esenciales en un taller mecánico: quién hace qué', slug: 'roles-esenciales-taller-mecanico', pais: null },
  { titulo: 'Cómo contratar al recepcionista correcto para tu taller mecánico', slug: 'contratar-recepcionista-taller', pais: null },
  { titulo: 'Por qué el ayudante de tu taller es más importante de lo que crees', slug: 'importancia-ayudante-taller', pais: null },
  { titulo: 'Cómo manejar conflictos entre mecánicos en tu taller', slug: 'conflictos-entre-mecanicos-taller', pais: null },
  { titulo: 'Cómo lidiar con mecánicos que llegan tarde a tu taller', slug: 'mecanicos-llegan-tarde', pais: null },
  { titulo: 'Manual del empleado para tu taller mecánico: qué incluir', slug: 'manual-empleado-taller-mecanico', pais: null },
  { titulo: 'Cómo prevenir que tus mecánicos te roben refacciones', slug: 'prevenir-robo-refacciones-mecanicos', pais: null },
  { titulo: 'Contratos de trabajo para mecánicos: qué cláusulas no olvidar', slug: 'contratos-trabajo-mecanicos', pais: null },
  { titulo: 'Cómo crear cultura de trabajo en tu taller mecánico', slug: 'cultura-trabajo-taller-mecanico', pais: null },
  { titulo: 'Cómo evitar la rotación constante de mecánicos en tu taller', slug: 'evitar-rotacion-mecanicos-taller', pais: null },
  { titulo: 'Uniformes en tu taller mecánico: por qué importan más de lo que crees', slug: 'uniformes-taller-mecanico-importan', pais: null },
  { titulo: 'Cómo entrenar a un mecánico para que use tu software de gestión', slug: 'entrenar-mecanico-software-gestion', pais: null },
  { titulo: 'Cómo manejar el horario y los turnos de tu taller mecánico', slug: 'manejar-horario-taller-mecanico', pais: null },
  { titulo: 'Cómo evaluar candidatos a mecánico en una entrevista', slug: 'evaluar-candidatos-mecanico-entrevista', pais: null },
  { titulo: 'Mecánico polivalente vs especialista: cuál te conviene contratar', slug: 'mecanico-polivalente-vs-especialista', pais: null },
  { titulo: 'Cómo lidiar con un mecánico que no quiere usar tecnología', slug: 'mecanico-no-quiere-tecnologia', pais: null },
  { titulo: 'Cómo formar a un jefe de taller que te quite peso de encima', slug: 'formar-jefe-taller-quitar-peso', pais: null },
  { titulo: 'Trabajo en equipo en un taller mecánico: cómo lograrlo de verdad', slug: 'trabajo-equipo-taller-mecanico', pais: null },
  { titulo: 'Cómo manejar las vacaciones de tu equipo sin parar el taller', slug: 'vacaciones-equipo-sin-parar-taller', pais: null },
  { titulo: 'Subir el sueldo o repartir propinas: qué le conviene a tu taller', slug: 'subir-sueldo-vs-propinas-taller', pais: null },

  // Marketing para talleres mecánicos
  { titulo: 'Por qué el 63% de los clientes desconfía de los talleres mecánicos', slug: 'clientes-desconfian-talleres-mecanicos', pais: null },
  { titulo: 'Cómo evitar conflictos con clientes en tu taller mecánico', slug: 'evitar-conflictos-clientes-taller-mecanico', pais: null },
  { titulo: 'Por qué los talleres que no piden reseñas pierden frente a la competencia', slug: 'talleres-sin-resenas-pierden-competencia', pais: null },
  { titulo: 'Cómo usar WhatsApp para aumentar las ventas de tu taller mecánico', slug: 'whatsapp-ventas-taller-mecanico', pais: null },
  { titulo: 'Cómo aprobar reparaciones por WhatsApp y eliminar malentendidos', slug: 'aprobar-reparaciones-whatsapp-taller', pais: null },
  { titulo: 'Mensajes de WhatsApp que convierten clientes en tu taller mecánico', slug: 'mensajes-whatsapp-clientes-taller', pais: null },
  { titulo: 'Cómo conseguir más reseñas en Google para tu taller mecánico', slug: 'conseguir-resenas-google-taller-mecanico', pais: null },
  { titulo: 'Guía completa de reseñas en Google para talleres mecánicos en LATAM', slug: 'resenas-google-talleres-mecanicos-latam', pais: null },
  { titulo: 'Cuántas reseñas de Google necesita tu taller para conseguir más clientes', slug: 'cuantas-resenas-google-taller-mecanico', pais: null },
  { titulo: 'Marketing de boca en boca: cómo activarlo en tu taller mecánico', slug: 'marketing-boca-en-boca-taller-mecanico', pais: null },
  { titulo: 'Redes sociales para talleres mecánicos: qué publicar para generar confianza', slug: 'redes-sociales-taller-mecanico-confianza', pais: null },
  { titulo: 'Marketing para talleres mecánicos: por dónde empezar sin gastar en publicidad', slug: 'marketing-taller-mecanico-sin-publicidad', pais: null },
  { titulo: 'Cómo posicionar tu taller en Google con SEO local', slug: 'seo-local-taller-mecanico', pais: null },
  { titulo: 'Google My Business para talleres mecánicos: la guía completa', slug: 'google-my-business-taller-mecanico', pais: null },
  { titulo: 'Cómo lograr que tu taller aparezca en el mapa de Google', slug: 'taller-aparece-mapa-google', pais: null },
  { titulo: 'Anuncios en Google Ads para talleres mecánicos: ¿vale la pena?', slug: 'google-ads-taller-mecanico', pais: null },
  { titulo: 'Facebook Ads para talleres mecánicos: cómo arrancar con $500 al mes', slug: 'facebook-ads-taller-mecanico', pais: null },
  { titulo: 'Instagram para talleres mecánicos: qué publicar para crecer', slug: 'instagram-taller-mecanico', pais: null },
  { titulo: 'TikTok para talleres mecánicos: oportunidad o pérdida de tiempo', slug: 'tiktok-taller-mecanico', pais: null },
  { titulo: 'YouTube para talleres mecánicos: ¿realmente vale la pena?', slug: 'youtube-taller-mecanico-vale-pena', pais: null },
  { titulo: 'WhatsApp Business para talleres mecánicos: configuración paso a paso', slug: 'whatsapp-business-taller-mecanico', pais: null },
  { titulo: 'Cómo usar las historias de Instagram para tu taller mecánico', slug: 'historias-instagram-taller-mecanico', pais: null },
  { titulo: 'Cómo grabar videos de antes y después en tu taller mecánico', slug: 'videos-antes-despues-taller', pais: null },
  { titulo: 'Reels para talleres mecánicos: ideas que sí funcionan', slug: 'reels-talleres-mecanicos', pais: null },
  { titulo: 'Cómo crear contenido educativo para tu taller mecánico', slug: 'contenido-educativo-taller-mecanico', pais: null },
  { titulo: 'Estrategia de contenido para un taller mecánico en 90 días', slug: 'estrategia-contenido-90-dias-taller', pais: null },
  { titulo: 'Cómo conseguir tus primeros 1000 seguidores como taller mecánico', slug: 'primeros-1000-seguidores-taller', pais: null },
  { titulo: 'Cómo manejar comentarios negativos en redes sin perder clientes', slug: 'comentarios-negativos-redes-taller', pais: null },
  { titulo: 'Cómo responder reseñas negativas en Google sin enojarte', slug: 'responder-resenas-negativas-google', pais: null },
  { titulo: 'Email marketing para talleres mecánicos: cómo arrancar', slug: 'email-marketing-taller-mecanico', pais: null },
  { titulo: 'Cómo armar una base de datos de clientes en tu taller mecánico', slug: 'base-datos-clientes-taller-mecanico', pais: null },
  { titulo: 'Cómo medir cuánto te cuesta conseguir un cliente nuevo', slug: 'costo-conseguir-cliente-nuevo-taller', pais: null },
  { titulo: 'Programa de referidos para talleres mecánicos: cómo armarlo', slug: 'programa-referidos-taller-mecanico', pais: null },
  { titulo: 'Volantes para talleres mecánicos: ¿siguen funcionando hoy?', slug: 'volantes-talleres-mecanicos-funcionan', pais: null },
  { titulo: 'Cómo lograr alianzas con concesionarios de autos para tu taller', slug: 'alianzas-concesionarios-taller', pais: null },
  { titulo: 'Alianzas con aseguradoras: cómo entrarle siendo taller chico', slug: 'alianzas-aseguradoras-taller-chico', pais: null },
  { titulo: 'Cómo conseguir clientes corporativos para tu taller mecánico', slug: 'clientes-corporativos-taller-mecanico', pais: null },
  { titulo: 'Lonas para talleres mecánicos: qué decir y dónde ponerlas', slug: 'lonas-talleres-mecanicos', pais: null },
  { titulo: 'Cómo crear una marca fuerte para tu taller mecánico', slug: 'crear-marca-fuerte-taller', pais: null },
  { titulo: 'Por qué el logo de tu taller importa más de lo que crees', slug: 'logo-taller-importa', pais: null },
  { titulo: 'Cómo armar un perfil ganador en TikTok desde tu taller mecánico', slug: 'perfil-ganador-tiktok-taller', pais: null },
  { titulo: 'Anuncios en YouTube para talleres mecánicos locales', slug: 'anuncios-youtube-talleres-locales', pais: null },
  { titulo: 'Marketing por temporada para talleres mecánicos en LATAM', slug: 'marketing-temporada-taller-mecanico', pais: null },
  { titulo: 'Cómo crear ofertas que sí atraen clientes a tu taller', slug: 'ofertas-que-atraen-clientes-taller', pais: null },
  { titulo: 'Cómo usar códigos QR para conectar a tus clientes con tu taller', slug: 'codigo-qr-clientes-taller', pais: null },
  { titulo: 'Cómo armar tu primera campaña publicitaria sin contratar agencia', slug: 'primera-campana-publicitaria-sin-agencia', pais: null },
  { titulo: 'Branding para talleres mecánicos: por qué dejar atrás el "Taller Pepe"', slug: 'branding-talleres-mecanicos', pais: null },

  // Cómo conseguir y retener más clientes
  { titulo: '5 señales de que tu taller mecánico está perdiendo clientes sin darte cuenta', slug: 'senales-taller-mecanico-pierde-clientes', pais: null },
  { titulo: 'Cómo conseguir más clientes para tu taller mecánico sin bajar precios', slug: 'conseguir-clientes-taller-mecanico-sin-bajar-precios', pais: null },
  { titulo: 'Cómo un taller mecánico puede conseguir más clientes con tecnología', slug: 'taller-mecanico-conseguir-clientes-tecnologia', pais: null },
  { titulo: 'Cómo fidelizar clientes en un taller mecánico', slug: 'fidelizar-clientes-taller-mecanico', pais: null },
  { titulo: 'Recordatorios de mantenimiento: la estrategia que recupera clientes', slug: 'recordatorios-mantenimiento-clientes-taller', pais: null },
  { titulo: 'Cómo hacer que tus clientes regresen a tu taller mecánico', slug: 'clientes-regresen-taller-mecanico', pais: null },
  { titulo: 'Portal del cliente para talleres mecánicos: qué es y por qué importa', slug: 'portal-cliente-taller-mecanico', pais: null },
  { titulo: 'Cómo conseguir más clientes para tu taller con WhatsApp en una semana', slug: 'mas-clientes-whatsapp-taller', pais: null },
  { titulo: 'Cómo convertir cotizaciones en órdenes reales en tu taller', slug: 'convertir-cotizaciones-en-ordenes', pais: null },
  { titulo: 'Embudo de ventas para un taller mecánico: cómo armarlo', slug: 'embudo-ventas-taller-mecanico', pais: null },
  { titulo: 'Cómo recuperar clientes que dejaron de venir a tu taller', slug: 'recuperar-clientes-dejaron-venir', pais: null },
  { titulo: 'Cómo armar un programa de lealtad para los clientes de tu taller', slug: 'programa-lealtad-taller-mecanico', pais: null },
  { titulo: 'Tarjeta de lealtad digital para clientes de talleres mecánicos', slug: 'tarjeta-lealtad-digital-taller', pais: null },
  { titulo: 'Cómo conseguir el segundo servicio del mismo cliente', slug: 'segundo-servicio-mismo-cliente', pais: null },
  { titulo: 'Cómo lograr que tus clientes traigan a toda su familia al taller', slug: 'clientes-traigan-su-familia', pais: null },
  { titulo: 'Cómo medir el NPS (satisfacción) en tu taller mecánico', slug: 'medir-nps-taller-mecanico', pais: null },
  { titulo: 'Encuestas de satisfacción para talleres mecánicos: cómo aplicarlas', slug: 'encuestas-satisfaccion-taller-mecanico', pais: null },
  { titulo: 'Cómo manejar al cliente que dice "está más barato en otro lado"', slug: 'cliente-mas-barato-otro-lado', pais: null },
  { titulo: 'Cómo manejar al cliente que regatea siempre el precio', slug: 'cliente-regatea-precio-taller', pais: null },
  { titulo: 'Cómo lidiar con clientes difíciles en tu taller mecánico', slug: 'clientes-dificiles-taller-mecanico', pais: null },
  { titulo: 'Cómo evitar los no-shows en tu taller mecánico', slug: 'evitar-no-shows-taller-mecanico', pais: null },
  { titulo: 'Política de cancelación para tu taller mecánico: cómo armarla', slug: 'politica-cancelacion-taller-mecanico', pais: null },
  { titulo: 'Cómo solicitar anticipo a tus clientes sin perderlos', slug: 'solicitar-anticipo-sin-perder-cliente', pais: null },
  { titulo: 'Cómo manejar al cliente que no quiere pagar al recoger su auto', slug: 'cliente-no-quiere-pagar-recoger', pais: null },
  { titulo: 'Cómo dar seguimiento post-servicio sin parecer pesado', slug: 'seguimiento-post-servicio-taller', pais: null },
  { titulo: 'Cómo conseguir clientes recurrentes para tu taller mecánico', slug: 'clientes-recurrentes-taller-mecanico', pais: null },
  { titulo: 'Por qué tu taller no consigue clientes nuevos (y cómo arreglarlo)', slug: 'taller-no-consigue-clientes-nuevos', pais: null },
  { titulo: 'Cómo manejar al cliente enojado en tu taller mecánico', slug: 'manejar-cliente-enojado-taller', pais: null },
  { titulo: 'Cómo manejar al cliente que viene con su propio mecánico de cabecera', slug: 'cliente-viene-con-mecanico', pais: null },
  { titulo: 'Cómo educar a tus clientes sobre el mantenimiento del auto', slug: 'educar-clientes-mantenimiento-auto', pais: null },
  { titulo: 'Cómo manejar a un cliente que ya pasó por dos talleres antes', slug: 'cliente-paso-dos-talleres', pais: null },
  { titulo: 'Cómo manejar a los clientes que vienen "solo a revisar"', slug: 'clientes-solo-a-revisar', pais: null },
  { titulo: 'Cómo recibir y entregar un vehículo de forma profesional', slug: 'recibir-entregar-vehiculo-profesional', pais: null },
  { titulo: 'Cómo dar un diagnóstico que el cliente entienda y crea', slug: 'diagnostico-que-cliente-entiende', pais: null },
  { titulo: 'Cómo evitar que el cliente sienta que le estás viendo la cara', slug: 'cliente-sienta-le-vemos-cara', pais: null },
  { titulo: 'Cómo armar un kit de bienvenida para clientes nuevos en tu taller', slug: 'kit-bienvenida-clientes-nuevos-taller', pais: null },
  { titulo: 'Cómo armar una estrategia de upsell ética en tu taller mecánico', slug: 'upsell-etico-taller-mecanico', pais: null },

  // Servicios específicos del taller
  { titulo: 'Cómo cobrar un servicio de afinación correctamente', slug: 'cobrar-afinacion-taller-mecanico', pais: null },
  { titulo: 'Servicio de frenos: cómo no perder dinero con cada cliente', slug: 'servicio-frenos-no-perder-dinero', pais: null },
  { titulo: 'Servicio de suspensión: cómo manejarlo en tu taller mecánico', slug: 'servicio-suspension-taller', pais: null },
  { titulo: 'Cómo manejar un servicio de motor mayor sin problemas', slug: 'servicio-motor-mayor-taller', pais: null },
  { titulo: 'Diagnóstico por escáner: cómo cobrarlo bien sin asustar al cliente', slug: 'diagnostico-escaner-cobrar-bien', pais: null },
  { titulo: 'Servicio de aire acondicionado: la mina de oro escondida de tu taller', slug: 'aire-acondicionado-mina-oro', pais: null },
  { titulo: 'Cómo manejar un servicio de transmisión automática en tu taller', slug: 'servicio-transmision-automatica-taller', pais: null },
  { titulo: 'Cómo entrar al servicio de autos híbridos y eléctricos', slug: 'servicio-autos-hibridos-electricos', pais: null },
  { titulo: 'Cómo manejar alineación y balanceo en tu taller mecánico', slug: 'alineacion-balanceo-taller', pais: null },
  { titulo: 'Hojalatería y pintura: cómo entrarle siendo taller mecánico', slug: 'hojalateria-pintura-taller-mecanico', pais: null },
  { titulo: 'Cómo manejar el servicio post-choque en tu taller mecánico', slug: 'servicio-post-choque-taller', pais: null },
  { titulo: 'Servicio de eléctrico automotriz: cómo cobrarlo sin subestimarlo', slug: 'electrico-automotriz-cobrar-bien', pais: null },
  { titulo: 'Cambio de aceite: por qué no debe ser tu servicio gancho', slug: 'cambio-aceite-no-gancho', pais: null },
  { titulo: 'Cómo armar paquetes de servicios para tu taller mecánico', slug: 'armar-paquetes-servicios-taller', pais: null },
  { titulo: 'Servicio para vehículos de Uber, Didi e InDriver', slug: 'servicio-uber-didi-indriver', pais: null },
  { titulo: 'Cómo entrar al segmento de motos en tu taller mecánico', slug: 'entrar-segmento-motos-taller', pais: null },
  { titulo: 'Cómo manejar la revisión de autos usados antes de comprar', slug: 'revision-autos-usados-pre-compra', pais: null },
  { titulo: 'Cómo armar un servicio de mantenimiento mensual para flotillas', slug: 'mantenimiento-mensual-flotillas', pais: null },
  { titulo: 'Cómo vender un servicio de pre-viaje a tus clientes', slug: 'servicio-pre-viaje-taller', pais: null },
  { titulo: 'Cómo armar un servicio express de 30 minutos en tu taller', slug: 'servicio-express-30-minutos', pais: null },
  { titulo: 'Cómo cobrar el servicio de grúa sin perder dinero', slug: 'cobrar-grua-sin-perder-dinero', pais: null },
  { titulo: 'Cómo manejar un servicio a domicilio para clientes premium', slug: 'servicio-domicilio-clientes-premium', pais: null },
  { titulo: 'Cómo armar un servicio de detallado en tu taller mecánico', slug: 'armar-servicio-detallado-taller', pais: null },
  { titulo: 'Lavado interior y exterior: cómo integrarlo sin descontrolar el taller', slug: 'lavado-integrarlo-taller-mecanico', pais: null },
  { titulo: 'Cómo manejar las refacciones especiales o importadas', slug: 'refacciones-especiales-importadas', pais: null },
  { titulo: 'Servicios para autos clásicos: cómo armarlo y cobrarlo', slug: 'servicios-autos-clasicos-taller', pais: null },
  { titulo: 'Cómo manejar autos chocados que esperan al ajustador', slug: 'autos-chocados-esperan-ajustador', pais: null },
  { titulo: 'Refacciones genéricas vs originales: cómo explicárselo al cliente', slug: 'refacciones-genericas-vs-originales', pais: null },
  { titulo: 'Cómo manejar el servicio de garantía del fabricante en tu taller', slug: 'servicio-garantia-fabricante-taller', pais: null },
  { titulo: 'Cómo armar un servicio integral de mantenimiento anual', slug: 'mantenimiento-integral-anual-taller', pais: null },

  // Tecnología y herramientas
  { titulo: 'Software de gestión para talleres mecánicos: cómo elegirlo bien', slug: 'software-gestion-talleres-elegir', pais: null },
  { titulo: 'CRM para talleres mecánicos: ¿lo necesitas de verdad?', slug: 'crm-talleres-mecanicos-necesario', pais: null },
  { titulo: 'Cómo digitalizar tu taller mecánico en 30 días', slug: 'digitalizar-taller-30-dias', pais: null },
  { titulo: 'Tablet o computadora: qué le conviene a un taller mecánico', slug: 'tablet-vs-computadora-taller', pais: null },
  { titulo: 'Cámaras de seguridad para talleres mecánicos: cómo elegir', slug: 'camaras-seguridad-talleres-mecanicos', pais: null },
  { titulo: 'Cómo armar la red de internet ideal para tu taller mecánico', slug: 'red-internet-ideal-taller', pais: null },
  { titulo: 'Cómo elegir el escáner OBD correcto para tu taller mecánico', slug: 'elegir-escaner-obd-taller', pais: null },
  { titulo: 'Elevadores hidráulicos para talleres mecánicos: cuál te conviene', slug: 'elevadores-hidraulicos-taller', pais: null },
  { titulo: 'Cómo invertir en herramienta sin descapitalizar tu taller', slug: 'invertir-herramienta-sin-descapitalizar', pais: null },
  { titulo: 'Inteligencia artificial en tu taller mecánico: qué puede hacer hoy', slug: 'inteligencia-artificial-taller-mecanico', pais: null },
  { titulo: 'ChatGPT para dueños de talleres mecánicos: 7 usos prácticos', slug: 'chatgpt-duenos-talleres-mecanicos', pais: null },
  { titulo: 'App para clientes de talleres mecánicos: ¿realmente la necesitas?', slug: 'app-clientes-talleres-necesaria', pais: null },
  { titulo: 'Cómo automatizar recordatorios para los clientes de tu taller', slug: 'automatizar-recordatorios-taller', pais: null },
  { titulo: 'Cómo crear una página web ganadora para tu taller mecánico', slug: 'pagina-web-ganadora-taller', pais: null },
  { titulo: 'Reservar citas online en tu taller mecánico: cómo arrancar', slug: 'reservar-citas-online-taller', pais: null },
  { titulo: 'Pagos en línea para talleres mecánicos: cómo activarlos', slug: 'pagos-en-linea-talleres-mecanicos', pais: null },
  { titulo: 'Facturación electrónica desde tu celular para tu taller', slug: 'facturacion-electronica-celular-taller', pais: null },
  { titulo: 'Cómo manejar la firma digital de aceptación en tu taller', slug: 'firma-digital-aceptacion-taller', pais: null },
  { titulo: 'Cómo subir fotos del diagnóstico a la nube y compartirlas con el cliente', slug: 'fotos-diagnostico-nube-taller', pais: null },
  { titulo: 'Códigos QR en tu taller mecánico: 10 usos prácticos hoy', slug: 'codigo-qr-taller-mecanico-usos', pais: null },
  { titulo: 'Cómo usar la nube para respaldar la información de tu taller', slug: 'nube-respaldar-informacion-taller', pais: null },
  { titulo: 'Cómo prevenir un ataque cibernético en tu taller mecánico', slug: 'prevenir-ataque-cibernetico-taller', pais: null },
  { titulo: 'Sistema de control de tiempos por orden: cómo implementarlo', slug: 'control-tiempos-orden-taller', pais: null },
  { titulo: 'ERP para talleres mecánicos: cuándo te conviene de verdad', slug: 'erp-talleres-cuando-conviene', pais: null },
  { titulo: 'Cómo migrar tu taller mecánico de Excel a un software profesional', slug: 'migrar-excel-software-profesional', pais: null },

  // Crecimiento, expansión y salida
  { titulo: 'Cómo abrir una segunda sucursal de tu taller mecánico', slug: 'abrir-segunda-sucursal-taller', pais: null },
  { titulo: 'Franquiciar un taller mecánico: ventajas y trampas', slug: 'franquiciar-taller-mecanico', pais: null },
  { titulo: 'Cómo vender tu taller mecánico al mejor precio', slug: 'vender-taller-mejor-precio', pais: null },
  { titulo: 'Cómo valuar un taller mecánico para venta o herencia', slug: 'valuar-taller-mecanico-venta', pais: null },
  { titulo: 'Cómo armar una sociedad para abrir un taller mecánico', slug: 'sociedad-abrir-taller-mecanico', pais: null },
  { titulo: 'Cómo planear el crecimiento de tu taller mecánico a 3 años', slug: 'crecimiento-3-anos-taller-mecanico', pais: null },
  { titulo: 'Cómo pasar de 1 a 5 mecánicos sin perder el control', slug: 'pasar-1-a-5-mecanicos', pais: null },
  { titulo: 'Cómo escalar tu taller mecánico sin quemar a tu equipo', slug: 'escalar-taller-sin-quemar-equipo', pais: null },
  { titulo: 'Crecer hacia más servicios o más sucursales: cuál te conviene', slug: 'crecer-mas-servicios-vs-sucursales', pais: null },
  { titulo: 'Sucesión familiar en un taller mecánico: cómo hacerla bien', slug: 'sucesion-familiar-taller-mecanico', pais: null },
  { titulo: 'Asociarte con un mecánico nuevo: ventajas y riesgos', slug: 'asociarte-mecanico-ventajas-riesgos', pais: null },
  { titulo: 'Cómo crear una segunda línea de ingresos para tu taller mecánico', slug: 'segunda-linea-ingresos-taller', pais: null },
  { titulo: 'Convertir tu taller en escuela de mecánica: cómo se hace', slug: 'taller-escuela-mecanica', pais: null },
  { titulo: 'Renta de espacio en tu taller mecánico a otros profesionales', slug: 'renta-espacio-taller-otros-profesionales', pais: null },
  { titulo: 'Cómo entrar al servicio de mantenimiento para flotillas grandes', slug: 'mantenimiento-flotillas-grandes-taller', pais: null },
  { titulo: 'Cómo conseguir tu primer contrato con una empresa grande', slug: 'primer-contrato-empresa-taller', pais: null },
  { titulo: 'Cómo participar en licitaciones con tu taller mecánico', slug: 'licitaciones-taller-mecanico', pais: null },
  { titulo: 'Cómo armar un plan de negocios para tu taller mecánico', slug: 'plan-negocios-taller-mecanico', pais: null },
  { titulo: 'Cómo conseguir un crédito Pyme para tu taller mecánico', slug: 'credito-pyme-taller-mecanico', pais: null },
  { titulo: 'Inversionistas para tu taller mecánico: ¿es viable?', slug: 'inversionistas-taller-mecanico', pais: null },

  // Ciudades y mercados LATAM
  { titulo: 'Cómo abrir un taller mecánico en CDMX paso a paso', slug: 'abrir-taller-cdmx-paso-paso', pais: 'MX' },
  { titulo: 'Talleres mecánicos en Guadalajara: cómo destacar entre la competencia', slug: 'talleres-mecanicos-guadalajara-destacar', pais: 'MX' },
  { titulo: 'Talleres mecánicos en Monterrey: cómo competir con las cadenas', slug: 'talleres-mecanicos-monterrey-competir', pais: 'MX' },
  { titulo: 'Talleres mecánicos en Tijuana: cómo atender al cliente fronterizo', slug: 'talleres-tijuana-cliente-fronterizo', pais: 'MX' },
  { titulo: 'Talleres mecánicos en Puebla: cómo conquistar el mercado local', slug: 'talleres-mecanicos-puebla', pais: 'MX' },
  { titulo: 'Talleres mecánicos en Querétaro: la zona del Bajío en crecimiento', slug: 'talleres-queretaro-crecimiento', pais: 'MX' },
  { titulo: 'Talleres mecánicos en León: cómo crecer en el Bajío', slug: 'talleres-leon-bajio', pais: 'MX' },
  { titulo: 'Talleres mecánicos en Cancún: turismo y flotillas en una sola plaza', slug: 'talleres-cancun-turismo', pais: 'MX' },
  { titulo: 'Talleres mecánicos en Mérida: cómo crecer en el sureste mexicano', slug: 'talleres-merida-sureste', pais: 'MX' },
  { titulo: 'Talleres mecánicos en Bogotá: cómo destacar entre miles', slug: 'talleres-bogota-destacar', pais: 'CO' },
  { titulo: 'Talleres mecánicos en Medellín: cultura paisa y emprendimiento', slug: 'talleres-medellin-emprendedora', pais: 'CO' },
  { titulo: 'Talleres mecánicos en Cali: tendencias del mercado vallecaucano', slug: 'talleres-cali-tendencias', pais: 'CO' },
  { titulo: 'Talleres mecánicos en Barranquilla: cómo crecer en la costa', slug: 'talleres-barranquilla-crecer', pais: 'CO' },
  { titulo: 'Talleres mecánicos en Cartagena: el reto del clima costeño', slug: 'talleres-cartagena-clima', pais: 'CO' },
  { titulo: 'Talleres mecánicos en Lima: cómo destacar en el mercado más grande', slug: 'talleres-lima-destacar', pais: 'PE' },
  { titulo: 'Talleres mecánicos en Arequipa: oportunidades del mercado serrano', slug: 'talleres-arequipa-serrano', pais: 'PE' },
  { titulo: 'Talleres mecánicos en Trujillo: oportunidades reales del norte peruano', slug: 'talleres-trujillo-oportunidades', pais: 'PE' },
  { titulo: 'Cómo competir con cadenas de talleres en México', slug: 'competir-cadenas-talleres-mexico', pais: 'MX' },
  { titulo: 'Cómo competir con cadenas de talleres en Colombia', slug: 'competir-cadenas-talleres-colombia', pais: 'CO' },
  { titulo: 'Cómo competir con cadenas de talleres en Perú', slug: 'competir-cadenas-talleres-peru', pais: 'PE' },
  { titulo: 'Talleres mecánicos rurales en México: ¿oportunidad o limitación?', slug: 'talleres-rurales-mexico', pais: 'MX' },
  { titulo: 'Talleres mecánicos rurales en Colombia: cómo crecer fuera de la ciudad', slug: 'talleres-rurales-colombia', pais: 'CO' },
  { titulo: 'Talleres mecánicos rurales en Perú: dónde está la demanda real', slug: 'talleres-rurales-peru', pais: 'PE' },
  { titulo: 'Cómo arrancar un taller mecánico en zona industrial', slug: 'taller-mecanico-zona-industrial', pais: null },
  { titulo: 'Cómo armar un taller mecánico en zona residencial sin problemas con vecinos', slug: 'taller-zona-residencial', pais: null },
  { titulo: 'Cómo competir contra un taller de concesionario (agencia)', slug: 'competir-taller-agencia', pais: null },
  { titulo: 'Por qué los clientes prefieren talleres independientes', slug: 'clientes-prefieren-talleres-independientes', pais: null },
  { titulo: 'Cómo aprovechar la migración de clientes que salen de talleres de agencia', slug: 'migracion-clientes-agencia-taller', pais: null },
  { titulo: 'Talleres mecánicos especializados por marca: ¿conviene o no?', slug: 'talleres-especializados-por-marca', pais: null },
  { titulo: 'Cómo registrar legalmente tu taller mecánico paso a paso', slug: 'registrar-legalmente-taller-mecanico', pais: null },

  // Legal, seguros y regulación
  { titulo: 'Seguros para talleres mecánicos: qué cubrir y qué no', slug: 'seguros-talleres-mecanicos-cubrir', pais: null },
  { titulo: 'Cómo manejar la responsabilidad civil en tu taller mecánico', slug: 'responsabilidad-civil-taller', pais: null },
  { titulo: 'Garantías legales para servicios mecánicos: lo que dice la ley', slug: 'garantias-legales-servicios-mecanicos', pais: null },
  { titulo: 'Cómo manejar un litigio con un cliente en tu taller mecánico', slug: 'litigio-cliente-taller-mecanico', pais: null },
  { titulo: 'Permisos y trámites para abrir un taller mecánico desde cero', slug: 'permisos-tramites-abrir-taller', pais: null },
  { titulo: 'Cómo registrar tu marca de taller mecánico', slug: 'registrar-marca-taller-mecanico', pais: null },
  { titulo: 'Regulaciones ambientales para talleres mecánicos en LATAM', slug: 'regulaciones-ambientales-talleres-latam', pais: null },
  { titulo: 'Cómo manejar los desechos contaminantes en tu taller mecánico', slug: 'manejar-desechos-contaminantes-taller', pais: null },
  { titulo: 'NOMs aplicables a talleres mecánicos en México', slug: 'noms-talleres-mexico', pais: 'MX' },
  { titulo: 'Cómo cumplir con Profeco siendo dueño de un taller mecánico', slug: 'cumplir-profeco-taller', pais: 'MX' },
  { titulo: 'Cómo lidiar con denuncias en redes sociales contra tu taller', slug: 'denuncias-en-redes-taller', pais: null },
  { titulo: 'Cómo manejar accidentes laborales en tu taller mecánico', slug: 'accidentes-laborales-taller-mecanico', pais: null },
  { titulo: 'Seguros para mecánicos: ¿quién paga si pasa algo en tu taller?', slug: 'seguros-mecanicos-quien-paga', pais: null },
  { titulo: 'Cómo redactar términos y condiciones para tu taller mecánico', slug: 'terminos-condiciones-taller', pais: null },
  { titulo: 'IMSS y prestaciones para mecánicos en México: lo básico', slug: 'imss-prestaciones-mecanicos', pais: 'MX' },

  // Temporada y estacionalidad
  { titulo: 'Cómo aprovechar la temporada de vacaciones en tu taller mecánico', slug: 'vacaciones-temporada-taller', pais: null },
  { titulo: 'Cómo manejar tu taller mecánico en temporada baja', slug: 'manejar-taller-temporada-baja', pais: null },
  { titulo: 'Cómo preparar el auto del cliente para temporada de lluvias', slug: 'preparar-auto-temporada-lluvias', pais: null },
  { titulo: 'Cómo preparar el auto del cliente para temporada de calor', slug: 'preparar-auto-temporada-calor', pais: null },
  { titulo: 'Cómo preparar el auto del cliente para temporada de frío', slug: 'preparar-auto-temporada-frio', pais: null },
  { titulo: 'Cómo manejar las posadas y el fin de año en tu taller mecánico', slug: 'fin-de-ano-taller-mecanico', pais: null },
  { titulo: 'Cómo aprovechar el regreso a clases en tu taller mecánico', slug: 'regreso-a-clases-taller-mecanico', pais: null },
  { titulo: 'Cómo manejar tu taller mecánico en Semana Santa', slug: 'semana-santa-taller-mecanico', pais: null },
  { titulo: 'Buen Fin para talleres mecánicos en México: cómo sacarle jugo', slug: 'buen-fin-talleres-mexico', pais: 'MX' },
  { titulo: 'Cómo manejar el Cyber Monday en tu taller mecánico', slug: 'cyber-monday-taller-mecanico', pais: null },
  { titulo: 'Cómo aprovechar la temporada de huracanes para servicios preventivos', slug: 'temporada-huracanes-taller', pais: null },
  { titulo: 'Cómo armar promociones de aniversario para tu taller mecánico', slug: 'promociones-aniversario-taller', pais: null },

  // Tendencias y futuro del taller
  { titulo: 'Vehículos eléctricos: ¿amenaza o oportunidad para tu taller?', slug: 'vehiculos-electricos-taller', pais: null },
  { titulo: 'Cómo prepararte para servir autos eléctricos en LATAM', slug: 'servir-autos-electricos-latam', pais: null },
  { titulo: 'Autos híbridos: lo que tu taller mecánico debe saber hoy', slug: 'autos-hibridos-saber', pais: null },
  { titulo: 'Cómo certificarte para reparar autos eléctricos', slug: 'certificarte-autos-electricos', pais: null },
  { titulo: 'Inteligencia artificial aplicada al diagnóstico automotriz', slug: 'ia-diagnostico-automotriz', pais: null },
  { titulo: 'Realidad aumentada en talleres mecánicos: ¿ciencia ficción o realidad?', slug: 'realidad-aumentada-talleres', pais: null },
  { titulo: 'Big data en tu taller mecánico: cómo empezar a aprovecharlo', slug: 'big-data-taller-mecanico', pais: null },
  { titulo: 'Conectividad automotriz: cómo afecta a tu taller mecánico', slug: 'conectividad-automotriz-taller', pais: null },
  { titulo: 'Mantenimiento predictivo con IA: cómo entrarle siendo taller chico', slug: 'mantenimiento-predictivo-ia', pais: null },
  { titulo: 'Vehículos autónomos: cuándo llegan a LATAM y cómo prepararte', slug: 'vehiculos-autonomos-llegan-latam', pais: null },
  { titulo: 'Estaciones de carga rápida: oportunidades para tu taller mecánico', slug: 'estaciones-carga-rapida-oportunidades', pais: null },
  { titulo: 'Cómo será un taller mecánico en 2030', slug: 'taller-mecanico-2030', pais: null },

  // Mentalidad y estilo de vida del dueño
  { titulo: 'Cómo dejar de ser esclavo de tu propio taller mecánico', slug: 'dejar-de-ser-esclavo-taller', pais: null },
  { titulo: 'Cómo tomar vacaciones siendo dueño de un taller mecánico', slug: 'vacaciones-dueno-taller', pais: null },
  { titulo: 'Cómo manejar el estrés siendo dueño de un taller mecánico', slug: 'manejar-estres-dueno-taller', pais: null },
  { titulo: 'Cómo balancear tu vida personal y tu taller mecánico', slug: 'balancear-vida-personal-taller', pais: null },
  { titulo: 'Salud mental para mecánicos y dueños de taller', slug: 'salud-mental-mecanicos-dueno', pais: null },
  { titulo: 'Cómo planear tu jubilación siendo dueño de un taller mecánico', slug: 'jubilacion-dueno-taller', pais: null },
  { titulo: 'Cómo manejar el síndrome del impostor como dueño de taller', slug: 'sindrome-impostor-dueno-taller', pais: null },
  { titulo: 'Hábitos diarios de los dueños de taller mecánico más exitosos', slug: 'habitos-diarios-duenos-exitosos', pais: null },
  { titulo: 'Cómo armar una rutina matutina como dueño de taller mecánico', slug: 'rutina-matutina-dueno-taller', pais: null },
  { titulo: 'Lectura recomendada para dueños de taller mecánico', slug: 'lectura-recomendada-duenos-taller', pais: null },
  { titulo: 'Cómo armar tu círculo de mentores siendo dueño de taller', slug: 'circulo-mentores-dueno-taller', pais: null },
  { titulo: 'Cómo manejar el miedo al fracaso como dueño de taller mecánico', slug: 'miedo-fracaso-dueno-taller', pais: null },
  { titulo: 'Cómo dejar de pelearte con los clientes y dormir tranquilo', slug: 'dejar-pelearte-clientes-dormir', pais: null },
  { titulo: 'Por qué dejar de hacer todo tú mismo es lo más rentable', slug: 'dejar-hacer-todo-mismo-rentable', pais: null },
  { titulo: 'Cómo armar tu propio plan de inversión personal como dueño de taller', slug: 'plan-inversion-personal-dueno-taller', pais: null },

  // Errores comunes y advertencias
  { titulo: '10 errores que cometen los talleres mecánicos al cotizar', slug: 'errores-cotizar-taller-mecanico', pais: null },
  { titulo: '7 errores que destruyen la rentabilidad de un taller mecánico', slug: 'errores-destruyen-rentabilidad-taller', pais: null },
  { titulo: '5 errores fatales al contratar mecánicos en tu taller', slug: 'errores-contratar-mecanicos-taller', pais: null },
  { titulo: 'Los 8 errores más comunes en redes sociales de un taller mecánico', slug: 'errores-redes-sociales-taller', pais: null },
  { titulo: 'Errores de inventario que les cuestan miles a los talleres', slug: 'errores-inventario-cuestan-miles', pais: null },
  { titulo: '10 errores que cometen los talleres con sus clientes nuevos', slug: 'errores-clientes-nuevos-taller', pais: null },
  { titulo: 'Errores legales que cometen los dueños de talleres mecánicos', slug: 'errores-legales-duenos-talleres', pais: null },
  { titulo: '6 errores comunes con el manejo del efectivo en el taller', slug: 'errores-manejo-efectivo-taller', pais: null },
  { titulo: 'Errores al implementar software de gestión en talleres mecánicos', slug: 'errores-implementar-software-talleres', pais: null },
  { titulo: 'Errores en la atención al cliente que matan al taller mecánico', slug: 'errores-atencion-cliente-matan-taller', pais: null },
  { titulo: 'Errores en marketing que tiran al taller mecánico al abismo', slug: 'errores-marketing-tiran-taller', pais: null },
  { titulo: 'Errores comunes al delegar en un taller mecánico', slug: 'errores-delegar-taller-mecanico', pais: null },
  { titulo: 'Errores comunes al fijar precios en un taller mecánico', slug: 'errores-fijar-precios-taller', pais: null },
  { titulo: 'Errores al pedir reseñas a tus clientes', slug: 'errores-pedir-resenas-clientes', pais: null },
  { titulo: 'Errores que se cometen al recibir un vehículo en el taller', slug: 'errores-recibir-vehiculo-taller', pais: null },

  // Listas y "cómos" rápidos
  { titulo: '7 señales de que tu taller mecánico necesita digitalizarse ya', slug: 'senales-taller-necesita-digitalizarse', pais: null },
  { titulo: '5 indicadores para saber si tu taller crece o solo sobrevive', slug: 'indicadores-taller-crece-sobrevive', pais: null },
  { titulo: '10 cosas que tu cliente quiere oír antes de dejar su auto', slug: '10-cosas-cliente-antes-dejar-auto', pais: null },
  { titulo: '6 maneras de ganar la confianza de un cliente nuevo en tu taller', slug: 'ganar-confianza-cliente-nuevo', pais: null },
  { titulo: '9 hábitos del mecánico que sí está creciendo', slug: 'habitos-mecanico-que-crece', pais: null },
  { titulo: '8 maneras de aumentar el ticket promedio en tu taller', slug: 'maneras-aumentar-ticket-promedio', pais: null },
  { titulo: '5 datos que todo dueño de taller debe revisar cada lunes', slug: 'datos-checar-cada-lunes-taller', pais: null },
  { titulo: '10 frases que mejoran el cierre de venta en tu taller', slug: 'frases-mejoran-cierre-venta-taller', pais: null },
  { titulo: '6 maneras de generar más reseñas para tu taller mecánico', slug: 'maneras-generar-mas-resenas', pais: null },
  { titulo: '7 acciones rápidas para mejorar la imagen de tu taller', slug: 'acciones-mejorar-imagen-taller', pais: null },
  { titulo: '8 cosas que debes medir cada mes en tu taller mecánico', slug: 'cosas-medir-cada-mes-taller', pais: null },
  { titulo: '5 razones por las que tus clientes no regresan a tu taller', slug: 'razones-clientes-no-regresan', pais: null },
  { titulo: '9 ideas para llenar tu agenda en una semana lenta', slug: 'ideas-llenar-agenda-semana-lenta', pais: null },
  { titulo: '6 maneras de hacer crecer tu lista de clientes desde hoy', slug: 'maneras-crecer-lista-clientes', pais: null },
  { titulo: '8 cosas que separan a un taller bueno de uno mediocre', slug: 'cosas-separan-taller-bueno-mediocre', pais: null },
  { titulo: '10 maneras de reducir tiempos muertos en tu taller mecánico', slug: 'maneras-reducir-tiempos-muertos', pais: null },
  { titulo: '7 razones para dejar de aceptar pagos solo en efectivo', slug: 'razones-no-aceptar-efectivo', pais: null },
  { titulo: '6 maneras de pedir referidos sin parecer pesado', slug: 'maneras-pedir-referidos-sin-parecer-pesado', pais: null },
  { titulo: '5 maneras de ganar más sin abrir el sábado', slug: 'ganar-mas-sin-abrir-sabado', pais: null },
  { titulo: '9 cosas que debe tener tu primera junta semanal de taller', slug: 'cosas-junta-semanal-taller', pais: null },

  // Segmentos de cliente
  { titulo: 'Cómo atender bien a un cliente de Uber, Didi o InDriver', slug: 'atender-cliente-uber-didi-bien', pais: null },
  { titulo: 'Cómo atender a clientes con autos chinos en LATAM', slug: 'atender-clientes-autos-chinos-latam', pais: null },
  { titulo: 'Cómo manejar clientes de flotilla en tu taller mecánico', slug: 'clientes-flotilla-taller', pais: null },
  { titulo: 'Cómo armar un servicio para autos del gobierno o municipio', slug: 'autos-gobierno-municipio-servicio', pais: null },
  { titulo: 'Cómo atender bien a clientes con autos de lujo', slug: 'clientes-autos-lujo-atender', pais: null },
  { titulo: 'Cómo manejar el segmento de transporte de carga en tu taller', slug: 'segmento-transporte-carga', pais: null },
  { titulo: 'Cómo atender a clientes mujeres en tu taller mecánico', slug: 'atender-clientes-mujeres-taller', pais: null },
  { titulo: 'Por qué la mujer es la decisora del 70% de compras automotrices', slug: 'mujer-decisora-compras-automotrices', pais: null },
  { titulo: 'Cómo atender clientes de tercera edad en tu taller mecánico', slug: 'clientes-tercera-edad-taller', pais: null },
  { titulo: 'Cómo atender al cliente joven que entiende de autos', slug: 'cliente-joven-entiende-autos', pais: null },
  { titulo: 'Cómo armar un programa especial para taxistas y choferes', slug: 'programa-taxistas-choferes-taller', pais: null },
  { titulo: 'Cómo manejar al cliente que es mecánico y viene a "verificarte"', slug: 'cliente-mecanico-verificar', pais: null },
]

async function limpiarArticulosExistentes(supabase: any): Promise<void> {
  const { data: articulos } = await supabase
    .from('articulos_blog')
    .select('id, contenido')

  for (const art of articulos ?? []) {
    const limpio = limpiarContenidoIA(art.contenido ?? '')
    if (limpio !== art.contenido) {
      await supabase.from('articulos_blog').update({ contenido: limpio }).eq('id', art.id)
    }
  }
}

async function slugExiste(supabase: any, slug: string): Promise<boolean> {
  const { data } = await supabase
    .from('articulos_blog')
    .select('id')
    .eq('slug', slug)
    .single()
  return !!data
}

async function generarArticulo(tema: typeof TEMAS[0]): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key':         process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
      'Content-Type':      'application/json',
    },
    body: JSON.stringify({
      model:      'claude-haiku-4-5',
      max_tokens: 2000,
      messages: [{
        role:    'user',
        content: `Escribe un artículo de blog en español para dueños de talleres mecánicos en Latinoamérica.

Título: "${tema.titulo}"
${tema.pais ? `País objetivo: ${tema.pais === 'MX' ? 'México' : tema.pais === 'CO' ? 'Colombia' : 'Perú'}` : ''}

Instrucciones:
- Tono: directo, práctico, sin rodeos. Habla de tú a tú con el dueño de taller.
- Longitud: 700-900 palabras
- Estructura: introducción con gancho, 3-4 secciones con subtítulos H2, conclusión con CTA
- Incluye datos reales cuando aplique (ej: "el 97% de los clientes lee reseñas antes de elegir un taller")
- Al final menciona naturalmente que TallerOS resuelve el problema principal del artículo, con un CTA a https://www.tallerosapp.com/registro
- Formato: HTML limpio con etiquetas <h2>, <p>, <ul>, <li>, <strong>. Sin <html>, <body>, <head>, <article> ni <h1> (el título ya se muestra aparte, no lo repitas).
- NO uses markdown, solo HTML. No envuelvas la respuesta en \`\`\`html ni en ningún code fence.
- El artículo debe posicionar en Google para la keyword principal del título`,
      }],
    }),
  })
  const data = await res.json()
  return limpiarContenidoIA(data.content?.[0]?.text ?? '')
}

function limpiarContenidoIA(raw: string): string {
  let html = raw.trim()

  // El modelo a veces envuelve la respuesta en un code fence de markdown pese a las instrucciones
  html = html.replace(/^```(?:html)?\s*\n?/i, '').replace(/\n?```\s*$/, '').trim()

  // El modelo a veces envuelve el contenido en su propio <article>, duplicando el que ya pone la página
  const articleMatch = html.match(/^<article[^>]*>([\s\S]*)<\/article>\s*$/i)
  if (articleMatch) html = articleMatch[1].trim()

  // La página ya renderiza su propio <h1> con el título; quitamos el duplicado si el modelo lo agregó
  html = html.replace(/^<h1[^>]*>[\s\S]*?<\/h1>\s*/i, '')

  return html.trim()
}

async function generarScript(tema: typeof TEMAS[0]): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key':         process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
      'Content-Type':      'application/json',
    },
    body: JSON.stringify({
      model:      'claude-haiku-4-5',
      max_tokens: 500,
      messages: [{
        role:    'user',
        content: `Escribe un script de video de 60 segundos para TikTok y YouTube Shorts en español mexicano.

Tema: "${tema.titulo}"
${tema.pais ? `País: ${tema.pais === 'MX' ? 'México' : tema.pais === 'CO' ? 'Colombia' : 'Perú'}` : 'LATAM'}

Instrucciones:
- Usa el efecto Zeigarnik: abre con una pregunta o situación sin resolver, da contenido de valor real durante el video, y termina dejando una idea incompleta que genere curiosidad para buscar más
- El contenido debe ser 100% de valor para el mecánico, sin tono de venta ni mencionar TallerOS directamente
- Si mencionas una herramienta o sistema, hazlo de forma natural como referencia, nunca como anuncio
- Tono: como un colega mecánico exitoso que comparte lo que aprendió, directo y con lenguaje mexicano natural
- Estructura:
  [GANCHO - 5 seg]: Pregunta o dato que deja al espectador con la duda
  [CONTENIDO - 45 seg]: 3 puntos de valor real y accionable sobre el tema
  [CIERRE ZEIGARNIK - 10 seg]: Termina con una idea a medias o una pregunta que genera curiosidad, sin resolverla completamente
- Máximo 150 palabras
- Sin hashtags, sin emojis, solo el texto que va a decir el avatar
- Formato: texto plano`,
      }],
    }),
  })
  const data = await res.json()
  return data.content?.[0]?.text ?? ''
}

async function generarScriptLargo(tema: typeof TEMAS[0]): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key':         process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
      'Content-Type':      'application/json',
    },
    body: JSON.stringify({
      model:      'claude-haiku-4-5',
      max_tokens: 2000,
      messages: [{
        role:    'user',
        content: `Escribe un script de video de 5 minutos para YouTube en español, estilo Alex Hormozi — directo, datos duros, sin relleno, ejemplos específicos, cada oración tiene que valer.

Tema: "${tema.titulo}"
${tema.pais ? `País: ${tema.pais === 'MX' ? 'México' : tema.pais === 'CO' ? 'Colombia' : 'Perú'}` : 'LATAM'}

Instrucciones:
- Tono: empresario exitoso que habla directo con otro empresario. Sin condescendencia, sin motivación barata
- Estructura:
  [GANCHO - 30 seg]: Dato duro o situación específica que golpea en los primeros 5 segundos. Sin introducción, sin "hola qué tal"
  [PROBLEMA - 60 seg]: El problema real con datos concretos. Por qué duele. Cuánto cuesta no resolverlo
  [MARCO - 60 seg]: La forma correcta de pensar sobre este problema. El insight que cambia la perspectiva
  [SOLUCIÓN - 120 seg]: 3 pasos concretos y accionables. Cada uno con un ejemplo específico de un taller real o situación real
  [OBJECIÓN - 30 seg]: La excusa más común que pone el mecánico para no hacer esto. Destrúyela con datos
  [CIERRE - 30 seg]: Qué pasa si lo hace vs si no lo hace. Sin CTA de venta, termina con una pregunta que los haga reflexionar
- Usa datos reales cuando puedas (porcentajes, pesos, tiempos)
- Menciona situaciones específicas de talleres en LATAM
- Nunca menciones TallerOS directamente
- Máximo 750 palabras (ritmo de 150 palabras por minuto)
- Sin hashtags, sin emojis, solo el texto que va a decir el avatar
- Formato: texto plano con saltos de línea entre secciones`,
      }],
    }),
  })
  const data = await res.json()
  return data.content?.[0]?.text ?? ''
}

function extractExcerpt(html: string): string {
  const match = html.match(/<p[^>]*>(.*?)<\/p>/s)
  if (!match) return ''
  return match[1].replace(/<[^>]+>/g, '').slice(0, 200).trim() + '...'
}

async function enviarAlertaError(detalle: string): Promise<void> {
  try {
    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': process.env.BREVO_API_KEY!, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender:      { name: 'TallerOS Alertas', email: 'hola@tallerosapp.com' },
        to:          [{ email: 'hola@tallerosapp.com', name: 'Ivan' }],
        subject:     '⚠️ El agente de blog/scripts falló hoy — TallerOS',
        htmlContent: `<p>El cron de blog (<code>/api/cron/blog</code>) tuvo un problema hoy:</p><p style="color:#dc2626;">${detalle}</p>`,
      }),
    })
  } catch {
    // Si la alerta misma falla no hay más que hacer — ya se perdió la visibilidad de este error
  }
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    await limpiarArticulosExistentes(supabase)

    const diaDelAnio = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)

    // Avanza por la lista hasta encontrar un tema que no se haya publicado todavía.
    // Antes esto se saltaba el día entero si el tema rotado ya existía, así que el
    // correo del script dejó de llegar cuando ~60% de los temas ya estaban tomados.
    let tema: typeof TEMAS[0] | null = null
    for (let i = 0; i < TEMAS.length; i++) {
      const candidato = TEMAS[(diaDelAnio + i) % TEMAS.length]
      if (!(await slugExiste(supabase, candidato.slug))) {
        tema = candidato
        break
      }
    }
    if (!tema) {
      await enviarAlertaError('Se agotaron los temas del array TEMAS — ya no quedan slugs nuevos. Hay que agregar temas o permitir versiones.')
      return NextResponse.json({ ok: false, mensaje: 'Se agotaron los temas disponibles.' })
    }

    const esDiaLargo = diaDelAnio % 2 === 0

    // Promise.allSettled en vez de Promise.all: si la generación del artículo falla,
    // el guion del video corto/largo se sigue guardando — no deben depender uno del otro.
    const [articuloR, scriptR, scriptLargoR] = await Promise.allSettled([
      generarArticulo(tema),
      generarScript(tema),
      esDiaLargo ? generarScriptLargo(tema) : Promise.resolve(''),
    ])

    const errores: string[] = []

    if (articuloR.status === 'fulfilled' && articuloR.value) {
      const contenidoHtml = articuloR.value
      const { error } = await supabase.from('articulos_blog').insert({
        titulo:       tema.titulo,
        slug:         tema.slug,
        contenido:    contenidoHtml,
        excerpt:      extractExcerpt(contenidoHtml),
        pais:         tema.pais,
        publicado:    true,
        published_at: new Date().toISOString(),
      })
      if (error) errores.push(`Artículo de blog: ${error.message}`)
    } else {
      errores.push(`Artículo de blog: ${articuloR.status === 'rejected' ? articuloR.reason : 'Claude no devolvió contenido'}`)
    }

    if (scriptR.status === 'fulfilled' && scriptR.value) {
      const { error } = await supabase.from('scripts_video').insert({
        slug:              tema.slug,
        titulo:            tema.titulo,
        script:            scriptR.value,
        duracion_segundos: 60,
        plataforma:        ['tiktok', 'youtube_shorts'],
        publicado:         false,
        email_enviado:     false,
      })
      if (error) errores.push(`Script corto: ${error.message}`)
    } else {
      errores.push(`Script corto: ${scriptR.status === 'rejected' ? scriptR.reason : 'Claude no devolvió script'}`)
    }

    if (esDiaLargo) {
      if (scriptLargoR.status === 'fulfilled' && scriptLargoR.value) {
        const { error } = await supabase.from('scripts_video_largo').insert({
          slug:             tema.slug,
          titulo:           tema.titulo,
          script:           scriptLargoR.value,
          duracion_minutos: 5,
          email_enviado:    false,
        })
        if (error) errores.push(`Script largo: ${error.message}`)
      } else {
        errores.push(`Script largo: ${scriptLargoR.status === 'rejected' ? scriptLargoR.reason : 'Claude no devolvió script largo'}`)
      }
    }

    if (errores.length > 0) {
      await enviarAlertaError(errores.join(' | '))
    }

    return NextResponse.json({
      ok:        errores.length === 0,
      slug:      tema.slug,
      titulo:    tema.titulo,
      dia_largo: esDiaLargo,
      errores,
    })

  } catch (error: any) {
    await enviarAlertaError(error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}