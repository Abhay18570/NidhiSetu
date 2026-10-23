import Breadcrumbs from '../components/common/Breadcrumbs';
import Badge from '../components/common/Badge';
import Card from '../components/common/Card';

export function PrivacyPolicyPage() {
  const breadcrumbs = [{ label: 'Privacy Policy' }];

  return (
    <div className="bg-[#F5F7FB] pb-16">
      <Breadcrumbs items={breadcrumbs} />
      <div className="bg-white border-b border-[#D3DDEB] py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <Badge variant="blue" size="sm" className="mb-2">Compliance</Badge>
          <h1 className="text-3xl font-extrabold text-[#0B1F54]">Privacy Policy</h1>
          <div className="h-1 w-16 bg-[#E89B24] rounded-full mt-3 mb-4" />
          <p className="text-xs text-[#505F79]">Effective Date: October 2026 | Version: 1.0 (Prototype Specification)</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-10">
        <Card className="p-8 space-y-6 text-sm text-[#505F79] leading-relaxed">
          <div>
            <h2 className="text-base font-bold text-[#0B1F54] mb-2">1. Data Ingestion & Institutional Information</h2>
            <p>
              NidhiSetu processes institutional security deposit records including Fixed Deposit Receipt (FDR) certificates, bank covering letters, AISHE institute identification numbers, and contact information of authorized signatories (Principals, Registrars, and Financial Trustees).
            </p>
          </div>

          <div>
            <h2 className="text-base font-bold text-[#0B1F54] mb-2">2. Purpose of Processing</h2>
            <p>
              Collected deposit data is strictly processed for verifying compliance with statutory regulatory norms (e.g. AICTE Approval Process Handbook), calculating required reserve quotas, and alerting institutions of impending maturity dates to avoid forfeiture or affiliation suspension.
            </p>
          </div>

          <div>
            <h2 className="text-base font-bold text-[#0B1F54] mb-2">3. Cryptographic Storage & Encryption</h2>
            <p>
              Uploaded certificates are stored in encrypted object repositories using AES-256 encryption at rest. Every certificate undergoes cryptographic hashing (SHA-256) to ensure tamper detection and audit trail veracity.
            </p>
          </div>

          <div>
            <h2 className="text-base font-bold text-[#0B1F54] mb-2">4. Prototype Notice</h2>
            <p className="p-3 bg-[#FEF7EC] border border-[#E89B24]/40 rounded text-xs text-[#0B1F54]">
              This portal is currently operating in an evaluated prototype mode. No live production bank balances or commercial core banking credentials are accessible to third parties.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

export function TermsOfUsePage() {
  const breadcrumbs = [{ label: 'Terms of Use' }];

  return (
    <div className="bg-[#F5F7FB] pb-16">
      <Breadcrumbs items={breadcrumbs} />
      <div className="bg-white border-b border-[#D3DDEB] py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <Badge variant="navy" size="sm" className="mb-2">Legal</Badge>
          <h1 className="text-3xl font-extrabold text-[#0B1F54]">Terms of Use</h1>
          <div className="h-1 w-16 bg-[#E89B24] rounded-full mt-3 mb-4" />
          <p className="text-xs text-[#505F79]">Effective Date: October 2026 | Version: 1.0 (Prototype Specification)</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-10">
        <Card className="p-8 space-y-6 text-sm text-[#505F79] leading-relaxed">
          <div>
            <h2 className="text-base font-bold text-[#0B1F54] mb-2">1. Authorized Institutional Use</h2>
            <p>
              Access to the NidhiSetu portal is restricted to authorized representatives of educational institutions, accredited scheduled commercial bank nodal officers, and authorized regulatory scrutiny committees.
            </p>
          </div>

          <div>
            <h2 className="text-base font-bold text-[#0B1F54] mb-2">2. Authenticity Guarantee & Liability</h2>
            <p>
              Institutions are legally responsible for the genuineness of the uploaded Fixed Deposit Receipts. Submission of counterfeit, altered, or pre-encumbered deposit receipts is subject to disciplinary action under statutory regulations and relevant provisions of the Indian Penal Code.
            </p>
          </div>

          <div>
            <h2 className="text-base font-bold text-[#0B1F54] mb-2">3. Prototype Disclaimer</h2>
            <p className="p-3 bg-[#FEF7EC] border border-[#E89B24]/40 rounded text-xs text-[#0B1F54]">
              NidhiSetu is a prototype platform designed for research and institutional evaluation of AI-powered FDR verification. Not an official government domain.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

export function AccessibilityPage() {
  const breadcrumbs = [{ label: 'Accessibility Statement' }];

  return (
    <div className="bg-[#F5F7FB] pb-16">
      <Breadcrumbs items={breadcrumbs} />
      <div className="bg-white border-b border-[#D3DDEB] py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <Badge variant="green" size="sm" className="mb-2">GIGW & WCAG 2.1</Badge>
          <h1 className="text-3xl font-extrabold text-[#0B1F54]">Accessibility Statement</h1>
          <div className="h-1 w-16 bg-[#E89B24] rounded-full mt-3 mb-4" />
          <p className="text-xs text-[#505F79]">Compliance Target: WCAG 2.1 Level AA & Guidelines for Indian Government Websites (GIGW)</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-10">
        <Card className="p-8 space-y-6 text-sm text-[#505F79] leading-relaxed">
          <div>
            <h2 className="text-base font-bold text-[#0B1F54] mb-2">1. Accessibility Features Implemented</h2>
            <ul className="list-disc pl-5 space-y-1.5 text-xs">
              <li><strong>Skip Navigation:</strong> A direct keyboard anchor to skip utility bars and jump directly to primary page content.</li>
              <li><strong>Text Sizing:</strong> Working text-size scalers (A-, A, A+) allowing users to increase typography size up to 115%.</li>
              <li><strong>High Contrast Mode:</strong> Accessible high-contrast toggle for low-vision and visually impaired users.</li>
              <li><strong>Screen Reader Compliance:</strong> Semantic landmarks (&lt;header&gt;, &lt;nav&gt;, &lt;main&gt;, &lt;footer&gt;) and descriptive ARIA attributes.</li>
              <li><strong>Multilingual Devanagari Typography:</strong> Unicode fonts tailored for clear legibility in English, Hindi, and Marathi.</li>
              <li><strong>Visible Keyboard Focus:</strong> High-contrast focus rings on all interactive elements.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-base font-bold text-[#0B1F54] mb-2">2. Feedback & Accessibility Queries</h2>
            <p>
              If you experience any accessibility hurdles or require content in an alternative accessible format, please contact our accessibility coordinator via the Contact page or toll-free helpline at 1800-11-2255.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
