'use client'

interface Props {
  valor: string
  onChange: (valor: string) => void
  mecanicos: { id: string; nombre: string }[]
  className: string
}

/**
 * El campo "Mecánico asignado".
 *
 * Con técnicos dados de alta es un desplegable: se elige de la lista y así el
 * nombre coincide exacto con el del usuario, que es lo que permite mandarle la
 * notificación de "nueva orden asignada".
 *
 * Sin técnicos dados de alta era un desplegable con una sola opción, "Sin
 * asignar", y ninguna pista de por qué. Un taller que estrena TallerOS no tiene
 * a nadie invitado todavía, así que ese es justo el estado que se encuentra el
 * primer día — y parece que la función está rota.
 *
 * Y no basta con explicarlo: dar de alta a un técnico es una invitación por
 * correo, y hasta que la persona no la acepta y se registra no aparece en la
 * lista. Mandar al usuario a Configuración en mitad de una orden le hace perder
 * lo que llevaba escrito, y volver no arregla nada porque el técnico sigue sin
 * aceptar. Por eso aquí se puede escribir el nombre a mano: la orden queda con
 * su mecánico desde el primer día, y la notificación llegará cuando el técnico
 * exista de verdad.
 */
export default function CampoMecanico({ valor, onChange, mecanicos, className }: Props) {
  if (mecanicos.length === 0) {
    return (
      <>
        <input
          type="text"
          value={valor}
          onChange={e => onChange(e.target.value)}
          placeholder="Nombre del mecánico"
          className={className}
        />
        <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
          Todavía no tienes técnicos en tu equipo, así que escribe el nombre aquí.
          Cuando los des de alta en <strong>Configuración → Equipo</strong> podrás
          elegirlos de una lista y les llegará un aviso al asignarles una orden.
        </p>
      </>
    )
  }

  return (
    <select value={valor} onChange={e => onChange(e.target.value)} className={className}>
      <option value="">Sin asignar</option>
      {mecanicos.map(m => (
        <option key={m.id} value={m.nombre}>{m.nombre}</option>
      ))}
      {/* Órdenes viejas con un nombre escrito a mano: si no está aquí, abrir la
          orden y guardar sin tocar nada le borraría el mecánico. */}
      {valor && !mecanicos.some(m => m.nombre === valor) && (
        <option value={valor}>{valor}</option>
      )}
    </select>
  )
}
