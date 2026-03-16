import Link from "next/link";

export default function DocumentsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-16 px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            LASUTH HMS Documentation
          </h1>
          <p className="text-xl text-gray-600">
            Professional documents for the Hospital Management System
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Pitch Deck Card */}
          <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Pitch Deck
              </h2>
              <p className="text-gray-600 mb-6">
                A compelling presentation showcasing the LASUTH Hospital Management System 
                features, benefits, and value proposition for stakeholders.
              </p>
              <Link 
                href="/pitch-deck"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Pitch Deck
              </Link>
              <div className="mt-4 text-sm text-gray-500">
                <p>💡 Tip: Use Ctrl+P to print this document</p>
              </div>
            </div>
          </div>

          {/* Proposal Card */}
          <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📋</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Formal Proposal
              </h2>
              <p className="text-gray-600 mb-6">
                A comprehensive proposal document addressed to the Chief Medical Director, 
                detailing the system specifications, implementation plan, and cost-benefit analysis.
              </p>
              <Link 
                href="/proposal"
                className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
              >
                View Proposal
              </Link>
              <div className="mt-4 text-sm text-gray-500">
                <p>💡 Tip: Use Ctrl+P to print this document</p>
              </div>
            </div>
          </div>
        </div>

        {/* Developer Information */}
        <div className="mt-12 bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              System Developer
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="font-semibold text-gray-800">Olaitan Adewale</p>
                <p className="text-gray-600">Intern Medical Laboratory Scientist</p>
                <p className="text-gray-600">LASUTH</p>
              </div>
              <div>
                <p className="text-gray-600">📞 08168882014</p>
                <p className="text-gray-600">✉️ olaitanadewale@gmail.com</p>
                <p className="text-gray-600">🌐 www.lasuth-hms.vercel.app</p>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            How to Use These Documents
          </h3>
          <ul className="text-blue-800 space-y-2">
            <li>• Click on "View Pitch Deck" or "View Proposal" to open the documents</li>
            <li>• Use Ctrl+P (Windows) or Cmd+P (Mac) to print the documents</li>
            <li>• Both documents are optimized for professional printing</li>
            <li>• The pitch deck is ideal for presentations and stakeholder meetings</li>
            <li>• The proposal is formatted for formal submission to management</li>
          </ul>
        </div>
      </div>
    </div>
  );
}