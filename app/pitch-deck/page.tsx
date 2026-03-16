import Image from "next/image";

export default function PitchDeckPage() {
  return (
    <div className="min-h-screen bg-white print:bg-white">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white py-16 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-4">LASUTH HMS</h1>
            <h2 className="text-2xl font-light mb-6">Hospital Management System</h2>
            <p className="text-xl opacity-90">Transforming Healthcare Through Technology</p>
          </div>
        </div>
      </div>

      {/* Problem Statement */}
      <div className="py-16 px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">The Challenge</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <div className="text-red-500 text-4xl mb-4">📋</div>
              <h3 className="text-xl font-semibold mb-4">Manual Processes</h3>
              <p className="text-gray-600">Paper-based records leading to inefficiencies and errors</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <div className="text-red-500 text-4xl mb-4">⏰</div>
              <h3 className="text-xl font-semibold mb-4">Time Constraints</h3>
              <p className="text-gray-600">Long patient wait times and delayed service delivery</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <div className="text-red-500 text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold mb-4">Data Fragmentation</h3>
              <p className="text-gray-600">Disparate systems making data access difficult</p>
            </div>
          </div>
        </div>
      </div>

      {/* Solution */}
      <div className="py-16 px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">Our Solution</h2>
          <div className="bg-blue-50 p-12 rounded-2xl">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-3xl font-bold mb-6 text-blue-900">Comprehensive HMS</h3>
                <p className="text-lg text-gray-700 mb-6">
                  A modern, cloud-based Hospital Management System designed specifically for LASUTH,
                  built with cutting-edge technology to streamline operations and improve patient care.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                    <span className="text-gray-700">Real-time patient management</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                    <span className="text-gray-700">Automated billing and payments</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                    <span className="text-gray-700">Integrated lab and pharmacy systems</span>
                  </div>
                </div>
              </div>
              <div className="bg-white p-8 rounded-xl shadow-lg">
                <div className="text-center">
                  <div className="text-6xl mb-4">🏥</div>
                  <h4 className="text-xl font-semibold mb-2">Live System</h4>
                  <p className="text-gray-600 mb-4">Available at:</p>
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <p className="font-mono text-blue-800">www.lasuth-hms.vercel.app</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Features */}
      <div className="py-16 px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">Key Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-lg text-center">
              <div className="text-blue-600 text-4xl mb-4">👥</div>
              <h3 className="text-lg font-semibold mb-2">Patient Management</h3>
              <p className="text-gray-600 text-sm">Complete patient records with appointment scheduling</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg text-center">
              <div className="text-blue-600 text-4xl mb-4">💰</div>
              <h3 className="text-lg font-semibold mb-2">Billing System</h3>
              <p className="text-gray-600 text-sm">Automated billing with multiple payment methods</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg text-center">
              <div className="text-blue-600 text-4xl mb-4">🔬</div>
              <h3 className="text-lg font-semibold mb-2">Lab Integration</h3>
              <p className="text-gray-600 text-sm">Seamless lab test requests and results management</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg text-center">
              <div className="text-blue-600 text-4xl mb-4">📱</div>
              <h3 className="text-lg font-semibold mb-2">Mobile Ready</h3>
              <p className="text-gray-600 text-sm">Responsive design for all devices</p>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="py-16 px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">Benefits to LASUTH</h2>
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-semibold mb-6 text-blue-900">Operational Benefits</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-4 mt-1">✓</div>
                  <div>
                    <h4 className="font-semibold">Reduced Paperwork</h4>
                    <p className="text-gray-600">Eliminate manual record keeping</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-4 mt-1">✓</div>
                  <div>
                    <h4 className="font-semibold">Faster Service</h4>
                    <p className="text-gray-600">Reduce patient wait times by 60%</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-4 mt-1">✓</div>
                  <div>
                    <h4 className="font-semibold">Real-time Data</h4>
                    <p className="text-gray-600">Instant access to patient information</p>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-semibold mb-6 text-blue-900">Financial Benefits</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-4 mt-1">✓</div>
                  <div>
                    <h4 className="font-semibold">Reduced Costs</h4>
                    <p className="text-gray-600">Lower administrative expenses</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-4 mt-1">✓</div>
                  <div>
                    <h4 className="font-semibold">Increased Revenue</h4>
                    <p className="text-gray-600">Better billing accuracy and collection</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-4 mt-1">✓</div>
                  <div>
                    <h4 className="font-semibold">ROI in 6 Months</h4>
                    <p className="text-gray-600">Quick return on investment</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Technology Stack */}
      <div className="py-16 px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">Built with Modern Technology</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-lg text-center">
              <div className="text-blue-600 text-5xl mb-4">⚛️</div>
              <h3 className="text-xl font-semibold mb-4">Next.js</h3>
              <p className="text-gray-600">Fast, modern web framework</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-lg text-center">
              <div className="text-blue-600 text-5xl mb-4">🗄️</div>
              <h3 className="text-xl font-semibold mb-4">PostgreSQL</h3>
              <p className="text-gray-600">Enterprise-grade database</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-lg text-center">
              <div className="text-blue-600 text-5xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold mb-4">Supabase</h3>
              <p className="text-gray-600">Secure, scalable backend</p>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="py-16 px-8 bg-blue-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Transform LASUTH?</h2>
          <p className="text-xl mb-8 opacity-90">
            Let's schedule a demonstration and discuss how our Hospital Management System
can improve efficiency and patient care at Lagos State University Teaching Hospital.
          </p>
          <div className="grid md:grid-cols-2 gap-8 mt-12">
            <div className="bg-blue-800 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Contact Developer</h3>
              <p className="mb-2">Olaitan Adewale</p>
              <p className="text-blue-200">Intern Medical Laboratory Scientist</p>
              <p className="text-blue-200 mt-2">📞 08168882014</p>
              <p className="text-blue-200">✉️ olaitanadewale@gmail.com</p>
            </div>
            <div className="bg-blue-800 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Live Demo</h3>
              <p className="mb-2">Try the system now</p>
              <div className="bg-blue-700 p-3 rounded mt-4">
                <p className="font-mono text-sm">www.lasuth-hms.vercel.app</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-8 px-8 bg-gray-900 text-white text-center">
        <p className="text-gray-400">
          Built with ❤️ by Olaitan Adewale - Intern Medical Laboratory Scientist, LASUTH
        </p>
      </div>
    </div>
  );
}