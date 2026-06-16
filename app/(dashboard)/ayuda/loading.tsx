export default function LoadingAyuda() {
  return (
    <div className="min-h-screen bg-gray-50 p-6 animate-pulse">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="h-8 w-24 bg-gray-200 rounded-full" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 space-y-2">
              <div className="h-5 w-56 bg-gray-200 rounded-full" />
              <div className="h-3 w-full bg-gray-100 rounded-full" />
              <div className="h-3 w-4/5 bg-gray-100 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
