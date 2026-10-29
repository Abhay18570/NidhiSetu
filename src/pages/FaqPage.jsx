import { useState, useId } from 'react';
import { useLanguage } from '../i18n/useLanguage';
import Breadcrumbs from '../components/common/Breadcrumbs';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { ChevronDown, Search, HelpCircle, PhoneCall } from 'lucide-react';
import { SITE_CONFIG } from '../config/site';

export default function FaqPage() {
  const { t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [openIndex, setOpenIndex] = useState(0);
  const idPrefix = useId();

  const breadcrumbs = [{ label: t('nav.faq', 'FAQs') }];

  const categories = [
    { id: 'all', label: 'All Questions' },
    { id: 'eligibility', label: 'Eligibility & Norms' },
    { id: 'lien', label: 'Joint Lien & Bank Mandate' },
    { id: 'renewal', label: 'Renewal & Maturity' },
    { id: 'tracking', label: 'Tracking & Certificate' },
  ];

  const fullFaqs = [
    {
      q: t('faq.q1'),
      a: t('faq.a1'),
      category: 'eligibility',
      tag: 'Bank Eligibility',
    },
    {
      q: t('faq.q2'),
      a: t('faq.a2'),
      category: 'lien',
      tag: 'Joint Account',
    },
    {
      q: t('faq.q3'),
      a: t('faq.a3'),
      category: 'lien',
      tag: 'Bank Verification',
    },
    {
      q: t('faq.q4'),
      a: t('faq.a4'),
      category: 'renewal',
      tag: 'Maturity Alerts',
    },
    {
      q: t('faq.q5'),
      a: t('faq.a5'),
      category: 'tracking',
      tag: 'ARN Tracking',
    },
    {
      q: t('faq.q6'),
      a: t('faq.a6'),
      category: 'eligibility',
      tag: 'File Guidelines',
    },
    {
      q: 'Can an institution pledge an FDR from a Regional Rural Bank (RRB) or Cooperative Bank?',
      a: 'No. As per current regulatory guidelines, security deposits must strictly originate from Scheduled Commercial Banks recognized under the Second Schedule to the Reserve Bank of India Act, 1934. Deposits with non-scheduled cooperative credit societies or urban cooperative banks are not acceptable.',
      category: 'eligibility',
      tag: 'Statutory Norms',
    },
    {
      q: 'What is the required interest payout mechanism on the joint deposit?',
      a: 'The interest accrued on the security deposit may either be compounded into the principal (cumulative deposit) or paid periodically into the institutional account, provided the principal mandated security deposit amount remains entirely inviolable throughout the required approval tenure.',
      category: 'lien',
      tag: 'Interest Covenants',
    },
    {
      q: 'What happens if a bank branch fails to confirm an FDR within 15 days?',
      a: 'NidhiSetu automatically flags the file for Regional Officer intervention. An automated reminder dispatch is sent to the Zonal / Circle office of the respective Scheduled Bank, and the institution is granted an extension notice so that academic affiliation is not jeopardized by banking administrative delays.',
      category: 'tracking',
      tag: 'Branch Delays',
    },
    {
      q: 'How does an institution obtain refund or discharge of an FDR upon closure of a course?',
      a: 'Upon formal approval of course reduction or closure by the AICTE Regulatory Council, the institution applies for an FDR Discharge Certificate through NidhiSetu. Once the Scrutiny Officer verifies the clearance of faculty dues and student obligations, a formal No-Objection Discharge Order is electronically communicated to the bank branch to release the lien.',
      category: 'renewal',
      tag: 'Refund & Release',
    }
  ];

  const filteredFaqs = fullFaqs.filter((item) => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      item.q.toLowerCase().includes(query) ||
      item.a.toLowerCase().includes(query) ||
      item.tag.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="bg-[#F5F7FB] pb-16">
      <Breadcrumbs items={breadcrumbs} />

      {/* Header */}
      <div className="bg-white border-b border-[#D3DDEB] py-10 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <Badge variant="blue" size="md" className="mb-3">
            Knowledge Repository
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0B1F54] tracking-tight">
            {t('faq.title', 'Frequently Asked Questions')}
          </h1>
          <div className="h-1 w-16 bg-[#E89B24] rounded-full mt-3 mb-4" />
          <p className="text-base text-[#505F79] leading-relaxed max-w-3xl">
            {t('faq.subtitle', 'Everything you need to know about regulatory FDR submission, bank verification, lien clauses, and renewal schedules.')}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: FAQs & Filters */}
          <div className="lg:col-span-8 space-y-6">
            {/* Search Box */}
            <div className="relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('faq.searchPlaceholder', 'Search FAQs...')}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#D3DDEB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#174EA6] text-[#0B1F54]"
                aria-label="Search FAQs"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="FAQ Categories">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    activeCategory === cat.id
                      ? 'bg-[#0B1F54] text-white shadow-sm'
                      : 'bg-white text-[#505F79] border border-[#D3DDEB] hover:bg-slate-50'
                  }`}
                  role="tab"
                  aria-selected={activeCategory === cat.id}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Accordion */}
            <div className="space-y-3">
              {filteredFaqs.length === 0 ? (
                <div className="bg-white rounded-lg border border-[#D3DDEB] p-8 text-center text-sm text-[#505F79]">
                  No matching questions found for &ldquo;{searchQuery}&rdquo;.
                </div>
              ) : (
                filteredFaqs.map((faq, idx) => {
                  const isOpen = openIndex === idx;
                  const buttonId = `${idPrefix}-pbtn-${idx}`;
                  const panelId = `${idPrefix}-ppanel-${idx}`;

                  return (
                    <div
                      key={idx}
                      className="bg-white rounded-lg border border-[#D3DDEB] overflow-hidden gov-shadow-sm"
                    >
                      <h3>
                        <button
                          id={buttonId}
                          type="button"
                          onClick={() => setOpenIndex(isOpen ? -1 : idx)}
                          aria-expanded={isOpen}
                          aria-controls={panelId}
                          className="w-full flex items-center justify-between text-left p-4 sm:p-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#174EA6] hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center gap-3 pr-2">
                            <HelpCircle className="w-4 h-4 text-[#174EA6] shrink-0 mt-0.5" />
                            <span className="text-sm sm:text-base font-bold text-[#0B1F54]">
                              {faq.q}
                            </span>
                          </div>
                          <ChevronDown
                            className={`w-5 h-5 text-[#505F79] shrink-0 transition-transform duration-200 ${
                              isOpen ? 'rotate-180 text-[#174EA6]' : ''
                            }`}
                          />
                        </button>
                      </h3>

                      <div
                        id={panelId}
                        role="region"
                        aria-labelledby={buttonId}
                        hidden={!isOpen}
                        className={`px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-[#505F79] leading-relaxed border-t border-slate-100 ${
                          isOpen ? 'block' : 'hidden'
                        }`}
                      >
                        <div className="mt-2 pl-7">{faq.a}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Helpdesk & Grievance Box */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-xl border border-[#D3DDEB] p-6 gov-shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-5 h-5 text-[#E89B24]" />
                <h3 className="text-base font-bold text-[#0B1F54]">Still Need Help?</h3>
              </div>
              <p className="text-xs text-[#505F79] leading-relaxed">
                If your specific inquiry is not covered in our regulatory guidelines, reach out directly to the institutional helpdesk or file a ticket.
              </p>

              <div className="pt-2 border-t border-slate-100 space-y-3 text-xs">
                <div>
                  <div className="font-bold text-[#0B1F54]">Toll-Free Helpline:</div>
                  <div className="font-mono text-sm text-[#174EA6] font-semibold">{SITE_CONFIG.tollFree}</div>
                  <div className="text-[0.6875rem] text-slate-400">Monday - Friday (9 AM - 6 PM IST)</div>
                </div>

                <div>
                  <div className="font-bold text-[#0B1F54]">Official Email:</div>
                  <div className="font-mono text-xs text-slate-600">nidhisetu-support@demo.in</div>
                </div>
              </div>

              <div className="pt-2">
                <Button to="/contact" variant="royal" size="sm" className="w-full text-center">
                  Submit Support Request
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
