export default function LoadingInventario() {
  return (
    <div className="min-h-screen bg-gray-50 p-6 animate-pulse">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-40 bg-gray-200 rounded-full" />
          <div className="h-10 w-36 bg-gray-200 rounded-xl" />
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-64 bg-gray-200 rounded-xl" />
          <div className="h-10 w-32 bg-gray-200 rounded-xl" />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex gap-4 px-6 py-3 border-b border-gray-100">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-3 w-20 bg-gray-100 rounded-full" />
            ))}
          </div>
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-gray-100 last:border-0">
              <div className="h-4 w-40 bg-gray-200 rounded-full" />
              <div className="h-4 w-20 bg-gray-200 rounded-full" />
              <div className="h-4 w-16 bg-gray-200 rounded-full" />
              <div className="ml-auto h-6 w-16 bg-gray-200 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
