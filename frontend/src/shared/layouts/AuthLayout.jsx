export default function AuthLayout({
  title,
  subtitle,
  children,
}) {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Kugrow OS
          </h1>

          <p className="mt-2 text-gray-600">
            AI-powered business operating system
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">
              {title}
            </h2>

            {subtitle && (
              <p className="mt-2 text-sm text-gray-600">
                {subtitle}
              </p>
            )}
          </div>

          {/* Page Content */}
          {children}
        </div>
      </div>
    </div>
  );
}