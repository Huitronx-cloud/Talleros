export default function LoadingRecordatorios() {
  return (
    <div className="min-h-screen bg-gray-50 p-6 animate-pulse">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded-full" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-5 w-40 bg-gray-200 rounded-full" />
                <div className="h-6 w-20 bg-gray-200 rounded-full" />
              </div>
              <div className="h-3 w-64 bg-gray-100 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
