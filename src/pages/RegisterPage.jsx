import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { useLanguage } from '../i18n/useLanguage';
import { institutionRepository } from '../storage/institutionRepository';
import { userRepository } from '../storage/userRepository';
import { notificationRepository } from '../storage/notificationRepository';
import { auditRepository } from '../storage/auditRepository';
import { storageService, STORAGE_KEYS } from '../storage/storageService';
import Breadcrumbs from '../components/common/Breadcrumbs';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import {
  Building2,
  User,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Sparkles,
  Check,
  RotateCcw,
  LogIn
} from 'lucide-react';

const INITIAL_FORM_DATA = {
  // Step 1: Institution Details
  name: '',
  type: 'Engineering & Technology',
  aisheCode: '',
  aictePid: '',
  state: 'Maharashtra',
  district: '',
  city: '',
  pincode: '',
  address: '',

  // Step 2: Authorized Representative
  representativeName: '',
  representativeDesignation: 'Principal',
  representativeEmail: '',
  representativePhone: '',
  accessCode: 'demo@123',

  // Step 3: Regulatory Details
  approvalStatus: 'Self-Declared AICTE Approved',
  category: 'Private Self-Financed Institute',
  establishmentYear: '2005',
  regReferenceNo: '',
  declarationAccepted: false,
};

