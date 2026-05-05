export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <img
              src="/icon-512.png"
              alt="TallerOS"
              width={96}
              height={96}
              className="rounded-2xl shadow-lg"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">TallerOS</h1>
          <p className="text-sm text-gray-500 mt-1">Gestión inteligente para tu taller</p>
        </div>
        {children}
      </div>
    </div>
  )
}
