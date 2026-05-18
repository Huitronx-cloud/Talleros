export default function LoadingClientes() {
  return (
    <div className="min-h-screen bg-gray-50 p-6 animate-pulse">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-36 bg-gray-200 rounded-full" />
          <div className="h-10 w-36 bg-gray-200 rounded-xl" />
        </div>
        <div className="h-11 w-full bg-gray-200 rounded-xl" />
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-gray-100 last:border-0">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-40 bg-gray-200 rounded-full" />
                <div className="h-3 w-28 bg-gray-200 rounded-full" />
              </div>
              <div className="h-4 w-20 bg-gray-200 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}