import { useLanguage } from '../i18n/useLanguage';
import Breadcrumbs from '../components/common/Breadcrumbs';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import {
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export default function HowItWorksPage() {
  const { t } = useLanguage();

  const breadcrumbs = [{ label: t('nav.howItWorks', 'How It Works') }];

  const detailedPhases = [
    {
      step: '01',
      title: 'Institutional Onboarding & Credential Verification',
      role: 'Educational Institution',
      timeframe: 'Day 0',
      description: 'The college or polytechnic registers using its verified AISHE (All India Survey on Higher Education) Code or AICTE Permanent Institute ID (PID). The Principal or Chairman provides authorized signatory documents, bank branch details, and active digital contact credentials.',
      checklist: [
        'AISHE / PID Code Authentication',
        'Trust/Society Registration Resolution copy',
        'Official email & phone OTP verification'
      ]
    },
    {
      step: '02',
      title: 'FDR Execution & Digital E-Filing',
      role: 'Institution & Scheduled Bank',
      timeframe: 'Day 1 - 3',
      description: 'The institution creates the Fixed Deposit with an RBI-approved Scheduled Commercial Bank. The deposit receipt is mandated jointly in the name of the Regional Officer and the Institution Head, incorporating the non-callable regulatory lien clause. A 300+ DPI scan is uploaded to NidhiSetu.',
      checklist: [
        'Joint account nomenclature strictly checked',
        'Bank branch covering letter attached',
        'Lien endorsement clearly stamped on FDR'
      ]
    },
    {
      step: '03',
      title: 'Automated AI Metadata Extraction & Fraud Detection',
      role: 'NidhiSetu AI Analysis Engine',
      timeframe: 'Instant (Under 60 seconds)',
      description: 'NidhiSetu Optical Character Recognition (OCR) extracts key metadata fields: FDR Number, Principal Amount, Date of Issue, Maturity Date, Interest Rate, and Branch IFSC. Cryptographic algorithms inspect the document for digital tampering, mismatched fonts, or manipulated numeric figures.',
      checklist: [
        'OCR text and amount cross-validation',
        'IFSC & branch MICR verification via RBI master directory',
        'SHA-256 tamper-evident integrity hash generation'
      ]
    },
    {
      step: '04',
      title: 'Issuing Bank Branch Nodal Scrutiny',
      role: 'Authorized Bank Branch Officer',
      timeframe: 'Day 3 - 5',
      description: 'A formal verification notification is routed to the designated branch manager or nodal desk of the issuing bank. The bank officer inspects their internal core banking ledger, confirms lien marking favoring the regulatory body, and logs electronic confirmation.',
      checklist: [
        'Branch ledger account balance confirmation',
        'Verification of non-encumbrance / no prior loan lien',
        'Electronic branch endorsement submitted'
      ]
    },
    {
      step: '05',
      title: 'Regulatory Officer Assessment & Certificate Issuance',
      role: 'AICTE / Statutory Scrutiny Officer',
      timeframe: 'Day 5 - 7',
      description: 'The regulatory scrutiny officer reviews the composite compliance dossier: AI extraction scores, bank branch confirmation, and institutional quota requirement. Upon satisfaction, a digitally signed FDR Acceptance Certificate with a cryptographically verifiable QR code is issued.',
      checklist: [
        'Normative deposit amount adequacy check',
        'Digital approval by Regional Officer',
        'QR-coded FDR Acceptance Certificate generated'
      ]
    },
    {
      step: '06',
      title: 'Continuous Lifecycle Monitoring & Auto-Renewals',
      role: 'NidhiSetu Automated Daemon',
      timeframe: 'Throughout Deposit Tenure (5-10 Years)',
      description: 'The platform continually monitors the deposit maturity calendar. If an FDR requires tenure renewal, multi-tiered escalation notices are dispatched 90, 60, and 30 days prior. Renewal deposit receipts follow the same expedited validation cycle.',
      checklist: [
        'Automated calendar tracking',
        'Multi-stage escalation alerts to Principal/Registrar',
        'Audit-ready ledger synchronization'
      ]
    }
  ];

  return (
    <div className="bg-[#F5F7FB] pb-16">
      <Breadcrumbs items={breadcrumbs} />

      {/* Page Header */}
      <div className="bg-white border-b border-[#D3DDEB] py-10 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <Badge variant="saffron" size="md" className="mb-3">
            Workflow Architecture
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0B1F54] tracking-tight">
            {t('how.title', 'How NidhiSetu Operates')}
          </h1>
          <div className="h-1 w-16 bg-[#E89B24] rounded-full mt-3 mb-4" />
          <p className="text-base text-[#505F79] leading-relaxed max-w-3xl">
            {t('how.subtitle', 'A transparent 6-stage lifecycle ensuring strict regulatory adherence and verifiable institutional financial solvency.')}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 space-y-12">
        {/* Statutory Bank Verification Notice */}
        <div className="bg-[#FEF7EC] border-l-4 border-[#E89B24] p-5 rounded-r-lg max-w-4xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-[#C67C11] shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#C67C11]">
                Essential Regulatory Instruction on Bank Confirmation
              </h3>
              <p className="text-xs sm:text-sm text-[#0B1F54] mt-1 leading-relaxed">
                Bank authenticity verification is not merely an algorithmic OCR check. By regulatory mandate, every FDR record must be formally confirmed by the issuing branch manager of the Scheduled Commercial Bank. This guarantees that funds have not been liquidated or pledged elsewhere.
              </p>
            </div>
          </div>
        </div>

        {/* 6 Lifecycle Phases Detailed Timeline */}
        <div className="space-y-6">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold text-[#0B1F54]">
              Six-Phase Deposit Governance Lifecycle
            </h2>
            <p className="text-sm text-[#505F79] mt-1">
              Follow the end-to-end progression of an institutional deposit from initial filing to continuous maturity monitoring.
            </p>
          </div>

          <div className="space-y-4">
            {detailedPhases.map((phase) => (
              <div
                key={phase.step}
                className="bg-white rounded-xl border border-[#D3DDEB] p-6 gov-shadow-sm flex flex-col md:flex-row gap-6 items-start hover:border-[#174EA6] transition-colors"
              >
                {/* Step badge */}
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-14 h-14 rounded-xl bg-[#0B1F54] text-white flex items-center justify-center font-mono font-extrabold text-xl shadow-sm">
                    {phase.step}
                  </div>
                  <span className="text-[0.625rem] font-bold text-[#174EA6] mt-2 font-mono bg-[#E8F0FE] px-2 py-0.5 rounded">
                    {phase.timeframe}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-lg font-bold text-[#0B1F54]">
                      {phase.title}
                    </h3>
                    <Badge variant="blue" size="sm">
                      {phase.role}
                    </Badge>
                  </div>

                  <p className="text-xs sm:text-sm text-[#505F79] leading-relaxed">
                    {phase.description}
                  </p>

                  <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-x-6 gap-y-2">
                    {phase.checklist.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-xs text-[#0B1F54] font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#13805E] shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Gateway */}
        <div className="bg-[#0B1F54] text-white rounded-xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-left">
            <h3 className="text-xl font-bold">Ready to Submit or Verify an FDR?</h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Access the dedicated portal for your institutional role to submit documents, review pending scrutiny files, or audit compliance status.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Button to="/login" variant="saffron" size="lg" className="font-bold">
              Access Portal
            </Button>
            <Button to="/faq" variant="secondary" size="lg" className="font-medium bg-white/10 text-white border-white/20 hover:bg-white/20">
              View FAQs
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
