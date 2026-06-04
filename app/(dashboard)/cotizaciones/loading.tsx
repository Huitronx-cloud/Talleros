export default function LoadingCotizaciones() {
  return (
    <div className="min-h-screen bg-gray-50 p-6 animate-pulse">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-gray-200 rounded-full" />
          <div className="h-10 w-40 bg-gray-200 rounded-xl" />
        </div>
        <div className="flex gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-9 w-24 bg-gray-200 rounded-full" />
          ))}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-gray-100 last:border-0">
              <div className="h-4 w-12 bg-gray-200 rounded-full" />
              <div className="h-4 w-36 bg-gray-200 rounded-full" />
              <div className="h-4 w-24 bg-gray-200 rounded-full" />
              <div className="ml-auto flex gap-3">
                <div className="h-6 w-20 bg-gray-200 rounded-full" />
                <div className="h-6 w-16 bg-gray-200 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