export default function RegisterPage() {
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(() => {
    const draft = storageService.getItem(STORAGE_KEYS.REG_DRAFT, null);
    return draft || INITIAL_FORM_DATA;
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredResult, setRegisteredResult] = useState(null);
  const [abandonModalOpen, setAbandonModalOpen] = useState(false);

  // Auto-save draft on form change (except step 5)
  useEffect(() => {
    if (step < 5) {
      storageService.setItem(STORAGE_KEYS.REG_DRAFT, formData);
    }
  }, [formData, step]);

  const breadcrumbs = [{ label: t('nav.register', 'Institution Registration') }];

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrorMsg('');
  };

  const states = [
    'Maharashtra', 'Gujarat', 'Madhya Pradesh', 'Delhi', 'Karnataka',
    'Andhra Pradesh', 'Telangana', 'Tamil Nadu', 'Uttar Pradesh', 'Rajasthan'
  ];

  const institutionTypes = [
    'Engineering & Technology',
    'Management & Computer Applications',
    'Pharmacy',
    'Architecture & Town Planning',
    'Polytechnic Diploma',
    'Hotel Management & Catering'
  ];

  const categories = [
    'Private Self-Financed Institute',
    'Government Aided Autonomous Institute',
    'State Government Technical University',
    'Deemed to be University',
    'Trust-Managed Technical Institute'
  ];

  // Validation per step
  const validateStep = async (currentStep) => {
    setErrorMsg('');

    if (currentStep === 1) {
      if (!formData.name.trim()) return 'Institution name is required.';
      if (!formData.aisheCode.trim()) return 'AISHE code is required.';
      if (!formData.city.trim() || !formData.district.trim()) return 'City and district are required.';
      if (!formData.pincode.trim() || formData.pincode.length < 6) return 'Valid 6-digit PIN code is required.';
      if (!formData.address.trim()) return 'Campus street address is required.';

      // Check duplicate AISHE in prototype repo
      const check = await institutionRepository.checkDuplicateEmailOrAishe('', formData.aisheCode);
      if (check.aisheExists) {
        return `An institution with AISHE code "${formData.aisheCode}" is already registered.`;
      }
    }

    if (currentStep === 2) {
      if (!formData.representativeName.trim()) return 'Representative full name is required.';
      if (!formData.representativeEmail.trim()) return 'Official email address is required.';
      if (!formData.representativePhone.trim()) return 'Contact phone number is required.';

      // Check duplicate email
      const check = await institutionRepository.checkDuplicateEmailOrAishe(formData.representativeEmail, '');
      if (check.emailExists) {
        return `An account with email "${formData.representativeEmail}" already exists.`;
      }
    }

    if (currentStep === 3) {
      if (!formData.establishmentYear) return 'Year of establishment is required.';
      if (!formData.declarationAccepted) return 'Please accept the self-declaration compliance affirmation.';
    }

    return null;
  };

  const handleNext = async () => {
    const error = await validateStep(step);
    if (error) {
      setErrorMsg(error);
      return;
    }
    setStep((prev) => Math.min(prev + 1, 5));
  };

  const handleBack = () => {
    setErrorMsg('');
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleAbandon = () => {
    storageService.removeItem(STORAGE_KEYS.REG_DRAFT);
    setFormData(INITIAL_FORM_DATA);
    setStep(1);
    setAbandonModalOpen(false);
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      // 1. Create institution record
      const instData = {
        name: formData.name.trim(),
        type: formData.type,
        category: formData.category,
        aisheCode: formData.aisheCode.trim().toUpperCase(),
        aictePid: formData.aictePid ? formData.aictePid.trim() : null,
        state: formData.state,
        district: formData.district.trim(),
        city: formData.city.trim(),
        pincode: formData.pincode.trim(),
        address: formData.address.trim(),
        establishmentYear: formData.establishmentYear,
        approvalStatus: formData.approvalStatus,
        representativeName: formData.representativeName.trim(),
        representativeDesignation: formData.representativeDesignation.trim(),
        representativeEmail: formData.representativeEmail.trim().toLowerCase(),
        representativePhone: formData.representativePhone.trim(),
      };

      const newInst = await institutionRepository.createInstitution(instData);

      // 2. Create demo user for this institution
      const newUser = await userRepository.createUser({
        name: formData.representativeName.trim(),
        designation: formData.representativeDesignation.trim(),
        email: formData.representativeEmail.trim().toLowerCase(),
        phone: formData.representativePhone.trim(),
        role: 'institution',
        accessCode: formData.accessCode || 'demo@123',
        institutionId: newInst.id,
        status: 'active',
      });

      // 3. Create Welcome Notification
      await notificationRepository.createNotification({
        userId: newUser.id,
        role: 'institution',
        title: 'Institution Registration Confirmed',
        message: `Welcome ${newInst.name}! Your institutional profile has been created with reference ID ${newInst.regReferenceNo}.`,
        category: 'welcome',
      });

      // 4. Log audit event
      await auditRepository.logEvent({
        eventType: 'INSTITUTION_REGISTERED',
        actorId: newUser.id,
        actorRole: 'institution',
        targetEntityId: newInst.id,
        summary: `New institutional onboarding completed for ${newInst.name} (${newInst.aisheCode})`,
        metadata: { aisheCode: newInst.aisheCode, regReferenceNo: newInst.regReferenceNo },
      });

      // Clear draft
      storageService.removeItem(STORAGE_KEYS.REG_DRAFT);

      setRegisteredResult({ institution: newInst, user: newUser });
      setStep(5);
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed. Please check inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDirectLogin = async () => {
    if (!registeredResult) return;
    try {
      await login({
        email: registeredResult.user.email,
        accessCode: registeredResult.user.accessCode,
        role: 'institution',
        rememberMe: true,
      });
      navigate('/institution/dashboard');
    } catch {
      navigate('/login?role=institution');
    }
  };

  const stepsMeta = [
    { num: 1, title: 'Institution Details', icon: Building2 },
    { num: 2, title: 'Representative', icon: User },
    { num: 3, title: 'Regulatory Info', icon: ShieldCheck },
    { num: 4, title: 'Review Dossier', icon: CheckCircle2 },
    { num: 5, title: 'Confirmation', icon: Sparkles },
  ];

  const handleAutoFillDemoInstitution = () => {
    const randomAishe = `C-${Math.floor(50000 + Math.random() * 40000)}`;
    setFormData({
      name: 'Pune Institute of Advanced Science & Technology',
      type: 'Engineering & Technology',
      category: 'Private Self-Financed Institute',
      aisheCode: randomAishe,
      aictePid: '1-99887766',
      state: 'Maharashtra',
      district: 'Pune',
      city: 'Pune',
      pincode: '411038',
      address: 'Survey No. 44/1, Paud Road, Kothrud',
      representativeName: 'Dr. Meenakshi Joshi',
      representativeDesignation: 'Principal & Professor',
      representativeEmail: `principal.${randomAishe.toLowerCase()}@piast.demo`,
      representativePhone: '+91 98220 54321',
      accessCode: 'demo@123',
      establishmentYear: '2005',
      categoryType: 'Affiliated Self-Financed College',
      approvalStatus: 'Self-Declared AICTE Approved',
      regReferenceNo: '',
      declarationAccepted: true,
    });
    setErrorMsg('');
  };

  return (
    <div className="bg-[#F5F7FB] pb-16">
      <Breadcrumbs items={breadcrumbs} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Badge variant="blue" size="md" className="mb-2">
              Institutional Onboarding Engine
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F54]">
              New Institution Registration & Repository Setup
            </h1>
            <p className="text-xs sm:text-sm text-[#505F79] mt-0.5">
              Establish an authorized security deposit and FDR management profile for your technical institution.
            </p>
          </div>

          {step < 5 && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={handleAutoFillDemoInstitution}
                variant="outline"
                size="sm"
                icon={Sparkles}
                className="text-xs font-semibold"
              >
                Auto-Fill Demo Data
              </Button>
              <button
                type="button"
                onClick={() => setAbandonModalOpen(true)}
                className="text-xs font-semibold text-slate-500 hover:text-rose-600 self-start sm:self-auto flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Form</span>
              </button>
            </div>
          )}
        </div>

        {/* Step Progress Bar */}
        <div className="bg-white rounded-xl border border-[#D3DDEB] p-4 gov-shadow-sm">
          <div className="grid grid-cols-5 gap-2">
            {stepsMeta.map((st) => {
              const isPast = step > st.num;
              const isCurrent = step === st.num;

              return (
                <div key={st.num} className="flex flex-col items-center text-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                      isPast
                        ? 'bg-[#13805E] text-white'
                        : isCurrent
                        ? 'bg-[#174EA6] text-white ring-4 ring-[#174EA6]/20'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isPast ? <Check className="w-4 h-4" /> : st.num}
                  </div>
                  <span
                    className={`text-[0.625rem] sm:text-xs font-bold mt-1.5 truncate max-w-full ${
                      isCurrent ? 'text-[#174EA6]' : isPast ? 'text-[#13805E]' : 'text-slate-400'
                    }`}
                  >
                    {st.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2.5 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Multi-Step Forms */}
        <Card className="p-6 sm:p-8">
          {/* STEP 1: INSTITUTION DETAILS */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-[#0B1F54]">
                  Step 1: Institutional Legal Identity
                </h2>
                <p className="text-xs text-[#505F79]">
                  Enter statutory registration identifiers and physical campus address.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#0B1F54] mb-1">
                    Institution Full Name (As per Statutory Approval Order) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="e.g. Government College of Engineering & Technology"
                    className="w-full px-3 py-2 bg-[#F5F7FB] border border-[#D3DDEB] rounded-md text-sm text-[#0B1F54] focus:outline-none focus:ring-2 focus:ring-[#174EA6]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0B1F54] mb-1">
                    Institution Discipline / Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => updateField('type', e.target.value)}
                    className="w-full px-3 py-2 bg-[#F5F7FB] border border-[#D3DDEB] rounded-md text-sm text-[#0B1F54] focus:outline-none focus:ring-2 focus:ring-[#174EA6]"
                  >
                    {institutionTypes.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0B1F54] mb-1">
                    State / Union Territory *
                  </label>
                  <select
                    value={formData.state}
                    onChange={(e) => updateField('state', e.target.value)}
                    className="w-full px-3 py-2 bg-[#F5F7FB] border border-[#D3DDEB] rounded-md text-sm text-[#0B1F54] focus:outline-none focus:ring-2 focus:ring-[#174EA6]"
                  >
                    {states.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0B1F54] mb-1">
                    AISHE Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.aisheCode}
                    onChange={(e) => updateField('aisheCode', e.target.value.toUpperCase())}
                    placeholder="e.g. C-49021"
                    className="w-full px-3 py-2 bg-[#F5F7FB] border border-[#D3DDEB] rounded-md text-sm font-mono uppercase text-[#0B1F54] focus:outline-none focus:ring-2 focus:ring-[#174EA6]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0B1F54] mb-1">
                    AICTE Permanent Institute ID (PID)
                  </label>
                  <input
                    type="text"
                    value={formData.aictePid}
                    onChange={(e) => updateField('aictePid', e.target.value)}
                    placeholder="e.g. 1-49201948 (Optional)"
                    className="w-full px-3 py-2 bg-[#F5F7FB] border border-[#D3DDEB] rounded-md text-sm font-mono text-[#0B1F54] focus:outline-none focus:ring-2 focus:ring-[#174EA6]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0B1F54] mb-1">
                    District *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.district}
                    onChange={(e) => updateField('district', e.target.value)}
                    placeholder="e.g. Pune"
                    className="w-full px-3 py-2 bg-[#F5F7FB] border border-[#D3DDEB] rounded-md text-sm text-[#0B1F54] focus:outline-none focus:ring-2 focus:ring-[#174EA6]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0B1F54] mb-1">
                    City / Town *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    placeholder="e.g. Pune"
                    className="w-full px-3 py-2 bg-[#F5F7FB] border border-[#D3DDEB] rounded-md text-sm text-[#0B1F54] focus:outline-none focus:ring-2 focus:ring-[#174EA6]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0B1F54] mb-1">
                    Postal PIN Code *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={formData.pincode}
                    onChange={(e) => updateField('pincode', e.target.value)}
                    placeholder="411005"
                    className="w-full px-3 py-2 bg-[#F5F7FB] border border-[#D3DDEB] rounded-md text-sm font-mono text-[#0B1F54] focus:outline-none focus:ring-2 focus:ring-[#174EA6]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#0B1F54] mb-1">
                    Campus Premises / Street Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    placeholder="e.g. Wellesley Road, Shivajinagar"
                    className="w-full px-3 py-2 bg-[#F5F7FB] border border-[#D3DDEB] rounded-md text-sm text-[#0B1F54] focus:outline-none focus:ring-2 focus:ring-[#174EA6]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: AUTHORIZED REPRESENTATIVE */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-[#0B1F54]">
                  Step 2: Authorized Signatory Credentials
                </h2>
                <p className="text-xs text-[#505F79]">
                  Provide contact details for the designated institution official who will hold joint security deposit signing authority.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0B1F54] mb-1">
                    Representative Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.representativeName}
                    onChange={(e) => updateField('representativeName', e.target.value)}
                    placeholder="e.g. Dr. Rajeshwar Patil"
                    className="w-full px-3 py-2 bg-[#F5F7FB] border border-[#D3DDEB] rounded-md text-sm text-[#0B1F54] focus:outline-none focus:ring-2 focus:ring-[#174EA6]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0B1F54] mb-1">
                    Official Designation *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.representativeDesignation}
                    onChange={(e) => updateField('representativeDesignation', e.target.value)}
                    placeholder="e.g. Principal / Director / Secretary"
                    className="w-full px-3 py-2 bg-[#F5F7FB] border border-[#D3DDEB] rounded-md text-sm text-[#0B1F54] focus:outline-none focus:ring-2 focus:ring-[#174EA6]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0B1F54] mb-1">
                    Official Institutional Email (Used for Login) *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.representativeEmail}
                    onChange={(e) => updateField('representativeEmail', e.target.value)}
                    placeholder="principal@college.edu.in"
                    className="w-full px-3 py-2 bg-[#F5F7FB] border border-[#D3DDEB] rounded-md text-sm text-[#0B1F54] focus:outline-none focus:ring-2 focus:ring-[#174EA6]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0B1F54] mb-1">
                    Official Contact Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.representativePhone}
                    onChange={(e) => updateField('representativePhone', e.target.value)}
                    placeholder="+91 98220 12345"
                    className="w-full px-3 py-2 bg-[#F5F7FB] border border-[#D3DDEB] rounded-md text-sm text-[#0B1F54] focus:outline-none focus:ring-2 focus:ring-[#174EA6]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#0B1F54] mb-1">
                    Demo Account Access Code (For login simulation) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.accessCode}
                    onChange={(e) => updateField('accessCode', e.target.value)}
                    placeholder="demo@123"
                    className="w-full px-3 py-2 bg-[#F5F7FB] border border-[#D3DDEB] rounded-md text-sm font-mono text-[#0B1F54] focus:outline-none focus:ring-2 focus:ring-[#174EA6]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: REGULATORY DETAILS */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-[#0B1F54]">
                  Step 3: Regulatory Category & Self-Declared Status
                </h2>
                <p className="text-xs text-[#505F79]">
                  Declare institutional approval classification. (Self-declared information is not represented as official government verification).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0B1F54] mb-1">
                    Institution Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => updateField('category', e.target.value)}
                    className="w-full px-3 py-2 bg-[#F5F7FB] border border-[#D3DDEB] rounded-md text-sm text-[#0B1F54] focus:outline-none focus:ring-2 focus:ring-[#174EA6]"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0B1F54] mb-1">
                    Year of Establishment *
                  </label>
                  <input
                    type="number"
                    min="1850"
                    max="2026"
                    value={formData.establishmentYear}
                    onChange={(e) => updateField('establishmentYear', e.target.value)}
                    className="w-full px-3 py-2 bg-[#F5F7FB] border border-[#D3DDEB] rounded-md text-sm text-[#0B1F54] focus:outline-none focus:ring-2 focus:ring-[#174EA6]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0B1F54] mb-1">
                    Approval Status (Self-Declared) *
                  </label>
                  <select
                    value={formData.approvalStatus}
                    onChange={(e) => updateField('approvalStatus', e.target.value)}
                    className="w-full px-3 py-2 bg-[#F5F7FB] border border-[#D3DDEB] rounded-md text-sm text-[#0B1F54] focus:outline-none focus:ring-2 focus:ring-[#174EA6]"
                  >
                    <option value="Self-Declared AICTE Approved">Self-Declared AICTE Approved</option>
                    <option value="State Directorate Recognized">State Directorate Recognized</option>
                    <option value="Affiliated University Autonomous">Affiliated University Autonomous</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0B1F54] mb-1">
                    Existing Regulatory File Reference (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.regReferenceNo}
                    onChange={(e) => updateField('regReferenceNo', e.target.value)}
                    placeholder="e.g. F.No. Western/1-392019/2026"
                    className="w-full px-3 py-2 bg-[#F5F7FB] border border-[#D3DDEB] rounded-md text-sm text-[#0B1F54] focus:outline-none focus:ring-2 focus:ring-[#174EA6]"
                  />
                </div>

                <div className="sm:col-span-2 pt-2">
                  <label className="flex items-start gap-2.5 cursor-pointer p-3 bg-amber-50/50 border border-amber-200 rounded-lg">
                    <input
                      type="checkbox"
                      required
                      checked={formData.declarationAccepted}
                      onChange={(e) => updateField('declarationAccepted', e.target.checked)}
                      className="mt-1 w-4 h-4 rounded text-[#174EA6] focus:ring-[#174EA6] border-[#D3DDEB]"
                    />
                    <span className="text-xs text-[#0B1F54] leading-relaxed">
                      <strong>Solemn Declaration:</strong> I certify that the information entered is true to the best of my knowledge and corresponds to official institutional charter records. I acknowledge that this is a simulated hackathon prototype repository.
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW DOSSIER */}
          {step === 4 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-[#0B1F54]">
                    Step 4: Review Registration Dossier
                  </h2>
                  <p className="text-xs text-[#505F79]">
                    Verify institutional information before establishing prototype repository.
                  </p>
                </div>
                <Badge variant="blue" size="sm">
                  Ready to Submit
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-[#F5F7FB] rounded-lg space-y-1">
                  <span className="text-slate-500 font-semibold uppercase text-[0.625rem]">Institution Legal Name:</span>
                  <div className="font-bold text-[#0B1F54] text-sm">{formData.name}</div>
                  <div className="text-slate-600">{formData.type} &bull; {formData.category}</div>
                </div>

                <div className="p-3.5 bg-[#F5F7FB] rounded-lg space-y-1">
                  <span className="text-slate-500 font-semibold uppercase text-[0.625rem]">Statutory Identifiers:</span>
                  <div className="font-mono font-bold text-[#174EA6] text-sm">AISHE: {formData.aisheCode}</div>
                  <div className="text-slate-600 font-mono">PID: {formData.aictePid || 'None'}</div>
                </div>

                <div className="p-3.5 bg-[#F5F7FB] rounded-lg space-y-1">
                  <span className="text-slate-500 font-semibold uppercase text-[0.625rem]">Location:</span>
                  <div className="font-semibold text-[#0B1F54]">{formData.address}</div>
                  <div className="text-slate-600">{formData.city}, {formData.district}, {formData.state} - {formData.pincode}</div>
                </div>

                <div className="p-3.5 bg-[#F5F7FB] rounded-lg space-y-1">
                  <span className="text-slate-500 font-semibold uppercase text-[0.625rem]">Authorized Signatory:</span>
                  <div className="font-bold text-[#0B1F54]">{formData.representativeName} ({formData.representativeDesignation})</div>
                  <div className="text-slate-600 font-mono">{formData.representativeEmail} &bull; {formData.representativePhone}</div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: CONFIRMATION */}
          {step === 5 && registeredResult && (
            <div className="space-y-6 text-center py-6 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-[#E6F4EA] text-[#13805E] flex items-center justify-center mx-auto shadow-sm">
                <Check className="w-8 h-8" />
              </div>

              <div className="space-y-2 max-w-md mx-auto">
                <Badge variant="green" size="md">
                  Onboarding Complete
                </Badge>
                <h2 className="text-2xl font-black text-[#0B1F54]">
                  Institution Profile Created!
                </h2>
                <p className="text-xs sm:text-sm text-[#505F79] leading-relaxed">
                  Your institutional repository for <strong>{registeredResult.institution.name}</strong> has been registered in the prototype database.
                </p>
              </div>

              <div className="p-4 bg-[#F5F7FB] border border-[#D3DDEB] rounded-xl max-w-md mx-auto text-xs text-left space-y-2 font-mono">
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500">Registration Ref:</span>
                  <span className="font-bold text-[#174EA6]">{registeredResult.institution.regReferenceNo}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500">AISHE Permanent Code:</span>
                  <span className="font-bold text-[#0B1F54]">{registeredResult.institution.aisheCode}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500">Signatory Email:</span>
                  <span className="text-slate-700">{registeredResult.user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Demo Access Code:</span>
                  <span className="text-[#13805E] font-bold">{registeredResult.user.accessCode}</span>
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
                <Button
                  onClick={handleDirectLogin}
                  variant="primary"
                  size="lg"
                  icon={ArrowRight}
                  iconPosition="right"
                  className="font-bold w-full sm:w-auto"
                >
                  Enter Institution Dashboard
                </Button>
                <Button
                  to="/login?role=institution"
                  variant="outline"
                  size="lg"
                  icon={LogIn}
                  className="w-full sm:w-auto"
                >
                  Go to Login Screen
                </Button>
              </div>
            </div>
          )}

          {/* Navigation Controls (Steps 1 to 4) */}
          {step < 5 && (
            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
              <div>
                {step > 1 ? (
                  <Button
                    type="button"
                    onClick={handleBack}
                    variant="outline"
                    size="md"
                    icon={ArrowLeft}
                  >
                    Previous Step
                  </Button>
                ) : (
                  <Link
                    to="/login"
                    className="text-xs text-slate-500 hover:text-[#174EA6] hover:underline"
                  >
                    Already registered? Sign In
                  </Link>
                )}
              </div>

              <div>
                {step < 4 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    variant="primary"
                    size="md"
                    icon={ArrowRight}
                    iconPosition="right"
                  >
                    Continue to Step {step + 1}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleFinalSubmit}
                    variant="primary"
                    size="md"
                    disabled={isSubmitting}
                    icon={CheckCircle2}
                    className="font-bold shadow-md"
                  >
                    {isSubmitting ? 'Submitting Registration...' : 'Complete & Generate Repository'}
                  </Button>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Abandon Draft Modal */}
      {abandonModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="app-modal fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-xl border border-[#D3DDEB] max-w-md w-full p-6 gov-shadow-lg space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#0B1F54]">
                Discard Registration Draft?
              </h3>
            </div>

            <p className="text-xs sm:text-sm text-[#505F79] leading-relaxed">
              Are you sure you want to clear your current progress and reset the registration form back to blank values?
            </p>

            <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
              <Button onClick={() => setAbandonModalOpen(false)} variant="outline" size="sm">
                Cancel
              </Button>
              <Button onClick={handleAbandon} variant="primary" size="sm" className="bg-rose-700 hover:bg-rose-800 text-white border-rose-700">
                Yes, Discard Draft
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
