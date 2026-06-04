export default function LoadingKanban() {
  return (
    <div className="min-h-screen bg-gray-50 p-6 animate-pulse">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="h-8 w-40 bg-gray-200 rounded-full" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-start">
          {[...Array(4)].map((_, col) => (
            <div key={col} className="space-y-3">
              <div className="h-9 bg-gray-200 rounded-xl" />
              {[...Array(3 - (col % 2))].map((_, row) => (
                <div key={row} className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
                  <div className="h-4 w-3/4 bg-gray-200 rounded-full" />
                  <div className="h-3 w-1/2 bg-gray-100 rounded-full" />
                  <div className="h-3 w-2/3 bg-gray-100 rounded-full" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
