import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import {
  fdrRepository,
  fdrDocumentRepository,
  rupeesToPaise,
  formatINR,
  isValidIFSC,
  isMaturityDateValid,
  validateDocumentFile
} from '../../storage';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import DocumentPreviewModal from '../../components/common/DocumentPreviewModal';
import {
  Building2,
  Landmark,
  BadgeIndianRupee,
  UploadCloud,
  FileCheck2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  FileText,
  Trash2,
  Eye,
  RotateCcw,
  Save,
  Check,
  Shield,
  Info
} from 'lucide-react';

const INITIAL_FORM = {
  // Step 2: Bank Details
  bankName: 'State Bank of India',
  branchName: '',
  branchAddress: '',
  ifsc: '',
  fdrNumber: '',
  accountHolderName: '',

  // Step 3: Deposit Details
  depositAmount: '',
  depositDate: '',
  maturityDate: '',
  interestRate: '7.1',
  depositType: 'Fixed Deposit (Cumulative)',
  applicableSecurityRequirement: 'Technical Institute Mandatory Security Deposit',
  remarks: '',

  // Step 4: Document
  documentId: null,
  fileName: '',
  fileType: '',
  fileSize: 0,
  sha256Hash: '',

  // Step 5: Declaration
  declarationAccepted: false,

  // Renewal reference if applicable
  renewalReferenceId: null,
};

