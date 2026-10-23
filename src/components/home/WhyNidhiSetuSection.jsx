import { useLanguage } from '../../i18n/useLanguage';
import SectionHeading from '../common/SectionHeading';
import {
  Eye,
  Lock,
  FileText,
  Zap,
  Clock,
  Database
} from 'lucide-react';

export default function WhyNidhiSetuSection() {
  const { t } = useLanguage();

  const pillars = [
    {
      icon: Eye,
      title: t('why.p1.title'),
      desc: t('why.p1.desc'),
      color: 'text-[#174EA6]',
      bg: 'bg-[#E8F0FE]',
    },
    {
      icon: Lock,
      title: t('why.p2.title'),
      desc: t('why.p2.desc'),
      color: 'text-[#13805E]',
      bg: 'bg-[#E6F4EA]',
    },
    {
      icon: FileText,
      title: t('why.p3.title'),
      desc: t('why.p3.desc'),
      color: 'text-[#E89B24]',
      bg: 'bg-[#FEF7EC]',
    },
    {
      icon: Zap,
      title: t('why.p4.title'),
      desc: t('why.p4.desc'),
      color: 'text-[#0B1F54]',
      bg: 'bg-slate-100',
    },
    {
      icon: Clock,
      title: t('why.p5.title'),
      desc: t('why.p5.desc'),
      color: 'text-[#C67C11]',
      bg: 'bg-[#FEF7EC]',
    },
    {
      icon: Database,
      title: t('why.p6.title'),
      desc: t('why.p6.desc'),
      color: 'text-[#174EA6]',
      bg: 'bg-[#E8F0FE]',
    },
  ];

  return (
    <section className="py-16 sm:py-20 bg-[#F5F7FB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <SectionHeading
          badge={t('why.badge')}
          title={t('why.title')}
          subtitle={t('why.subtitle')}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-lg border border-[#D3DDEB] p-6 gov-shadow-sm hover:border-[#174EA6] transition-colors"
              >
                <div className={`w-11 h-11 rounded-lg ${pillar.bg} flex items-center justify-center mb-4`}>
                  <Icon className={`w-5 h-5 ${pillar.color}`} aria-hidden="true" />
                </div>

                <h3 className="text-base font-bold text-[#0B1F54] mb-2">
                  {pillar.title}
                </h3>

                <p className="text-xs sm:text-sm text-[#505F79] leading-relaxed">
                  {pillar.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
