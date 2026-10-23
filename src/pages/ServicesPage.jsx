import { useState } from 'react';
import { useLanguage } from '../i18n/useLanguage';
import Breadcrumbs from '../components/common/Breadcrumbs';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import {
  FileUp,
  ShieldCheck,
  Scale,
  BellRing,
  Search,
  FileSpreadsheet,
  CheckCircle,
  Clock
} from 'lucide-react';

export default function ServicesPage() {
  const { t } = useLanguage();
  const [testArn, setTestArn] = useState('ARN-2026-981240');
  const [lookupResult, setLookupResult] = useState(null);

  const breadcrumbs = [{ label: t('nav.services', 'Services') }];

  const handleLookup = (e) => {
    e.preventDefault();
    if (!testArn.trim()) return;

    // Realistic demonstration simulation based on input
    setLookupResult({
      arn: testArn.trim().toUpperCase(),
      institutionName: 'Bharati Vidyapeeth Institute of Technology (PID: 1-4920194)',
      fdrNumber: 'FDR-SBI-77291048',
      depositAmount: '₹ 35,00,000 /-',
      issuingBank: 'State Bank of India, Branch Code 04021',
      submissionDate: '12 Oct 2026',
      status: 'Bank Branch Confirmed — Under Final Regional Scrutiny',
      statusCode: 'STAGE_4',
      steps: [
        { name: 'Application E-Filed', status: 'completed', date: '12 Oct 2026, 11:30 AM' },
        { name: 'OCR Metadata Extraction', status: 'completed', date: '12 Oct 2026, 11:32 AM' },
        { name: 'Bank Branch Dispatch & Confirmation', status: 'completed', date: '14 Oct 2026, 04:15 PM' },
        { name: 'Regional Scrutiny Officer Assessment', status: 'current', date: 'In Progress' },
        { name: 'Digital Acceptance Certificate Issuance', status: 'pending', date: 'Awaiting Assessment' }
      ]
    });
  };

  const detailedServices = [
    {
      id: 'fdr-submission',
      icon: FileUp,
      title: t('services.s1.title', 'FDR Submission'),
      badge: 'Module 01: Ingestion',
      desc: t('services.s1.desc'),
      features: [
        'High-resolution PDF/JPEG scan upload (minimum 300 DPI)',
        'Automated OCR extraction of Deposit Number, Amount, Tenure, and Maturity Date',
        'Mandatory validation of Joint Lien clause favoring AICTE / Regulatory Officer',
        'Instant generation of a 12-digit Application Reference Number (ARN)'
      ],
      turnaround: 'Instant Receipt Acknowledgement'
    },
    {
      id: 'document-verification',
      icon: ShieldCheck,
      title: t('services.s2.title', 'Document Verification'),
      badge: 'Module 02: Verification',
      desc: t('services.s2.desc'),
      features: [
        'Algorithmic check against known scheduled bank format templates',
        'Official branch IFSC and MICR reconciliation against RBI master directory',
        'Bank Branch Nodal Officer digital confirmation via secure tokenized link',
        'Tamper-evident SHA-256 document hashing'
      ],
      turnaround: '24 to 48 Hours for Bank Branch Confirmation'
    },
    {
      id: 'compliance-monitoring',
      icon: Scale,
      title: t('services.s3.title', 'Compliance Monitoring'),
      badge: 'Module 03: Compliance',
      desc: t('services.s3.desc'),
      features: [
        'Automated comparison of pledged deposit amount against statutory required norms',
        'Deficit calculation for multi-program institutions (Engineering, Pharmacy, Management)',
        'Unencumbered status monitoring (no unauthorized loans or overdrafts against FDR)',
        'Automated institutional compliance score updated each financial cycle'
      ],
      turnaround: 'Continuous 24/7 Monitoring'
    },
    {
      id: 'maturity-alerts',
      icon: BellRing,
      title: t('services.s4.title', 'Maturity & Renewal Alerts'),
      badge: 'Module 04: Renewal',
      desc: t('services.s4.desc'),
      features: [
        'Proactive escalation alerts triggered at 90, 60, 30, and 15 days before maturity',
        'Multi-channel dispatch: SMS and official email to Principal, Chairman, and Registrar',
        'Streamlined renewal endorsement filing workflow to prevent regulatory lapses',
        'Auto-escalation to Regional Director if unrenewed within 15 days of maturity'
      ],
      turnaround: 'Multi-Stage Scheduled Automated Alerts'
    },
    {
      id: 'application-tracking',
      icon: Search,
      title: t('services.s5.title', 'Application Tracking'),
      badge: 'Module 05: Tracking',
      desc: t('services.s5.desc'),
      features: [
        'Public tracking portal accessible via unique Application Reference Number (ARN)',
        'Milestone-by-milestone progress tracking across all 5 verification phases',
        'Granular status history showing exact scrutiny officer remarks and timestamps',
        'Instant download of digital FDR Acceptance Certificate with QR verification code'
      ],
      turnaround: 'Real-Time Status Queries'
    },
    {
      id: 'admin-reporting',
      icon: FileSpreadsheet,
      title: t('services.s6.title', 'Administrative Reporting'),
      badge: 'Module 06: Analytics',
      desc: t('services.s6.desc'),
      features: [
        'Audit-ready ledger exports for Comptroller & Auditor General (CAG) compliance',
        'State-wise and Region-wise security deposit aggregation matrices',
        'Institution financial solvency health digests for Approval Bureau meetings',
        'Bank-wise deposit concentration analysis across scheduled commercial banks'
      ],
      turnaround: 'On-Demand Export & Daily Digests'
    }
  ];

  return (
    <div className="bg-[#F5F7FB] pb-16">
      <Breadcrumbs items={breadcrumbs} />

      {/* Page Header */}
      <div className="bg-white border-b border-[#D3DDEB] py-10 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <Badge variant="blue" size="md" className="mb-3">
            Digital Architecture
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0B1F54] tracking-tight">
            {t('services.title', 'Comprehensive Deposit Lifecycle Services')}
          </h1>
          <div className="h-1 w-16 bg-[#E89B24] rounded-full mt-3 mb-4" />
          <p className="text-base text-[#505F79] leading-relaxed max-w-3xl">
            {t('services.subtitle', 'Standardized digital infrastructure engineered for academic institutions, regulatory authorities, and scheduled banks.')}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 space-y-12">
        {/* Interactive ARN Application Tracking Showcase */}
        <div className="bg-white rounded-xl border border-[#D3DDEB] p-6 sm:p-8 gov-shadow-sm">
          <div className="max-w-2xl mb-6">
            <Badge variant="navy" size="sm" className="mb-2">
              Public Service Utility
            </Badge>
            <h2 className="text-xl font-bold text-[#0B1F54]">
              Track Institutional FDR Application
            </h2>
            <p className="text-xs sm:text-sm text-[#505F79] mt-1">
              Enter any 12-digit Application Reference Number (ARN) to inspect verification progression. For demonstration, click Search to test with the prototype sample.
            </p>
          </div>

          <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-3 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={testArn}
                onChange={(e) => setTestArn(e.target.value)}
                placeholder="e.g. ARN-2026-981240"
                className="w-full pl-10 pr-4 py-2.5 bg-[#F5F7FB] border border-[#D3DDEB] rounded-lg text-sm font-mono text-[#0B1F54] focus:outline-none focus:ring-2 focus:ring-[#174EA6]"
                aria-label="Application Reference Number"
              />
            </div>
            <Button type="submit" variant="royal" size="md" className="font-semibold shrink-0">
              Check Status
            </Button>
          </form>

          {/* Demonstration Result Card */}
          {lookupResult && (
            <div className="mt-6 pt-6 border-t border-slate-200 animate-in fade-in duration-200">
              <div className="bg-[#F5F7FB] border border-[#B5C7DF] rounded-lg p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3 mb-4">
                  <div>
                    <span className="text-xs text-[#505F79]">Reference No: </span>
                    <span className="font-mono font-bold text-[#0B1F54] text-sm">{lookupResult.arn}</span>
                  </div>
                  <Badge variant="blue" size="sm">
                    {lookupResult.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs mb-6">
                  <div>
                    <div className="text-[#505F79]">Institution:</div>
                    <div className="font-semibold text-[#0B1F54]">{lookupResult.institutionName}</div>
                  </div>
                  <div>
                    <div className="text-[#505F79]">Deposit Receipt No:</div>
                    <div className="font-semibold text-[#0B1F54]">{lookupResult.fdrNumber}</div>
                  </div>
                  <div>
                    <div className="text-[#505F79]">Deposit Amount:</div>
                    <div className="font-bold text-[#13805E]">{lookupResult.depositAmount}</div>
                  </div>
                  <div>
                    <div className="text-[#505F79]">Issuing Bank Branch:</div>
                    <div className="font-semibold text-[#0B1F54]">{lookupResult.issuingBank}</div>
                  </div>
                </div>

                {/* Progress Steps */}
                <div className="space-y-3 pt-3 border-t border-slate-200">
                  <div className="text-xs font-bold text-[#0B1F54]">Lifecycle Milestones:</div>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    {lookupResult.steps.map((st, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-lg border text-xs ${
                          st.status === 'completed'
                            ? 'bg-[#E6F4EA] border-[#13805E]/30 text-[#13805E]'
                            : st.status === 'current'
                            ? 'bg-[#FEF7EC] border-[#E89B24] text-[#C67C11] font-semibold ring-1 ring-[#E89B24]'
                            : 'bg-white border-slate-200 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 font-bold">
                          {st.status === 'completed' && <CheckCircle className="w-3.5 h-3.5" />}
                          {st.status === 'current' && <Clock className="w-3.5 h-3.5 animate-spin" />}
                          <span>Stage 0{i + 1}</span>
                        </div>
                        <div className="text-[11px] leading-tight text-[#0B1F54] font-medium">{st.name}</div>
                        <div className="text-[10px] text-[#505F79] mt-1">{st.date}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Detailed Service Specifications Grid */}
        <div className="space-y-8">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold text-[#0B1F54]">
              Service Specifications & Operational Norms
            </h2>
            <p className="text-sm text-[#505F79] mt-1">
              Detailed technical blueprints and compliance covenants governing each platform module.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {detailedServices.map((svc) => {
              const Icon = svc.icon;
              return (
                <div
                  key={svc.id}
                  id={svc.id}
                  className="bg-white rounded-xl border border-[#D3DDEB] p-6 gov-shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-lg bg-[#E8F0FE] text-[#174EA6] flex items-center justify-center">
                        <Icon className="w-6 h-6" />
                      </div>
                      <Badge variant="navy" size="sm">
                        {svc.badge}
                      </Badge>
                    </div>

                    <h3 className="text-lg font-bold text-[#0B1F54] mb-2">
                      {svc.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-[#505F79] mb-4 leading-relaxed">
                      {svc.desc}
                    </p>

                    <div className="space-y-2 mb-6">
                      <div className="text-xs font-bold text-[#0B1F54] uppercase tracking-wider">
                        Key Capabilities:
                      </div>
                      {svc.features.map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-[#505F79]">
                          <CheckCircle className="w-3.5 h-3.5 text-[#13805E] shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[#505F79]">SLA Standard:</span>
                    <span className="font-semibold text-[#0B1F54]">{svc.turnaround}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
