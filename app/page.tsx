import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="pt-8 pb-12">
          <nav className="flex justify-between items-center">
            <div className="text-2xl font-bold text-gray-900">
              Vibe - Universal API Warehouse
            </div>
            <div className="space-x-4">
              <Link href="/sign-in" className="text-gray-600 hover:text-gray-900">
                Sign In
              </Link>
              <Link href="/sign-up" className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600">
                Get Started
              </Link>
            </div>
          </nav>
        </header>

        {/* Hero Section */}
        <main className="text-center py-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Manage and Test All Your APIs<br />
            <span className="text-orange-500">In One Place</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Universal API Warehouse that lets you connect, test, and manage all your services 
            through a functional web interface. Built for developers who need to access and 
            test their services directly.
          </p>
          
          <div className="space-x-4 mb-12">
            <Link href="/sign-up" className="bg-orange-500 text-white px-8 py-3 rounded-lg text-lg hover:bg-orange-600 inline-block">
              Start Testing APIs
            </Link>
            <Link href="/pricing" className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg text-lg hover:bg-gray-50 inline-block">
              View Pricing
            </Link>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-orange-500 text-3xl mb-4">🔌</div>
              <h3 className="text-xl font-semibold mb-2">Universal API Access</h3>
              <p className="text-gray-600">Connect and manage all your APIs from a single dashboard interface.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-orange-500 text-3xl mb-4">🧪</div>
              <h3 className="text-xl font-semibold mb-2">Direct Testing</h3>
              <p className="text-gray-600">Test your services directly through our functional web interface.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-orange-500 text-3xl mb-4">📊</div>
              <h3 className="text-xl font-semibold mb-2">Real-time Monitoring</h3>
              <p className="text-gray-600">Monitor API performance and track usage across all your services.</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}