export default function LoadingOrdenes() {
  return (
    <div className="min-h-screen bg-gray-50 p-6 animate-pulse">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-gray-200 rounded-full" />
          <div className="h-10 w-36 bg-gray-200 rounded-xl" />
        </div>
        {/* Filtros */}
        <div className="flex gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-9 w-24 bg-gray-200 rounded-full" />
          ))}
        </div>
        {/* Filas */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-gray-100 last:border-0">
              <div className="h-4 w-12 bg-gray-200 rounded-full" />
              <div className="h-4 w-32 bg-gray-200 rounded-full" />
              <div className="h-4 w-24 bg-gray-200 rounded-full" />
              <div className="ml-auto h-6 w-20 bg-gray-200 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}