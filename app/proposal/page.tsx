import Image from "next/image";

export default function ProposalPage() {
  return (
    <div className="min-h-screen bg-white print:bg-white">
      {/* Letterhead */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white py-8 px-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">HOSPITAL MANAGEMENT SYSTEM</h1>
              <p className="text-blue-200">Lagos State University Teaching Hospital</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-200">Date: March 16, 2026</p>
              <p className="text-sm text-blue-200">Proposal ID: LASUTH-HMS-2026</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recipient */}
      <div className="py-8 px-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <p className="font-semibold">The Chief Medical Director</p>
            <p className="font-semibold">Lagos State University Teaching Hospital</p>
            <p>Ikeja, Lagos State</p>
          </div>

          <div className="mb-8">
            <p className="font-semibold">Subject: Proposal for Implementation of Hospital Management System</p>
            <p className="font-semibold">Dear Sir,</p>
          </div>

          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed mb-6">
              I am writing to formally propose the implementation of a comprehensive Hospital Management System 
              specifically designed and developed for Lagos State University Teaching Hospital (LASUTH). As an 
              Intern Medical Laboratory Scientist currently serving at this esteemed institution, I have had 
              the privilege of witnessing firsthand the operational challenges and opportunities that exist 
              within our healthcare delivery system.
            </p>

            <p className="text-gray-700 leading-relaxed mb-6">
              This proposal outlines a modern, cloud-based Hospital Management System that addresses the 
              critical needs of our institution while positioning LASUTH as a leader in healthcare technology 
              adoption within Nigeria's public healthcare sector.
            </p>
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="py-8 px-12 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b-2 border-blue-900 pb-2">EXECUTIVE SUMMARY</h2>
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed mb-4">
              The LASUTH Hospital Management System represents a transformative solution designed to modernize 
              healthcare delivery, streamline administrative processes, and enhance patient care quality. This 
              comprehensive system has been specifically tailored to meet the unique operational requirements 
              of Lagos State University Teaching Hospital.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              The system is currently operational and accessible at <strong>www.lasuth-hms.vercel.app</strong>, 
              demonstrating its readiness for immediate deployment and scalability to handle the institution's 
              growing needs.
            </p>
          </div>
        </div>
      </div>

      {/* Current Challenges */}
      <div className="py-8 px-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b-2 border-blue-900 pb-2">CURRENT OPERATIONAL CHALLENGES</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4 text-red-700">Administrative Inefficiencies</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  Manual patient record management leading to delays
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  Paper-based appointment scheduling systems
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  Fragmented billing and payment processes
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  Limited real-time data access across departments
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 text-red-700">Patient Experience Issues</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  Extended waiting times for services
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  Difficulty in accessing medical history
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  Inefficient lab test request and result delivery
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  Limited communication between departments
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Proposed Solution */}
      <div className="py-8 px-12 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b-2 border-blue-900 pb-2">PROPOSED SOLUTION</h2>
          <div className="bg-blue-50 p-8 rounded-lg mb-8">
            <h3 className="text-xl font-bold mb-4 text-blue-900">LASUTH Hospital Management System</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              A comprehensive, cloud-based Hospital Management System designed specifically for LASUTH's 
              operational environment. The system addresses all identified challenges while providing 
              additional capabilities to position LASUTH as a technology leader in healthcare delivery.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h4 className="text-lg font-semibold mb-4 text-green-700">Core Modules</h4>
              <ul className="space-y-2 text-gray-700">
                <li>• Patient Registration and Management</li>
                <li>• Appointment Scheduling System</li>
                <li>• Electronic Medical Records</li>
                <li>• Billing and Payment Processing</li>
                <li>• Laboratory Test Management</li>
                <li>• Pharmacy Inventory Control</li>
                <li>• Staff Management System</li>
              </ul>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h4 className="text-lg font-semibold mb-4 text-green-700">Advanced Features</h4>
              <ul className="space-y-2 text-gray-700">
                <li>• Real-time Analytics Dashboard</li>
                <li>• Multi-department Integration</li>
                <li>• Secure Data Encryption</li>
                <li>• Mobile-responsive Interface</li>
                <li>• Automated Reporting System</li>
                <li>• Role-based Access Control</li>
                <li>• Cloud-based Data Backup</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Technical Specifications */}
      <div className="py-8 px-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b-2 border-blue-900 pb-2">TECHNICAL SPECIFICATIONS</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h4 className="font-semibold mb-3 text-blue-900">Frontend Technology</h4>
              <p className="text-gray-700 text-sm mb-2">Next.js with React Server Components</p>
              <p className="text-gray-700 text-sm mb-2">TypeScript for type safety</p>
              <p className="text-gray-700 text-sm">Tailwind CSS for responsive design</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h4 className="font-semibold mb-3 text-blue-900">Backend Infrastructure</h4>
              <p className="text-gray-700 text-sm mb-2">PostgreSQL database</p>
              <p className="text-gray-700 text-sm mb-2">Supabase for authentication</p>
              <p className="text-gray-700 text-sm">Server Actions for data operations</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h4 className="font-semibold mb-3 text-blue-900">Security Features</h4>
              <p className="text-gray-700 text-sm mb-2">End-to-end encryption</p>
              <p className="text-gray-700 text-sm mb-2">Role-based access control</p>
              <p className="text-gray-700 text-sm">Regular security audits</p>
            </div>
          </div>
        </div>
      </div>

      {/* Implementation Timeline */}
      <div className="py-8 px-12 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b-2 border-blue-900 pb-2">IMPLEMENTATION TIMELINE</h2>
          <div className="space-y-6">
            <div className="flex items-start">
              <div className="bg-blue-900 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-4 mt-1">1</div>
              <div className="flex-1">
                <h4 className="font-semibold text-lg">Phase 1: System Deployment (Week 1-2)</h4>
                <p className="text-gray-700">Server setup, database configuration, and initial system deployment</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-blue-900 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-4 mt-1">2</div>
              <div className="flex-1">
                <h4 className="font-semibold text-lg">Phase 2: Staff Training (Week 3-4)</h4>
                <p className="text-gray-700">Comprehensive training sessions for all department staff</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-blue-900 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-4 mt-1">3</div>
              <div className="flex-1">
                <h4 className="font-semibold text-lg">Phase 3: Pilot Testing (Week 5-6)</h4>
                <p className="text-gray-700">Limited deployment with selected departments for testing and feedback</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-blue-900 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-4 mt-1">4</div>
              <div className="flex-1">
                <h4 className="font-semibold text-lg">Phase 4: Full Deployment (Week 7-8)</h4>
                <p className="text-gray-700">Complete system rollout across all departments</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cost-Benefit Analysis */}
      <div className="py-8 px-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b-2 border-blue-900 pb-2">COST-BENEFIT ANALYSIS</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-red-50 p-6 rounded-lg">
              <h4 className="font-semibold mb-4 text-red-700">Current Costs (Annual)</h4>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li>• Paper and printing supplies: ₦2,000,000</li>
                <li>• Manual processing labor: ₦5,000,000</li>
                <li>• Storage and filing systems: ₦1,000,000</li>
                <li>• Error correction and rework: ₦1,500,000</li>
                <li className="font-semibold border-t pt-2">Total: ₦9,500,000</li>
              </ul>
            </div>
            <div className="bg-green-50 p-6 rounded-lg">
              <h4 className="font-semibold mb-4 text-green-700">Projected Savings (Annual)</h4>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li>• Reduced paper usage: ₦1,800,000</li>
                <li>• Improved staff efficiency: ₦4,000,000</li>
                <li>• Reduced storage needs: ₦900,000</li>
                <li>• Fewer errors and rework: ₦1,200,000</li>
                <li className="font-semibold border-t pt-2">Total: ₦7,900,000</li>
              </ul>
            </div>
          </div>
          <div className="bg-blue-50 p-6 rounded-lg mt-6">
            <h4 className="font-semibold text-blue-900 mb-2">Return on Investment</h4>
            <p className="text-gray-700">The system will pay for itself within 6 months of full implementation through operational savings and efficiency gains.</p>
          </div>
        </div>
      </div>

      {/* Conclusion */}
      <div className="py-8 px-12 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b-2 border-blue-900 pb-2">CONCLUSION AND NEXT STEPS</h2>
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed mb-4">
              The LASUTH Hospital Management System represents a significant opportunity to modernize 
              healthcare delivery at our institution. With its proven technology stack, comprehensive 
              feature set, and immediate availability, this system can transform our operational efficiency 
              and patient care quality.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              I am committed to ensuring the successful implementation of this system and am prepared to 
              provide ongoing support and customization to meet LASUTH's specific requirements. The 
              system is ready for demonstration and immediate deployment.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              I respectfully request your consideration of this proposal and would welcome the opportunity 
              to present a detailed demonstration of the system's capabilities to your management team.
            </p>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="py-8 px-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-blue-900 text-white p-8 rounded-lg">
            <h3 className="text-xl font-bold mb-4">Contact Information</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="mb-2"><strong>Developer:</strong> Olaitan Adewale</p>
                <p className="mb-2"><strong>Position:</strong> Intern Medical Laboratory Scientist</p>
                <p className="mb-2"><strong>Institution:</strong> LASUTH</p>
              </div>
              <div>
                <p className="mb-2"><strong>Phone:</strong> 08168882014</p>
                <p className="mb-2"><strong>Email:</strong> olaitanadewale@gmail.com</p>
                <p className="mb-2"><strong>System Demo:</strong> www.lasuth-hms.vercel.app</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-6 px-12 bg-gray-900 text-white text-center">
        <p className="text-sm text-gray-400">
          This proposal is submitted by Olaitan Adewale, Intern Medical Laboratory Scientist, LASUTH
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Proposal Date: March 16, 2026 | System Available at: www.lasuth-hms.vercel.app
        </p>
      </div>
    </div>
  );
}