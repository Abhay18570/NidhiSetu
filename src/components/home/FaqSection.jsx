import { useState, useId } from 'react';
import { useLanguage } from '../../i18n/useLanguage';
import SectionHeading from '../common/SectionHeading';
import { ChevronDown, Search, HelpCircle, FileQuestion } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FaqSection({ limit = 6, showSearch = true, showViewAll = true }) {
  const { t } = useLanguage();
  const [openIndex, setOpenIndex] = useState(0); // First item open by default
  const [searchQuery, setSearchQuery] = useState('');
  const idPrefix = useId();

  const faqItems = [
    {
      q: t('faq.q1'),
      a: t('faq.a1'),
      tag: 'Eligibility',
    },
    {
      q: t('faq.q2'),
      a: t('faq.a2'),
      tag: 'Lien Mandate',
    },
    {
      q: t('faq.q3'),
      a: t('faq.a3'),
      tag: 'Bank Verification',
    },
    {
      q: t('faq.q4'),
      a: t('faq.a4'),
      tag: 'Maturity & Alerts',
    },
    {
      q: t('faq.q5'),
      a: t('faq.a5'),
      tag: 'Tracking',
    },
    {
      q: t('faq.q6'),
      a: t('faq.a6'),
      tag: 'Upload Guidelines',
    },
  ];

  const filteredFaqs = faqItems.filter(
    (item) =>
      item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.a.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tag.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, limit);

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? -1 : index);
  };

  return (
    <section id="faq" className="py-16 sm:py-20 bg-[#F5F7FB]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <SectionHeading
          badge={t('faq.badge')}
          title={t('faq.title')}
          subtitle={t('faq.subtitle')}
        />

        {/* Optional Live Search Box */}
        {showSearch && (
          <div className="mb-8">
            <div className="relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" aria-hidden="true" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('faq.searchPlaceholder', 'Search FAQs...')}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#D3DDEB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#174EA6] focus:border-transparent text-[#0B1F54] placeholder-slate-400"
                aria-label="Filter FAQs"
              />
            </div>
          </div>
        )}

        {/* Accordion List */}
        <div className="space-y-3" role="region" aria-label="FAQ Accordion">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-lg border border-[#D3DDEB] p-6 text-sm text-[#505F79]">
              <FileQuestion className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              No questions found matching &ldquo;{searchQuery}&rdquo;. Try another search term.
            </div>
          ) : (
            filteredFaqs.map((faq, idx) => {
              const isOpen = openIndex === idx;
              const buttonId = `${idPrefix}-btn-${idx}`;
              const panelId = `${idPrefix}-panel-${idx}`;

              return (
                <div
                  key={idx}
                  className="bg-white rounded-lg border border-[#D3DDEB] overflow-hidden gov-shadow-sm transition-colors"
                >
                  <h3>
                    <button
                      id={buttonId}
                      type="button"
                      onClick={() => toggleAccordion(idx)}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      className="w-full flex items-center justify-between text-left p-4 sm:p-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#174EA6] focus-visible:ring-inset hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3 pr-2">
                        <HelpCircle className="w-4 h-4 text-[#174EA6] shrink-0 mt-0.5" aria-hidden="true" />
                        <span className="text-sm sm:text-base font-bold text-[#0B1F54] leading-snug">
                          {faq.q}
                        </span>
                      </div>
                      <ChevronDown
                        className={`w-5 h-5 text-[#505F79] shrink-0 transition-transform duration-200 ${
                          isOpen ? 'rotate-180 text-[#174EA6]' : ''
                        }`}
                        aria-hidden="true"
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

        {/* View All or More Guidance */}
        {showViewAll && (
          <div className="mt-8 text-center">
            <Link
              to="/faq"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#174EA6] hover:text-[#0B1F54] hover:underline"
            >
              <span>Explore Complete Knowledge Base & Grievance Guidelines</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
