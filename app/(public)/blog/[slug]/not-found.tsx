import Link from 'next/link'

export default function ArticuloNoEncontrado() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
      <p className="text-gray-500 text-lg font-semibold">Artículo no encontrado</p>
      <Link href="/blog" className="text-blue-600 hover:underline text-sm">← Volver al blog</Link>
    </div>
  )
}
