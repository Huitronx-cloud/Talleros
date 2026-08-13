export const metadata = {
  robots: { index: false, follow: false },
}

// El layout era un passthrough puro, así que el contenido quedaba pegado a los
// bordes de la ventana en todas las pantallas de admin. El contenedor da
// respiro y un ancho máximo para que las tarjetas no se estiren sin fin.
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {children}
      </div>
    </div>
  )
}
