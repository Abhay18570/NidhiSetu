import { useLanguage } from '../i18n/useLanguage';
import Breadcrumbs from '../components/common/Breadcrumbs';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import { Shield, Target, Compass, CheckCircle2 } from 'lucide-react';

export default function AboutPage() {
  const { t } = useLanguage();

  const breadcrumbs = [
    { label: t('nav.about', 'About') }
  ];

  return (
    <div className="bg-[#F5F7FB] pb-16">
      <Breadcrumbs items={breadcrumbs} />

      {/* Page Header */}
      <div className="bg-white border-b border-[#D3DDEB] py-10 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl">
            <Badge variant="navy" size="md" className="mb-3">
              Institutional Framework
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0B1F54] tracking-tight">
              {t('about.title', 'About NidhiSetu')}
            </h1>
            <div className="h-1 w-16 bg-[#E89B24] rounded-full mt-3 mb-4" />
            <p className="text-base text-[#505F79] leading-relaxed">
              {t('about.subtitle', 'Bridging institutional compliance, regulatory governance, and banking authenticity through modern digital infrastructure.')}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 space-y-12">
        {/* Mission & Vision Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card highlightTop={true} highlightColor="blue" className="p-8">
            <div className="w-12 h-12 rounded-lg bg-[#E8F0FE] flex items-center justify-center mb-4 text-[#174EA6]">
              <Target className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-[#0B1F54] mb-3">
              {t('about.missionTitle', 'Our Mission')}
            </h2>
            <p className="text-sm text-[#505F79] leading-relaxed">
              {t('about.missionDesc')}
            </p>
          </Card>

          <Card highlightTop={true} highlightColor="saffron" className="p-8">
            <div className="w-12 h-12 rounded-lg bg-[#FEF7EC] flex items-center justify-center mb-4 text-[#E89B24]">
              <Compass className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-[#0B1F54] mb-3">
              {t('about.visionTitle', 'Our Vision')}
            </h2>
            <p className="text-sm text-[#505F79] leading-relaxed">
              {t('about.visionDesc')}
            </p>
          </Card>
        </div>

        {/* Regulatory Background Section */}
        <div className="bg-white rounded-xl border border-[#D3DDEB] p-8 gov-shadow-sm">
          <div className="max-w-3xl">
            <Badge variant="green" size="sm" className="mb-2">
              Statutory Context
            </Badge>
            <h2 className="text-2xl font-bold text-[#0B1F54] mb-4">
              The Institutional Mandate: Security Deposits & FDR Governance
            </h2>
            <p className="text-sm text-[#505F79] leading-relaxed mb-4">
              Under statutory regulations governing technical and higher educational institutions in India (such as AICTE Approval Process norms), every institution is required to create a security deposit in the form of a Fixed Deposit Receipt (FDR) issued by a Scheduled Commercial Bank. This deposit is pledged jointly to the regulatory authority to ensure student welfare, faculty commitments, and institutional financial stability.
            </p>
            <p className="text-sm text-[#505F79] leading-relaxed mb-6">
              Historically, paper-based FDR management presented severe operational challenges: manual courier transit of physical receipts, potential risk of counterfeit or tampered receipts, delays in bank branch confirmation, and accidental lapses in renewal tenures. NidhiSetu was conceptualized to resolve these vulnerabilities through a tamper-evident, automated verification bridge.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-slate-100">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#13805E] shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-[#0B1F54]">Zero Physical Loss</h3>
                <p className="text-xs text-[#505F79] mt-0.5">Completely eliminates loss of paper certificates in courier or storage archives.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#13805E] shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-[#0B1F54]">Automated Cross-Check</h3>
                <p className="text-xs text-[#505F79] mt-0.5">Instant comparison of deposit amount, lien endorsement, and bank branch IFSC.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#13805E] shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-[#0B1F54]">Pre-Emptive Renewals</h3>
                <p className="text-xs text-[#505F79] mt-0.5">Automated 90-day multi-channel notifications prevent lapsed security covenants.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Prototype Scope Advisory */}
        <div className="bg-[#FEF7EC] border border-[#E89B24]/40 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <Shield className="w-6 h-6 text-[#C67C11] shrink-0 mt-1" />
            <div>
              <h3 className="text-base font-bold text-[#0B1F54]">
                Prototype Evaluation & Research Initiative
              </h3>
              <p className="text-xs sm:text-sm text-[#505F79] mt-1 leading-relaxed">
                NidhiSetu is developed as an academic and technological architecture proof-of-concept. It demonstrates how modern AI OCR pipelines, structured regulatory workflows, and bank nodal gateways can be integrated without requiring modifications to existing core banking mainframes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
