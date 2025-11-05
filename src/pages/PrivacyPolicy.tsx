import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/contexts/SettingsContext";

const PrivacyPolicy = () => {
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
            <h1 className="text-2xl font-bold text-gray-900">Privacy Policy</h1>
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
            <h2 className="text-xl font-semibold text-gray-900">1. Introduction</h2>
            <p className="text-gray-700 leading-relaxed">
              At {websiteName}, we are committed to protecting your privacy and maintaining the confidentiality 
              of your personal and financial information. This Privacy Policy explains how we collect, use, 
              disclose, and safeguard your information when you use our banking services.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">2. Information We Collect</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Personal Information</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Name, address, phone number, and email address</li>
                  <li>Date of birth and Social Security number</li>
                  <li>Government-issued identification documents</li>
                  <li>Employment and income information</li>
                  <li>Financial account information</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Transaction Information</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Account balances and transaction history</li>
                  <li>Payment and transfer details</li>
                  <li>Bill payment information</li>
                  <li>Credit and debit card usage</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Technical Information</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>IP address and device information</li>
                  <li>Browser type and operating system</li>
                  <li>Login times and session data</li>
                  <li>Cookies and similar tracking technologies</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">3. How We Use Your Information</h2>
            <div className="space-y-3 text-gray-700 leading-relaxed">
              <p>We use your information to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide and maintain your banking accounts and services</li>
                <li>Process transactions and payments</li>
                <li>Verify your identity and prevent fraud</li>
                <li>Comply with legal and regulatory requirements</li>
                <li>Communicate with you about your accounts and services</li>
                <li>Improve our services and develop new products</li>
                <li>Provide customer support</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">4. Information Sharing and Disclosure</h2>
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                We do not sell, rent, or trade your personal information. We may share your information in 
                the following circumstances:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Service Providers:</strong> With trusted third parties who assist us in operating our services</li>
                <li><strong>Legal Requirements:</strong> When required by law, regulation, or legal process</li>
                <li><strong>Fraud Prevention:</strong> To prevent, detect, or investigate fraud or security issues</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
                <li><strong>With Your Consent:</strong> When you explicitly authorize us to share your information</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">5. Data Security</h2>
            <div className="space-y-3 text-gray-700 leading-relaxed">
              <p>We implement comprehensive security measures to protect your information:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>256-bit SSL encryption for all data transmission</li>
                <li>Multi-factor authentication for account access</li>
                <li>Regular security audits and penetration testing</li>
                <li>Secure data centers with 24/7 monitoring</li>
                <li>Employee training on data protection and privacy</li>
                <li>Compliance with industry security standards</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">6. Your Privacy Rights</h2>
            <div className="space-y-3 text-gray-700 leading-relaxed">
              <p>You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access and review your personal information</li>
                <li>Request corrections to inaccurate information</li>
                <li>Opt-out of certain communications</li>
                <li>Request deletion of your information (subject to legal requirements)</li>
                <li>Receive a copy of your information in a portable format</li>
                <li>File a complaint with regulatory authorities</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">7. Cookies and Tracking Technologies</h2>
            <p className="text-gray-700 leading-relaxed">
              We use cookies and similar technologies to enhance your experience, analyze usage patterns, 
              and improve our services. You can control cookie settings through your browser, but disabling 
              cookies may affect the functionality of our services.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">8. Data Retention</h2>
            <p className="text-gray-700 leading-relaxed">
              We retain your information for as long as necessary to provide our services and comply with 
              legal obligations. Account information is typically retained for seven years after account 
              closure, as required by banking regulations.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">9. International Data Transfers</h2>
            <p className="text-gray-700 leading-relaxed">
              Your information may be transferred to and processed in countries other than your country of 
              residence. We ensure appropriate safeguards are in place to protect your information during 
              such transfers, in compliance with applicable data protection laws.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">10. Children's Privacy</h2>
            <p className="text-gray-700 leading-relaxed">
              Our services are not intended for individuals under 18 years of age. We do not knowingly 
              collect personal information from children under 18. If we become aware that we have 
              collected such information, we will take steps to delete it promptly.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">11. Changes to This Privacy Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy from time to time to reflect changes in our practices or 
              applicable laws. We will notify you of material changes through our website or by email. 
              Your continued use of our services constitutes acceptance of the updated policy.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">12. Contact Us</h2>
            <div className="text-gray-700 leading-relaxed space-y-2">
              <p>If you have questions about this Privacy Policy or our privacy practices, please contact us:</p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p><strong>{websiteName} Privacy Office</strong></p>
                <p>Email: privacy@securebank.com</p>
                <p>Phone: 1-800-SECUREBANK</p>
                <p>Address: 123 Financial District, New York, NY 10001</p>
                <p>Privacy Officer: privacy-officer@securebank.com</p>
              </div>
            </div>
          </section>

          <div className="border-t pt-6 mt-8">
            <p className="text-sm text-gray-500">
              By using BankWeave's services, you acknowledge that you have read and understood this 
              Privacy Policy and consent to the collection, use, and disclosure of your information 
              as described herein.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
