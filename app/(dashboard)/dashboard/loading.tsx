export default function LoadingDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      {/* Header skeleton */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900 px-6 pt-8 pb-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-white/10" />
            <div className="space-y-2">
              <div className="h-3 w-24 bg-white/10 rounded-full" />
              <div className="h-6 w-48 bg-white/10 rounded-full" />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white/10 rounded-xl px-4 py-3 h-16" />
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Módulos skeleton */}
        <div>
          <div className="h-4 w-24 bg-gray-200 rounded-full mb-4" />
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="h-20 bg-gray-100" />
                <div className="p-3">
                  <div className="h-3 bg-gray-200 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gráfica + órdenes skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 h-64" />
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 h-64" />
        </div>
      </div>
    </div>
  )
}