export default function LoadingCatalogo() {
  return (
    <div className="min-h-screen bg-gray-50 p-6 animate-pulse">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-36 bg-gray-200 rounded-full" />
          <div className="h-10 w-36 bg-gray-200 rounded-xl" />
        </div>
        <div className="h-10 w-72 bg-gray-200 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <div className="h-5 w-3/4 bg-gray-200 rounded-full" />
              <div className="h-3 w-full bg-gray-100 rounded-full" />
              <div className="flex items-center justify-between pt-1">
                <div className="h-5 w-20 bg-gray-200 rounded-full" />
                <div className="h-8 w-8 bg-gray-100 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
