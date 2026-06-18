import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidad — TallerOS',
  description: 'Conoce cómo TallerOS recopila, usa y protege los datos de tu taller mecánico y tus clientes.',
  alternates: { canonical: '/privacidad' },
}

export default function PrivacidadPage() {
  return (
    <div style={{ background: '#050a12', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', color: '#f1f5f9' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '80px 24px' }}>

        {/* Nav back */}
        <a href="/" style={{ color: '#3b82f6', fontSize: 14, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 48 }}>
          ← Volver a TallerOS
        </a>

        <h1 style={{ fontSize: 40, fontWeight: 900, letterSpacing: '-1px', marginBottom: 8 }}>Política de Privacidad</h1>
        <p style={{ color: '#475569', fontSize: 14, marginBottom: 56 }}>Última actualización: 11 de mayo de 2026</p>

        {[
          {
            titulo: '1. Información que recopilamos',
            contenido: `Recopilamos información que usted nos proporciona directamente al registrarse y usar TallerOS, incluyendo: nombre y apellido, dirección de correo electrónico, nombre del taller, país de operación, información de pago procesada por Stripe (no almacenamos datos de tarjetas), y datos operativos del taller como clientes, vehículos, órdenes de servicio y citas.`,
          },
          {
            titulo: '2. Cómo usamos su información',
            contenido: `Usamos la información recopilada para: proveer, mantener y mejorar los servicios de TallerOS; procesar pagos y gestionar suscripciones; enviar notificaciones transaccionales relacionadas con su cuenta; enviar recordatorios de mantenimiento a sus clientes en su nombre; solicitar reseñas en Google en su nombre cuando usted lo configure; y responder a sus consultas de soporte.`,
          },
          {
            titulo: '3. Compartición de información',
            contenido: `No vendemos, arrendamos ni compartimos su información personal con terceros para fines comerciales. Compartimos información únicamente con proveedores de servicios que nos ayudan a operar TallerOS: Supabase (almacenamiento de datos), Stripe (procesamiento de pagos), Resend (envío de correos), Twilio (mensajes de WhatsApp), y Vercel (infraestructura). Todos estos proveedores están sujetos a acuerdos de confidencialidad.`,
          },
          {
            titulo: '4. Retención de datos',
            contenido: `Conservamos su información mientras su cuenta esté activa. Si cancela su cuenta, eliminaremos sus datos personales en un plazo de 30 días, excepto cuando la ley canadiense nos exija conservarlos por más tiempo (por ejemplo, registros financieros que deben conservarse por 7 años según la legislación fiscal canadiense).`,
          },
          {
            titulo: '5. Seguridad',
            contenido: `Implementamos medidas de seguridad técnicas y organizativas apropiadas para proteger su información, incluyendo cifrado en tránsito (HTTPS/TLS), cifrado en reposo, autenticación segura, y acceso restringido a datos personales. Sin embargo, ningún sistema es 100% seguro y no podemos garantizar seguridad absoluta.`,
          },
          {
            titulo: '6. Sus derechos (PIPEDA — Canada)',
            contenido: `De conformidad con la Ley de Protección de Información Personal y Documentos Electrónicos (PIPEDA) de Canadá, usted tiene derecho a: acceder a su información personal que tenemos almacenada; corregir información inexacta; retirar su consentimiento para el uso de su información (lo que puede resultar en la cancelación del servicio); y presentar una queja ante el Comisionado de Privacidad de Canadá. Para ejercer estos derechos, contáctenos en hola@tallerosapp.com.`,
          },
          {
            titulo: '7. Cookies',
            contenido: `TallerOS utiliza cookies esenciales para el funcionamiento del servicio, como la gestión de sesiones de usuario. No utilizamos cookies de seguimiento publicitario ni compartimos datos con redes publicitarias.`,
          },
          {
            titulo: '8. Transferencias internacionales de datos',
            contenido: `Sus datos pueden ser procesados en servidores ubicados fuera de Canadá (principalmente en Estados Unidos) a través de nuestros proveedores de servicios. Nos aseguramos de que estos proveedores cumplan con estándares de protección de datos equivalentes a los canadienses.`,
          },
          {
            titulo: '9. Cambios a esta política',
            contenido: `Podemos actualizar esta política de privacidad ocasionalmente. Le notificaremos por correo electrónico sobre cambios significativos. El uso continuado de TallerOS después de dichos cambios constituye su aceptación de la política actualizada.`,
          },
          {
            titulo: '10. Contacto',
            contenido: `Para preguntas sobre esta política de privacidad o sobre sus datos personales, contáctenos en: hola@tallerosapp.com`,
          },
        ].map((seccion, i) => (
          <div key={i} style={{ marginBottom: 40, paddingBottom: 40, borderBottom: i < 9 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9', marginBottom: 12 }}>{seccion.titulo}</h2>
            <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.8 }}>{seccion.contenido}</p>
          </div>
        ))}

      </div>
    </div>
  )
}