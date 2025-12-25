import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/contexts/SettingsContext";

const TermsAndConditions = () => {
  const navigate = useNavigate();
  const { websiteName } = useSettings();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/signup')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Terms and Conditions</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          <div className="text-sm text-gray-600 mb-6">
            <p><strong>Effective Date:</strong> January 1, 2024</p>
            <p><strong>Last Updated:</strong> January 1, 2024</p>
          </div>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">1. Acceptance of Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              By accessing and using {websiteName}'s services, you acknowledge that you have read, understood, 
              and agree to be bound by these Terms and Conditions. If you do not agree to these terms, 
              please do not use our services.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">2. Account Registration</h2>
            <div className="space-y-3 text-gray-700 leading-relaxed">
              <p>To use our banking services, you must:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Be at least 18 years of age</li>
                <li>Provide accurate and complete information during registration</li>
                <li>Maintain the confidentiality of your account credentials</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
                <li>Comply with all applicable laws and regulations</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">3. Banking Services</h2>
            <div className="space-y-3 text-gray-700 leading-relaxed">
              <p>{websiteName} provides various financial services including but not limited to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Checking and savings accounts</li>
                <li>Money transfers and payments</li>
                <li>Bill payment services</li>
                <li>Account statements and transaction history</li>
                <li>Customer support services</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">4. Fees and Charges</h2>
            <p className="text-gray-700 leading-relaxed">
              Fees for our services are disclosed in our fee schedule, which is available upon request. 
              We reserve the right to modify fees with appropriate notice as required by law. You agree 
              to pay all applicable fees and charges incurred in connection with your use of our services.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">5. Security and Privacy</h2>
            <p className="text-gray-700 leading-relaxed">
              We implement industry-standard security measures to protect your personal and financial 
              information. However, you are responsible for maintaining the security of your login 
              credentials and for all activities that occur under your account.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">6. Prohibited Activities</h2>
            <div className="space-y-3 text-gray-700 leading-relaxed">
              <p>You agree not to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Use our services for any illegal or unauthorized purpose</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with or disrupt our services</li>
                <li>Transmit viruses or malicious code</li>
                <li>Violate any applicable laws or regulations</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">7. Limitation of Liability</h2>
            <p className="text-gray-700 leading-relaxed">
              {websiteName}'s liability is limited to the extent permitted by law. We are not liable for 
              indirect, incidental, special, or consequential damages arising from your use of our services. 
              Our total liability shall not exceed the amount of fees paid by you in the twelve months 
              preceding the claim.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">8. Account Termination</h2>
            <p className="text-gray-700 leading-relaxed">
              We may terminate or suspend your account at any time for violation of these terms or for 
              any other reason deemed necessary for the protection of our services or other users. You 
              may close your account at any time by contacting customer service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">9. Dispute Resolution</h2>
            <p className="text-gray-700 leading-relaxed">
              Any disputes arising from these terms or your use of our services will be resolved through 
              binding arbitration in accordance with the rules of the American Arbitration Association. 
              You waive any right to participate in class action lawsuits or class-wide arbitration.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">10. Changes to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to modify these Terms and Conditions at any time. We will notify you 
              of significant changes through our website or by email. Your continued use of our services 
              after such modifications constitutes acceptance of the updated terms.
            </p>
          </section>



          <div className="border-t pt-6 mt-8">
            <p className="text-sm text-gray-500">
              By using {websiteName}'s services, you acknowledge that you have read and understood these 
              Terms and Conditions and agree to be bound by them.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