export default function FdrSubmissionWizard() {
  const { currentUser, currentInstitution } = useAuth();
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedFdr, setSubmittedFdr] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [discardModalOpen, setDiscardModalOpen] = useState(false);
  const [saveDraftFeedback, setSaveDraftFeedback] = useState('');

  // Check for renewal draft or existing draft in query params or storage
  useEffect(() => {
    async function loadInitial() {
      if (!currentInstitution?.id) return;

      const renewalRef = searchParams.get('renewalRef');
      if (renewalRef) {
        setFormData((prev) => ({
          ...prev,
          renewalReferenceId: renewalRef,
          remarks: `Renewal rollover for prior FDR reference ${renewalRef}.`,
        }));
      }

      // Check if there is an existing draft for this institution
      const drafts = await fdrRepository.getDrafts(currentInstitution.id);
      if (drafts.length > 0 && !renewalRef) {
        const latestDraft = drafts[0];
        setFormData((prev) => ({
          ...prev,
          ...latestDraft,
        }));
      }
    }
    loadInitial();
  }, [currentInstitution, searchParams]);

  // Set default account holder name from institution when available
  useEffect(() => {
    if (currentInstitution && !formData.accountHolderName) {
      setFormData((prev) => ({
        ...prev,
        accountHolderName: `Principal, ${currentInstitution.name} Jointly with Regional Officer, AICTE`,
      }));
    }
  }, [currentInstitution]);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrorMsg('');
  };

  const stepsMeta = [
    { num: 1, title: 'Institution Info', icon: Building2 },
    { num: 2, title: 'Bank Details', icon: Landmark },
    { num: 3, title: 'Deposit Details', icon: BadgeIndianRupee },
    { num: 4, title: 'Upload Scan', icon: UploadCloud },
    { num: 5, title: 'Review & Affirm', icon: FileCheck2 },
    { num: 6, title: 'Confirmed', icon: Sparkles },
  ];

  // Quick 1-click Auto-fill helper for evaluators
  const handleAutoFillDemoFdr = () => {
    const today = new Date();
    const depositDateStr = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate()).toISOString().split('T')[0];
    const maturityDateStr = new Date(today.getFullYear() + 4, today.getMonth(), today.getDate()).toISOString().split('T')[0];
    const randFdrNo = `SBI-PUN-${Math.floor(100000 + Math.random() * 900000)}`;

    setFormData((prev) => ({
      ...prev,
      bankName: 'State Bank of India',
      branchName: 'Shivajinagar Commercial Branch, Pune',
      branchAddress: 'F.C. Road, Shivajinagar, Pune, Maharashtra - 411004',
      ifsc: 'SBIN0001110',
      fdrNumber: randFdrNo,
      accountHolderName: `Principal, ${currentInstitution?.name || 'College'} Jointly with Regional Officer, AICTE`,
      depositAmount: '3500000',
      depositDate: depositDateStr,
      maturityDate: maturityDateStr,
      interestRate: '7.15',
      depositType: 'Fixed Deposit (Cumulative)',
      applicableSecurityRequirement: 'Technical Degree Program Affiliation Joint Security Deposit',
      remarks: 'Joint lien clause endorsed per standard AICTE Approval Process Handbook guidelines.',
      fileName: 'Synthetic_Deposit_Receipt_Scan.pdf',
      fileType: 'application/pdf',
      fileSize: 1450200,
      sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      documentId: 'doc-auto-demo-01',
      declarationAccepted: true,
    }));
    setErrorMsg('');
  };

  // Step validation
  const validateStep = (currentStep) => {
    setErrorMsg('');

    if (currentStep === 1) {
      if (!currentInstitution?.id) {
        return 'Please ensure institutional profile details are loaded before proceeding.';
      }
    }

    if (currentStep === 2) {
      if (!formData.bankName.trim()) return 'Bank name is required.';
      if (!formData.branchName.trim()) return 'Bank branch name is required.';
      if (!formData.ifsc.trim()) return 'Bank IFSC code is required.';
      if (!isValidIFSC(formData.ifsc)) {
        return `Invalid IFSC format "${formData.ifsc}". Must be 11 characters (e.g. SBIN0001110).`;
      }
      if (!formData.fdrNumber.trim()) return 'FDR Certificate Number is required.';
      if (!formData.accountHolderName.trim()) return 'Account holder joint name is required.';
    }

    if (currentStep === 3) {
      const amt = rupeesToPaise(formData.depositAmount);
      if (!amt || amt <= 0) return 'Please enter a valid deposit amount in Rupees.';
      if (!formData.depositDate) return 'Deposit creation date is required.';
      if (!formData.maturityDate) return 'Maturity date is required.';
      if (!isMaturityDateValid(formData.depositDate, formData.maturityDate)) {
        return 'Maturity date must be strictly after the deposit date.';
      }
      const rate = parseFloat(formData.interestRate);
      if (isNaN(rate) || rate < 0 || rate > 25) {
        return 'Please enter a reasonable annual interest rate percentage (e.g. 7.15%).';
      }
    }

    if (currentStep === 4) {
      if (!formData.fileName && !formData.documentId) {
        return 'Please upload a scanned copy of the Fixed Deposit Receipt.';
      }
    }

    if (currentStep === 5) {
      if (!formData.declarationAccepted) {
        return 'Please accept the statutory declaration confirming accuracy of deposit records.';
      }
    }

    return null;
  };

  const handleNext = () => {
    const error = validateStep(step);
    if (error) {
      setErrorMsg(error);
      return;
    }
    setStep((prev) => Math.min(prev + 1, 6));
  };

  const handleBack = () => {
    setErrorMsg('');
    setStep((prev) => Math.max(prev - 1, 1));
  };

  // Manual save draft
  const handleSaveDraft = async () => {
    if (!currentInstitution?.id) return;
    try {
      await fdrRepository.saveDraft(formData, currentInstitution.id);
      setSaveDraftFeedback('Draft saved successfully to browser storage.');
      setTimeout(() => setSaveDraftFeedback(''), 3000);
    } catch (err) {
      setErrorMsg('Failed to save draft: ' + err.message);
    }
  };

  // Discard draft
  const handleDiscardDraft = async () => {
    if (formData.id && currentInstitution?.id) {
      await fdrRepository.deleteDraft(formData.id, currentInstitution.id);
    }
    setFormData(INITIAL_FORM);
    setStep(1);
    setDiscardModalOpen(false);
  };

  // File upload handler
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateDocumentFile(file);
    if (!validation.valid) {
      setErrorMsg(validation.error);
      return;
    }

    setIsUploading(true);
    setErrorMsg('');

    try {
      // 1. Store in IndexedDB
      const savedDoc = await fdrDocumentRepository.saveDocument({
        file,
        institutionId: currentInstitution?.id,
        fdrReference: formData.fdrNumber || 'DRAFT',
      });

      // 2. Update form state
      setFormData((prev) => ({
        ...prev,
        documentId: savedDoc.documentId,
        fileName: savedDoc.fileName,
        fileType: savedDoc.fileType,
        fileSize: savedDoc.fileSize,
        sha256Hash: savedDoc.sha256Hash,
      }));
    } catch (err) {
      setErrorMsg('Document ingestion failed: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // Final submit handler
  const handleFinalSubmit = async () => {
    const error = validateStep(5);
    if (error) {
      setErrorMsg(error);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const created = await fdrRepository.createFDR(
        {
          ...formData,
          institutionId: currentInstitution.id,
        },
        {
          id: currentUser?.id,
          name: currentUser?.name,
          role: 'institution',
        }
      );

      // Clean up draft if one existed
      if (formData.id) {
        await fdrRepository.deleteDraft(formData.id, currentInstitution.id);
      }

      setSubmittedFdr(created);
      setStep(6);
    } catch (err) {
      setErrorMsg(err.message || 'Submission failed. Please verify all fields.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const breadcrumbs = [
    { label: 'Institution Dashboard', to: '/institution/dashboard' },
    { label: 'FDR Repository', to: '/institution/fdr-records' },
    { label: 'New FDR Submission' },
  ];

  return (
    <div className="space-y-6 max-w-4xl pb-16">
      <Breadcrumbs items={breadcrumbs} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#174EA6]">
              Statutory Security Deposit Ingestion
            </span>
            <Badge variant="blue" size="sm">
              Module 03
            </Badge>
          </div>
          <h1 className="text-2xl font-black text-[#0B1F54]">
            {formData.renewalReferenceId ? 'FDR Renewal Submission Dossier' : 'New FDR Submission Wizard'}
          </h1>
          <p className="text-xs sm:text-sm text-[#505F79] mt-0.5">
            Submit a joint Fixed Deposit Receipt scan and metadata for AICTE scrutiny officer review.
          </p>
        </div>

        {step < 6 && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={handleAutoFillDemoFdr}
              variant="outline"
              size="sm"
              icon={Sparkles}
              className="text-xs font-bold"
            >
              Auto-Fill Test FDR
            </Button>
            <Button
              type="button"
              onClick={handleSaveDraft}
              variant="secondary"
              size="sm"
              icon={Save}
              className="text-xs font-semibold"
            >
              Save Draft
            </Button>
            <button
              type="button"
              onClick={() => setDiscardModalOpen(true)}
              className="text-xs text-slate-500 hover:text-rose-600 p-2 font-semibold"
              title="Discard Draft"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {saveDraftFeedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-xs text-[#13805E] rounded-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{saveDraftFeedback}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-xs text-rose-700 rounded-xl flex items-center gap-2.5 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Step Progress Bar */}
      <div className="bg-white rounded-xl border border-[#D3DDEB] p-4 gov-shadow-sm">
        <div className="grid grid-cols-6 gap-2">
          {stepsMeta.map((st) => {
            const isPast = step > st.num;
            const isCurrent = step === st.num;
            return (
              <div key={st.num} className="flex flex-col items-center text-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
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
                  className={`text-[0.625rem] font-bold mt-1.5 truncate max-w-full hidden sm:block ${
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

      {/* STEP FORMS */}
      <Card className="p-6 sm:p-8">
        {/* STEP 1: INSTITUTION DETAILS (READ-ONLY) */}
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-[#0B1F54] flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#174EA6]" />
                <span>Step 1: Institutional Ownership & Signatory Verification</span>
              </h2>
              <p className="text-xs text-[#505F79]">
                FDRs must be submitted under the authority of the authenticated institution.
              </p>
            </div>

            <div className="p-4 bg-[#F5F7FB] border border-[#D3DDEB] rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 font-semibold uppercase text-[0.625rem]">Institution Legal Name:</span>
                <div className="font-bold text-[#0B1F54] text-sm mt-0.5">{currentInstitution?.name}</div>
              </div>
              <div>
                <span className="text-slate-500 font-semibold uppercase text-[0.625rem]">AISHE / Permanent PID:</span>
                <div className="font-mono font-bold text-[#174EA6] text-sm mt-0.5">{currentInstitution?.aisheCode}</div>
              </div>
              <div>
                <span className="text-slate-500 font-semibold uppercase text-[0.625rem]">Authorized Representative:</span>
                <div className="font-semibold text-[#0B1F54] mt-0.5">
                  {currentUser?.name} ({currentUser?.designation})
                </div>
              </div>
              <div>
                <span className="text-slate-500 font-semibold uppercase text-[0.625rem]">Campus Location:</span>
                <div className="text-slate-700 mt-0.5">
                  {currentInstitution?.city}, {currentInstitution?.state} - {currentInstitution?.pincode}
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#E8F0FE] border border-[#B5C7DF] rounded-lg text-xs text-[#174EA6] flex items-center gap-2">
              <Shield className="w-4 h-4 shrink-0" />
              <span>Cross-institution submissions are strictly blocked by the application security policy.</span>
            </div>
          </div>
        )}

        {/* STEP 2: BANK DETAILS */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-[#0B1F54] flex items-center gap-2">
                <Landmark className="w-4 h-4 text-[#174EA6]" />
                <span>Step 2: Scheduled Commercial Bank Information</span>
              </h2>
              <p className="text-xs text-[#505F79]">
                Provide issuing branch details and verified Indian Financial System Code (IFSC).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#0B1F54] mb-1">
                  Issuing Bank Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.bankName}
                  onChange={(e) => updateField('bankName', e.target.value)}
                  placeholder="e.g. State Bank of India, Punjab National Bank, Canara Bank"
                  className="w-full px-3.5 py-2.5 bg-[#F5F7FB] border border-[#D3DDEB] rounded-lg text-sm text-[#0B1F54] focus:outline-none focus:ring-2 focus:ring-[#174EA6]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B1F54] mb-1">
                  Bank Branch Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.branchName}
                  onChange={(e) => updateField('branchName', e.target.value)}
                  placeholder="e.g. Shivajinagar Commercial Branch"
                  className="w-full px-3.5 py-2.5 bg-[#F5F7FB] border border-[#D3DDEB] rounded-lg text-sm text-[#0B1F54] focus:outline-none focus:ring-2 focus:ring-[#174EA6]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B1F54] mb-1">
                  Branch IFSC Code (11 alphanumeric characters) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={11}
                  value={formData.ifsc}
                  onChange={(e) => updateField('ifsc', e.target.value.toUpperCase())}
                  placeholder="e.g. SBIN0001110"
                  className="w-full px-3.5 py-2.5 bg-[#F5F7FB] border border-[#D3DDEB] rounded-lg text-sm font-mono uppercase text-[#0B1F54] focus:outline-none focus:ring-2 focus:ring-[#174EA6]"
                />
                <span className="text-[0.625rem] text-slate-400 mt-0.5 block">Format: 4 letters, 0, 6 letters/digits</span>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#0B1F54] mb-1">
                  Branch Street Address
                </label>
                <input
                  type="text"
                  value={formData.branchAddress}
                  onChange={(e) => updateField('branchAddress', e.target.value)}
                  placeholder="e.g. F.C. Road, Shivajinagar, Pune - 411004"
                  className="w-full px-3.5 py-2.5 bg-[#F5F7FB] border border-[#D3DDEB] rounded-lg text-sm text-[#0B1F54] focus:outline-none focus:ring-2 focus:ring-[#174EA6]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B1F54] mb-1">
                  FDR Certificate Number (as printed on receipt) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.fdrNumber}
                  onChange={(e) => updateField('fdrNumber', e.target.value)}
                  placeholder="e.g. SBI-FDR-9812401"
                  className="w-full px-3.5 py-2.5 bg-[#F5F7FB] border border-[#D3DDEB] rounded-lg text-sm font-mono text-[#0B1F54] focus:outline-none focus:ring-2 focus:ring-[#174EA6]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B1F54] mb-1">
                  Account Joint Holder Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.accountHolderName}
                  onChange={(e) => updateField('accountHolderName', e.target.value)}
                  placeholder="e.g. Principal Jointly with Regional Officer, AICTE"
                  className="w-full px-3.5 py-2.5 bg-[#F5F7FB] border border-[#D3DDEB] rounded-lg text-sm text-[#0B1F54] focus:outline-none focus:ring-2 focus:ring-[#174EA6]"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: DEPOSIT DETAILS */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-[#0B1F54] flex items-center gap-2">
                <BadgeIndianRupee className="w-4 h-4 text-[#174EA6]" />
                <span>Step 3: Deposit Financials & Tenure Dates</span>
              </h2>
              <p className="text-xs text-[#505F79]">
                Authoritative financial figures in Indian Rupees (INR).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#0B1F54] mb-1">
                  Fixed Deposit Principal Amount (in INR) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-500 font-bold">₹</span>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.depositAmount}
                    onChange={(e) => updateField('depositAmount', e.target.value)}
                    placeholder="3500000"
                    className="w-full pl-8 pr-3.5 py-2.5 bg-[#F5F7FB] border border-[#D3DDEB] rounded-lg text-sm font-bold text-[#0B1F54] focus:outline-none focus:ring-2 focus:ring-[#174EA6]"
                  />
                </div>
                {formData.depositAmount && (
                  <span className="text-[0.6875rem] font-semibold text-[#13805E] mt-1 block">
                    {formatINR(Number(formData.depositAmount))}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B1F54] mb-1">
                  Annual Interest Rate (% p.a.)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="20"
                  value={formData.interestRate}
                  onChange={(e) => updateField('interestRate', e.target.value)}
                  placeholder="7.10"
                  className="w-full px-3.5 py-2.5 bg-[#F5F7FB] border border-[#D3DDEB] rounded-lg text-sm text-[#0B1F54] focus:outline-none focus:ring-2 focus:ring-[#174EA6]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B1F54] mb-1">
                  Deposit Inception / Issue Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.depositDate}
                  onChange={(e) => updateField('depositDate', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F5F7FB] border border-[#D3DDEB] rounded-lg text-sm text-[#0B1F54] focus:outline-none focus:ring-2 focus:ring-[#174EA6]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B1F54] mb-1">
                  Maturity Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.maturityDate}
                  onChange={(e) => updateField('maturityDate', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F5F7FB] border border-[#D3DDEB] rounded-lg text-sm text-[#0B1F54] focus:outline-none focus:ring-2 focus:ring-[#174EA6]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#0B1F54] mb-1">
                  Applicable Statutory Requirement / Scheme
                </label>
                <input
                  type="text"
                  value={formData.applicableSecurityRequirement}
                  onChange={(e) => updateField('applicableSecurityRequirement', e.target.value)}
                  placeholder="e.g. AICTE Mandatory Institutional Corpus Joint Security Deposit"
                  className="w-full px-3.5 py-2.5 bg-[#F5F7FB] border border-[#D3DDEB] rounded-lg text-sm text-[#0B1F54] focus:outline-none focus:ring-2 focus:ring-[#174EA6]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#0B1F54] mb-1">
                  Additional Remarks / Lien Endorsement Notes
                </label>
                <textarea
                  rows={2}
                  value={formData.remarks}
                  onChange={(e) => updateField('remarks', e.target.value)}
                  placeholder="Enter any special joint operation instructions or branch references..."
                  className="w-full px-3.5 py-2.5 bg-[#F5F7FB] border border-[#D3DDEB] rounded-lg text-sm text-[#0B1F54] focus:outline-none focus:ring-2 focus:ring-[#174EA6]"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: DOCUMENT UPLOAD */}
        {step === 4 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-[#0B1F54] flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-[#174EA6]" />
                <span>Step 4: Supporting Document Scan & SHA-256 Hash Sealing</span>
              </h2>
              <p className="text-xs text-[#505F79]">
                Upload official bank FDR certificate scan (PDF or JPG/PNG, max 10MB). Stored safely on device in IndexedDB.
              </p>
            </div>

            {/* Prototype Security Notice */}
            <div className="p-3 bg-[#FEF7EC] border border-[#E89B24] rounded-xl flex items-start gap-3 text-xs text-[#0B1F54]">
              <Info className="w-4 h-4 text-[#C67C11] shrink-0 mt-0.5" />
              <span>
                <strong>Smart India Hackathon Prototype:</strong> Documents remain entirely inside your browser's local IndexedDB. Never upload real sensitive banking or confidential credentials.
              </span>
            </div>

            {/* Drag & Drop Upload Zone */}
            {!formData.fileName ? (
              <label className="border-2 border-dashed border-[#B5C7DF] hover:border-[#174EA6] rounded-2xl p-8 sm:p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-[#F5F7FB] hover:bg-blue-50/30 group">
                <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center text-[#174EA6] group-hover:scale-105 transition-transform mb-3">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <div className="text-sm font-bold text-[#0B1F54]">
                  {isUploading ? 'Computing SHA-256 Fingerprint...' : 'Click to Browse or Drag & Drop Scan'}
                </div>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  Supported formats: PDF, JPEG, PNG, WebP (up to 10 MB).
                </p>
                <input
                  type="file"
                  accept=".pdf,image/jpeg,image/png,image/webp"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>
            ) : (
              /* Attached Document Card */
              <div className="p-4 sm:p-5 bg-white border border-[#D3DDEB] rounded-xl gov-shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 truncate">
                  <div className="w-10 h-10 rounded-xl bg-[#E8F0FE] text-[#174EA6] flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <div className="text-sm font-bold text-[#0B1F54] truncate">{formData.fileName}</div>
                    <div className="text-xs text-[#505F79] font-mono flex items-center gap-2 mt-0.5">
                      <span>{(formData.fileSize / (1024 * 1024)).toFixed(2)} MB</span>
                      <span>&bull;</span>
                      <span className="text-[#13805E] font-bold">IndexedDB Sealed</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    onClick={() => setPreviewOpen(true)}
                    variant="outline"
                    size="sm"
                    icon={Eye}
                    className="text-xs font-semibold"
                  >
                    Preview
                  </Button>
                  <Button
                    type="button"
                    onClick={() => updateField('fileName', '')}
                    variant="outline"
                    size="sm"
                    icon={Trash2}
                    className="text-xs text-rose-600 hover:bg-rose-50 border-rose-200"
                  >
                    Replace
                  </Button>
                </div>
              </div>
            )}

            {formData.sha256Hash && (
              <div className="p-3 bg-[#F5F7FB] border border-[#D3DDEB] rounded-lg text-xs flex items-center gap-2 font-mono text-slate-600">
                <Shield className="w-4 h-4 text-[#13805E] shrink-0" />
                <span className="font-bold text-[#0B1F54]">SHA-256 Digest:</span>
                <span className="truncate text-[0.6875rem]">{formData.sha256Hash}</span>
              </div>
            )}
          </div>
        )}

        {/* STEP 5: REVIEW & DECLARATION */}
        {step === 5 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-[#0B1F54] flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-[#174EA6]" />
                <span>Step 5: Review Submission Dossier & Statutory Affirmation</span>
              </h2>
              <p className="text-xs text-[#505F79]">
                Verify all entered bank credentials and deposit figures before formal transmission to scrutiny queue.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-[#F5F7FB] rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <span className="font-bold text-[#0B1F54] text-sm">Bank Particulars</span>
                  <button type="button" onClick={() => setStep(2)} className="text-[#174EA6] hover:underline font-semibold">
                    Edit
                  </button>
                </div>
                <div><span className="text-slate-500">Bank:</span> <strong className="text-[#0B1F54]">{formData.bankName}</strong></div>
                <div><span className="text-slate-500">Branch:</span> {formData.branchName}</div>
                <div><span className="text-slate-500">IFSC:</span> <span className="font-mono font-bold text-[#174EA6]">{formData.ifsc}</span></div>
                <div><span className="text-slate-500">FDR Number:</span> <span className="font-mono font-bold text-[#0B1F54]">{formData.fdrNumber}</span></div>
                <div><span className="text-slate-500">Joint Account:</span> {formData.accountHolderName}</div>
              </div>

              <div className="p-4 bg-[#F5F7FB] rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <span className="font-bold text-[#0B1F54] text-sm">Deposit Particulars</span>
                  <button type="button" onClick={() => setStep(3)} className="text-[#174EA6] hover:underline font-semibold">
                    Edit
                  </button>
                </div>
                <div>
                  <span className="text-slate-500">Principal Amount:</span>{' '}
                  <strong className="text-base font-black text-[#13805E]">{formatINR(Number(formData.depositAmount))}</strong>
                </div>
                <div><span className="text-slate-500">Interest Rate:</span> {formData.interestRate}% p.a.</div>
                <div><span className="text-slate-500">Inception Date:</span> {formData.depositDate}</div>
                <div><span className="text-slate-500">Maturity Date:</span> <span className="font-semibold text-[#0B1F54]">{formData.maturityDate}</span></div>
                <div><span className="text-slate-500">Requirement:</span> {formData.applicableSecurityRequirement}</div>
              </div>

              <div className="sm:col-span-2 p-4 bg-[#F5F7FB] rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <span className="font-bold text-[#0B1F54] text-sm">Attached Document Scan</span>
                  <button type="button" onClick={() => setStep(4)} className="text-[#174EA6] hover:underline font-semibold">
                    Edit
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-[#0B1F54] flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#174EA6]" />
                    <span>{formData.fileName}</span>
                  </div>
                  <Button type="button" onClick={() => setPreviewOpen(true)} variant="outline" size="sm" className="text-xs">
                    Preview Document
                  </Button>
                </div>
              </div>
            </div>

            {/* Declaration Checkbox */}
            <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.declarationAccepted}
                  onChange={(e) => updateField('declarationAccepted', e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded text-[#174EA6] focus:ring-[#174EA6] border-slate-300"
                />
                <span className="text-xs text-[#0B1F54] leading-relaxed">
                  <strong>Statutory Declaration:</strong> I hereby declare that the Fixed Deposit Receipt details and attached certificate scan are true, accurate, and created jointly with AICTE according to the Approval Process Handbook. I acknowledge that administrative review is client-simulated in this prototype.
                </span>
              </label>
            </div>
          </div>
        )}

        {/* STEP 6: CONFIRMATION */}
        {step === 6 && submittedFdr && (
          <div className="space-y-6 text-center py-6 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-[#E6F4EA] text-[#13805E] flex items-center justify-center mx-auto shadow-sm">
              <Check className="w-8 h-8" />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <Badge variant="green" size="md">
                Submission Transmitted
              </Badge>
              <h2 className="text-2xl font-black text-[#0B1F54]">
                FDR Successfully Submitted!
              </h2>
              <p className="text-xs sm:text-sm text-[#505F79] leading-relaxed">
                Your Fixed Deposit Receipt has been recorded in the platform registry and queued for scrutiny officer evaluation.
              </p>
            </div>

            <div className="p-4 bg-[#F5F7FB] border border-[#D3DDEB] rounded-xl max-w-md mx-auto text-xs text-left space-y-2 font-mono">
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500">Docket Reference:</span>
                <span className="font-bold text-[#174EA6] text-sm">{submittedFdr.referenceNumber}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500">Deposit Amount:</span>
                <span className="font-bold text-[#13805E]">{formatINR(submittedFdr.depositAmountPaise, true)}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500">Issuing Bank:</span>
                <span className="text-slate-700 font-semibold">{submittedFdr.bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Initial Status:</span>
                <span className="text-[#174EA6] font-bold">SUBMITTED (Pending Review)</span>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
              <Button
                to={`/institution/fdr/${submittedFdr.id}`}
                variant="primary"
                size="lg"
                icon={ArrowRight}
                iconPosition="right"
                className="font-bold w-full sm:w-auto"
              >
                View FDR Docket
              </Button>
              <Button
                to="/institution/fdr-records"
                variant="outline"
                size="lg"
                icon={FileText}
                className="w-full sm:w-auto font-semibold"
              >
                All FDR Records
              </Button>
            </div>
          </div>
        )}

        {/* Wizard Controls */}
        {step < 6 && (
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
            <div>
              {step > 1 && (
                <Button
                  type="button"
                  onClick={handleBack}
                  variant="outline"
                  size="md"
                  icon={ArrowLeft}
                >
                  Previous Step
                </Button>
              )}
            </div>

            <div>
              {step < 5 ? (
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
                  className="font-bold shadow-md bg-[#13805E] hover:bg-[#0f6a4e] border-[#13805E]"
                >
                  {isSubmitting ? 'Transmitting Submission...' : 'Confirm & Submit FDR'}
                </Button>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Discard Draft Modal */}
      {discardModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="app-modal fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        >
          <div className="bg-white rounded-xl border border-[#D3DDEB] max-w-md w-full p-6 gov-shadow-lg space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#0B1F54]">Discard FDR Draft?</h3>
            </div>
            <p className="text-xs sm:text-sm text-[#505F79] leading-relaxed">
              Are you sure you want to discard this draft? Any entered deposit details and attached document will be deleted from browser storage.
            </p>
            <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
              <Button onClick={() => setDiscardModalOpen(false)} variant="outline" size="sm">
                Cancel
              </Button>
              <Button onClick={handleDiscardDraft} variant="primary" size="sm" className="bg-rose-700 hover:bg-rose-800 text-white border-rose-700">
                Yes, Discard Draft
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        documentId={formData.documentId}
        fileName={formData.fileName}
        fileType={formData.fileType}
        fileSize={formData.fileSize}
        sha256Hash={formData.sha256Hash}
      />
    </div>
  );
}
