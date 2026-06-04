export default function LoadingConfiguracion() {
  return (
    <div className="min-h-screen bg-gray-50 p-6 animate-pulse">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded-full" />
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3 w-28 bg-gray-200 rounded-full" />
              <div className="h-10 bg-gray-100 rounded-xl" />
            </div>
          ))}
          <div className="h-10 w-32 bg-gray-200 rounded-xl mt-2" />
        </div>
      </div>
    </div>
  )
}
