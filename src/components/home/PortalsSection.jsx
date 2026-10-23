import { useLanguage } from '../../i18n/useLanguage';
import SectionHeading from '../common/SectionHeading';
import Button from '../common/Button';
import Card from '../common/Card';
import Badge from '../common/Badge';
import {
  GraduationCap,
  ShieldAlert,
  ServerCog,
  KeyRound
} from 'lucide-react';

export default function PortalsSection() {
  const { t } = useLanguage();

  const portals = [
    {
      id: 'institution',
      roleKey: 'portals.inst.role',
      title: t('portals.inst.title'),
      desc: t('portals.inst.desc'),
      ctaText: t('portals.inst.cta'),
      icon: GraduationCap,
      topColor: 'blue',
      badgeColor: 'blue',
      badgeText: 'Institutional Access',
      link: '/login?role=institution',
    },
    {
      id: 'aicte',
      roleKey: 'portals.aicte.role',
      title: t('portals.aicte.title'),
      desc: t('portals.aicte.desc'),
      ctaText: t('portals.aicte.cta'),
      icon: ShieldAlert,
      topColor: 'saffron',
      badgeColor: 'saffron',
      badgeText: 'Regulatory Officer',
      link: '/login?role=aicte',
    },
    {
      id: 'admin',
      roleKey: 'portals.admin.role',
      title: t('portals.admin.title'),
      desc: t('portals.admin.desc'),
      ctaText: t('portals.admin.cta'),
      icon: ServerCog,
      topColor: 'navy',
      badgeColor: 'navy',
      badgeText: 'System Governance',
      link: '/login?role=admin',
    },
  ];

  return (
    <section className="py-16 sm:py-20 bg-white border-y border-[#D3DDEB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <SectionHeading
          badge={t('portals.badge')}
          title={t('portals.title')}
          subtitle={t('portals.subtitle')}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {portals.map((portal) => {
            const Icon = portal.icon;
            return (
              <Card
                key={portal.id}
                highlightTop={true}
                highlightColor={portal.topColor}
                hoverEffect={true}
                className="flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-[#F5F7FB] border border-[#D3DDEB] flex items-center justify-center">
                      <Icon className="w-6 h-6 text-[#0B1F54]" aria-hidden="true" />
                    </div>
                    <Badge variant={portal.badgeColor} size="sm">
                      {portal.badgeText}
                    </Badge>
                  </div>

                  <div className="text-[11px] font-semibold text-[#505F79] uppercase tracking-wider mb-1">
                    {t(portal.roleKey)}
                  </div>

                  <h3 className="text-lg font-bold text-[#0B1F54] mb-3">
                    {portal.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-[#505F79] leading-relaxed mb-6">
                    {portal.desc}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <Button
                    to={portal.link}
                    variant={portal.topColor === 'saffron' ? 'saffron' : portal.topColor === 'blue' ? 'royal' : 'primary'}
                    size="md"
                    icon={KeyRound}
                    className="w-full justify-center text-xs font-bold"
                  >
                    {portal.ctaText}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
