export default function LoadingResenas() {
  return (
    <div className="min-h-screen bg-gray-50 p-6 animate-pulse">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="h-8 w-36 bg-gray-200 rounded-full" />
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="h-5 w-48 bg-gray-200 rounded-full" />
          <div className="h-16 bg-gray-100 rounded-xl" />
          <div className="h-10 w-32 bg-gray-200 rounded-xl" />
        </div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-200 shrink-0" />
                <div className="h-4 w-32 bg-gray-200 rounded-full" />
                <div className="ml-auto h-4 w-20 bg-gray-100 rounded-full" />
              </div>
              <div className="h-3 w-3/4 bg-gray-100 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
