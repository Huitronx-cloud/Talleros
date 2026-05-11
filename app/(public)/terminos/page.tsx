export default function TerminosPage() {
  return (
    <div style={{ background: '#050a12', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', color: '#f1f5f9' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '80px 24px' }}>

        <a href="/" style={{ color: '#3b82f6', fontSize: 14, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 48 }}>
          ← Volver a TallerOS
        </a>

        <h1 style={{ fontSize: 40, fontWeight: 900, letterSpacing: '-1px', marginBottom: 8 }}>Términos de Servicio</h1>
        <p style={{ color: '#475569', fontSize: 14, marginBottom: 56 }}>Última actualización: 11 de mayo de 2026</p>

        {[
          {
            titulo: '1. Aceptación de los términos',
            contenido: `Al registrarse y usar TallerOS, usted acepta estos Términos de Servicio en su totalidad. Si no está de acuerdo con alguna parte de estos términos, no podrá usar el servicio. TallerOS es operado por TallerOS (en proceso de constitución en Canadá).`,
          },
          {
            titulo: '2. Descripción del servicio',
            contenido: `TallerOS es una plataforma de software como servicio (SaaS) diseñada para la gestión de talleres mecánicos. El servicio incluye gestión de órdenes de trabajo, clientes, vehículos, citas, cotizaciones, inventario, comunicación con clientes vía WhatsApp, portal del cliente, y herramientas de automatización de marketing.`,
          },
          {
            titulo: '3. Cuentas de usuario',
            contenido: `Usted es responsable de mantener la confidencialidad de sus credenciales de acceso y de todas las actividades que ocurran bajo su cuenta. Debe notificarnos inmediatamente sobre cualquier uso no autorizado. Debe proporcionar información veraz y actualizada al registrarse. Cada cuenta corresponde a un taller; no puede compartir su cuenta con otros talleres.`,
          },
          {
            titulo: '4. Planes y pagos',
            contenido: `TallerOS ofrece un período de prueba gratuito de 14 días sin necesidad de tarjeta de crédito. Después del período de prueba, debe suscribirse a un plan de pago para continuar usando el servicio. Los pagos se procesan mensual o anualmente según el plan elegido. Los precios están en dólares estadounidenses (USD). No ofrecemos reembolsos por períodos parciales, excepto donde lo exija la ley aplicable.`,
          },
          {
            titulo: '5. Cancelación',
            contenido: `Puede cancelar su suscripción en cualquier momento desde la sección "Plan y facturación" de su cuenta. La cancelación será efectiva al final del período de facturación actual. No se realizarán cargos adicionales después de la cancelación. Sus datos estarán disponibles por 30 días adicionales después de la cancelación antes de ser eliminados permanentemente.`,
          },
          {
            titulo: '6. Propiedad de los datos',
            contenido: `Usted conserva todos los derechos sobre los datos que ingresa en TallerOS, incluyendo información de clientes, vehículos y órdenes de servicio. TallerOS no reclamará propiedad sobre su contenido. Usted nos otorga una licencia limitada para usar sus datos únicamente con el propósito de proveer el servicio.`,
          },
          {
            titulo: '7. Uso aceptable',
            contenido: `Usted se compromete a no usar TallerOS para: actividades ilegales o fraudulentas; enviar spam o comunicaciones no solicitadas; intentar acceder a datos de otros usuarios; interferir con el funcionamiento del servicio; revender o sublicenciar el servicio sin autorización expresa.`,
          },
          {
            titulo: '8. Disponibilidad del servicio',
            contenido: `Nos esforzamos por mantener TallerOS disponible 24/7, pero no garantizamos disponibilidad ininterrumpida. Realizaremos mantenimientos programados con previo aviso cuando sea posible. No somos responsables por interrupciones causadas por factores fuera de nuestro control.`,
          },
          {
            titulo: '9. Limitación de responsabilidad',
            contenido: `En la máxima medida permitida por la ley canadiense, TallerOS no será responsable por daños indirectos, incidentales, especiales o consecuentes. Nuestra responsabilidad total no excederá el monto pagado por usted en los últimos 12 meses. No somos responsables por pérdida de datos causada por uso inadecuado del servicio.`,
          },
          {
            titulo: '10. Modificaciones al servicio',
            contenido: `Nos reservamos el derecho de modificar o discontinuar funcionalidades del servicio con previo aviso de 30 días. En caso de cambios significativos en los precios, notificaremos con 60 días de anticipación. Si no está de acuerdo con los cambios, puede cancelar su suscripción antes de que entren en vigor.`,
          },
          {
            titulo: '11. Ley aplicable',
            contenido: `Estos términos se rigen por las leyes de la provincia de Ontario, Canadá, y las leyes federales de Canadá aplicables. Cualquier disputa será resuelta en los tribunales competentes de Ontario, Canadá.`,
          },
          {
            titulo: '12. Contacto',
            contenido: `Para preguntas sobre estos términos, contáctenos en: hola@tallerosapp.com`,
          },
        ].map((seccion, i) => (
          <div key={i} style={{ marginBottom: 40, paddingBottom: 40, borderBottom: i < 11 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9', marginBottom: 12 }}>{seccion.titulo}</h2>
            <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.8 }}>{seccion.contenido}</p>
          </div>
        ))}

      </div>
    </div>
  )
}