export default function LoadingGeneral() {
  return (
    <div className="min-h-screen bg-gray-50 p-6 animate-pulse">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="h-8 w-56 bg-gray-200 rounded-full" />
        <div className="h-4 w-80 bg-gray-200 rounded-full" />
        <div className="grid grid-cols-1 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-xl flex-shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-48 bg-gray-200 rounded-full" />
                  <div className="h-3 w-32 bg-gray-200 rounded-full" />
                </div>
                <div className="h-8 w-24 bg-gray-200 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}