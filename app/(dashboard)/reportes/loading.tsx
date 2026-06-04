export default function LoadingReportes() {
  return (
    <div className="min-h-screen bg-gray-50 p-6 animate-pulse">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="h-8 w-40 bg-gray-200 rounded-full" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 space-y-2">
              <div className="h-3 w-20 bg-gray-200 rounded-full" />
              <div className="h-7 w-28 bg-gray-200 rounded-full" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 h-64" />
          <div className="bg-white rounded-xl border border-gray-200 p-6 h-64" />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 h-48" />
      </div>
    </div>
  )
}
