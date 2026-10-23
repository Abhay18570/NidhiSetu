import { Link } from 'react-router-dom';
import { useLanguage } from '../../i18n/useLanguage';
import SectionHeading from '../common/SectionHeading';
import Card from '../common/Card';
import Badge from '../common/Badge';
import {
  FileUp,
  ShieldCheck,
  Scale,
  BellRing,
  Search,
  FileSpreadsheet,
  ArrowRight
} from 'lucide-react';

export default function ServicesSection() {
  const { t } = useLanguage();

  const services = [
    {
      id: 'fdr-submission',
      icon: FileUp,
      iconColor: 'text-[#174EA6]',
      iconBg: 'bg-[#E8F0FE]',
      title: t('services.s1.title'),
      desc: t('services.s1.desc'),
      badge: t('services.s1.badge'),
      tagColor: 'blue',
      highlightColor: 'blue',
    },
    {
      id: 'document-verification',
      icon: ShieldCheck,
      iconColor: 'text-[#13805E]',
      iconBg: 'bg-[#E6F4EA]',
      title: t('services.s2.title'),
      desc: t('services.s2.desc'),
      badge: t('services.s2.badge'),
      tagColor: 'green',
      highlightColor: 'green',
    },
    {
      id: 'compliance-monitoring',
      icon: Scale,
      iconColor: 'text-[#E89B24]',
      iconBg: 'bg-[#FEF7EC]',
      title: t('services.s3.title'),
      desc: t('services.s3.desc'),
      badge: t('services.s3.badge'),
      tagColor: 'saffron',
      highlightColor: 'saffron',
    },
    {
      id: 'maturity-alerts',
      icon: BellRing,
      iconColor: 'text-[#D9381E]',
      iconBg: 'bg-[#FCE8E6]',
      title: t('services.s4.title'),
      desc: t('services.s4.desc'),
      badge: t('services.s4.badge'),
      tagColor: 'gray',
      highlightColor: 'navy',
    },
    {
      id: 'application-tracking',
      icon: Search,
      iconColor: 'text-[#174EA6]',
      iconBg: 'bg-[#E8F0FE]',
      title: t('services.s5.title'),
      desc: t('services.s5.desc'),
      badge: t('services.s5.badge'),
      tagColor: 'blue',
      highlightColor: 'blue',
    },
    {
      id: 'admin-reporting',
      icon: FileSpreadsheet,
      iconColor: 'text-[#0B1F54]',
      iconBg: 'bg-slate-100',
      title: t('services.s6.title'),
      desc: t('services.s6.desc'),
      badge: t('services.s6.badge'),
      tagColor: 'navy',
      highlightColor: 'navy',
    },
  ];

  return (
    <section id="services" className="py-16 sm:py-20 bg-[#F5F7FB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <SectionHeading
          badge={t('services.badge')}
          title={t('services.title')}
          subtitle={t('services.subtitle')}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.id}
                hoverEffect={true}
                highlightTop={true}
                highlightColor={item.highlightColor}
                className="flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-lg ${item.iconBg} flex items-center justify-center shrink-0`}>
                      <Icon className={`w-6 h-6 ${item.iconColor}`} aria-hidden="true" />
                    </div>
                    <Badge variant={item.tagColor} size="sm">
                      {item.badge}
                    </Badge>
                  </div>

                  <h3 className="text-lg font-bold text-[#0B1F54] mb-2 leading-snug">
                    {item.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-[#505F79] leading-relaxed mb-4">
                    {item.desc}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 mt-2">
                  <Link
                    to={`/services#${item.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#174EA6] hover:text-[#0B1F54] group"
                  >
                    <span>Module Specifications</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
