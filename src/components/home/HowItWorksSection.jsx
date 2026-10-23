import { useLanguage } from '../../i18n/useLanguage';
import SectionHeading from '../common/SectionHeading';
import {
  UserCheck,
  Upload,
  Cpu,
  Building,
  CheckCircle2,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export default function HowItWorksSection() {
  const { t } = useLanguage();

  const steps = [
    {
      num: t('how.step1.num'),
      icon: UserCheck,
      title: t('how.step1.title'),
      desc: t('how.step1.desc'),
    },
    {
      num: t('how.step2.num'),
      icon: Upload,
      title: t('how.step2.title'),
      desc: t('how.step2.desc'),
    },
    {
      num: t('how.step3.num'),
      icon: Cpu,
      title: t('how.step3.title'),
      desc: t('how.step3.desc'),
    },
    {
      num: t('how.step4.num'),
      icon: Building,
      title: t('how.step4.title'),
      desc: t('how.step4.desc'),
    },
    {
      num: t('how.step5.num'),
      icon: CheckCircle2,
      title: t('how.step5.title'),
      desc: t('how.step5.desc'),
    },
    {
      num: t('how.step6.num'),
      icon: RefreshCw,
      title: t('how.step6.title'),
      desc: t('how.step6.desc'),
    },
  ];

  return (
    <section id="how-it-works" className="py-16 sm:py-20 bg-white border-y border-[#D3DDEB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <SectionHeading
          badge={t('how.badge')}
          title={t('how.title')}
          subtitle={t('how.subtitle')}
        />

        {/* Mandatory Regulatory & Banking Notice Box */}
        <div className="mb-12 p-4 bg-[#FEF7EC] border-l-4 border-[#E89B24] rounded-r-lg max-w-4xl mx-auto">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#C67C11] shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#C67C11]">
                Statutory Regulatory Protocol
              </h4>
              <p className="text-xs text-[#0B1F54] mt-0.5 font-medium leading-relaxed">
                {t('how.notice')}
              </p>
            </div>
          </div>
        </div>

        {/* Process Timeline Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="relative bg-[#F5F7FB] border border-[#D3DDEB] rounded-xl p-6 transition-all hover:bg-white hover:border-[#174EA6] hover:shadow-md"
              >
                {/* Step Number Top Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#0B1F54] text-white flex items-center justify-center font-mono font-bold text-sm">
                    {step.num}
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-[#D3DDEB] text-[#174EA6]">
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </div>
                </div>

                <h3 className="text-base font-bold text-[#0B1F54] mb-2">
                  {step.title}
                </h3>

                <p className="text-xs sm:text-sm text-[#505F79] leading-relaxed">
                  {step.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
