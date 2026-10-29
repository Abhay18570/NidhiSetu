import { useState } from 'react';
import { useLanguage } from '../i18n/useLanguage';
import Breadcrumbs from '../components/common/Breadcrumbs';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { SITE_CONFIG } from '../config/site';
import {
  Phone,
  Mail,
  MapPin,
  Send,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';

export default function ContactPage() {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    fullName: '',
    instCode: '',
    email: '',
    phone: '',
    category: 'fdr',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);

  const breadcrumbs = [{ label: t('nav.contact', 'Contact') }];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.message) return;
    setSubmitted(true);
  };

  return (
    <div className="bg-[#F5F7FB] pb-16">
      <Breadcrumbs items={breadcrumbs} />

      {/* Header */}
      <div className="bg-white border-b border-[#D3DDEB] py-10 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <Badge variant="navy" size="md" className="mb-3">
            Public Nodal Desk
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0B1F54] tracking-tight">
            {t('contact.title', 'Contact & Grievance Redressal')}
          </h1>
          <div className="h-1 w-16 bg-[#E89B24] rounded-full mt-3 mb-4" />
          <p className="text-base text-[#505F79] leading-relaxed max-w-3xl">
            {t('contact.subtitle', 'Get in touch with the NidhiSetu technical support desk, regional nodal coordinators, or submit an institutional inquiry.')}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Form */}
          <div className="lg:col-span-7">
            <Card className="p-6 sm:p-8">
              <h2 className="text-xl font-bold text-[#0B1F54] mb-2">
                {t('contact.formTitle', 'Send an Inquiry or Support Request')}
              </h2>
              <p className="text-xs sm:text-sm text-[#505F79] mb-6">
                All inquiries are assigned a unique tracking ticket for compliance review.
              </p>

              {submitted ? (
                <div className="p-6 bg-[#E6F4EA] border border-[#13805E]/30 rounded-lg text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-[#13805E] text-white flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-[#13805E]">
                    Inquiry Successfully Registered
                  </h3>
                  <p className="text-xs text-[#0B1F54] leading-relaxed max-w-md mx-auto">
                    {t('contact.success')} Ticket reference <span className="font-mono font-bold">NS-TKT-2026-4401</span> has been logged.
                  </p>
                  <Button
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({
                        fullName: '',
                        instCode: '',
                        email: '',
                        phone: '',
                        category: 'fdr',
                        message: '',
                      });
                    }}
                    variant="outline"
                    size="sm"
                    className="mt-4"
                  >
                    Submit Another Inquiry
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#0B1F54] mb-1">
                        {t('contact.fullName', 'Full Name')} *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="Dr. Rajesh Sharma"
                        className="w-full px-3 py-2 bg-[#F5F7FB] border border-[#D3DDEB] rounded-md text-sm text-[#0B1F54] focus:outline-none focus:ring-2 focus:ring-[#174EA6]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#0B1F54] mb-1">
                        {t('contact.instName', 'Institution AISHE / PID Code')} *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.instCode}
                        onChange={(e) => setFormData({ ...formData, instCode: e.target.value })}
                        placeholder="e.g. C-49021 or 1-492019"
                        className="w-full px-3 py-2 bg-[#F5F7FB] border border-[#D3DDEB] rounded-md text-sm text-[#0B1F54] focus:outline-none focus:ring-2 focus:ring-[#174EA6]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#0B1F54] mb-1">
                        {t('contact.email', 'Official Email Address')} *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="principal@college.edu.in"
                        className="w-full px-3 py-2 bg-[#F5F7FB] border border-[#D3DDEB] rounded-md text-sm text-[#0B1F54] focus:outline-none focus:ring-2 focus:ring-[#174EA6]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#0B1F54] mb-1">
                        {t('contact.phone', 'Mobile Number')}
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="w-full px-3 py-2 bg-[#F5F7FB] border border-[#D3DDEB] rounded-md text-sm text-[#0B1F54] focus:outline-none focus:ring-2 focus:ring-[#174EA6]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#0B1F54] mb-1">
                      {t('contact.category', 'Inquiry Category')} *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 bg-[#F5F7FB] border border-[#D3DDEB] rounded-md text-sm text-[#0B1F54] focus:outline-none focus:ring-2 focus:ring-[#174EA6]"
                    >
                      <option value="fdr">{t('contact.catFdr')}</option>
                      <option value="renewal">{t('contact.catRenewal')}</option>
                      <option value="technical">{t('contact.catTechnical')}</option>
                      <option value="grievance">{t('contact.catGrievance')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#0B1F54] mb-1">
                      {t('contact.message', 'Message / Description')} *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Please provide details regarding the FDR submission, bank branch IFSC, or query..."
                      className="w-full px-3 py-2 bg-[#F5F7FB] border border-[#D3DDEB] rounded-md text-sm text-[#0B1F54] focus:outline-none focus:ring-2 focus:ring-[#174EA6]"
                    />
                  </div>

                  <div className="pt-2">
                    <Button type="submit" variant="primary" size="md" icon={Send} className="w-full font-bold">
                      {t('contact.submit', 'Submit Inquiries')}
                    </Button>
                  </div>
                </form>
              )}
            </Card>
          </div>

          {/* Right Column: Contact info & Regional Cells */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="p-6 space-y-4">
              <h3 className="text-base font-bold text-[#0B1F54] border-b border-slate-100 pb-2">
                {t('contact.helplineTitle', 'Institutional Helpline')}
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-[#E89B24] shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-[#0B1F54]">National Toll-Free Line:</div>
                    <div className="font-mono text-sm text-[#174EA6] font-bold">{SITE_CONFIG.tollFree}</div>
                    <div className="text-[0.6875rem] text-[#505F79]">{t('contact.helplineDesc')}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-[#E89B24] shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-[#0B1F54]">Coordination Email:</div>
                    <div className="font-mono text-xs text-slate-700">nidhisetu-support@demo.in</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-[#E89B24] shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-[#0B1F54]">{t('contact.addressTitle')}</div>
                    <div className="text-[#505F79] mt-0.5">{t('contact.address')}</div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 space-y-3 bg-[#E8F0FE]/40 border-[#B5C7DF]">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#174EA6]" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#174EA6]">
                  Prototype Disclaimer Notice
                </h4>
              </div>
              <p className="text-xs text-[#505F79] leading-relaxed">
                This contact interface represents the Module 01 functional prototype. Submitted requests are logged within local demonstration storage for UI evaluation. No actual institutional liability or government dispatch is initiated.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
