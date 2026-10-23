import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Save,
  Send,
  Building,
  Calendar,
  IndianRupee,
  ShieldCheck,
  FileText,
  Info,
} from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { fdrRepository } from '../../storage/fdrRepository';
import { renewalRequestRepository } from '../../storage/renewalRequestRepository';
import { evaluateRenewalEligibility, validateReplacementFdrs } from '../../renewal/renewalEligibilityEngine';
import { calculateDepositContinuity, toPaise } from '../../renewal/renewalContinuityEngine';
import { RENEWAL_TYPES, RENEWAL_STATUS, RENEWAL_PROTOTYPE_DISCLAIMER } from '../../renewal/renewalModel';

const WIZARD_STEPS = [
  { id: 1, title: 'Original FDR' },
  { id: 2, title: 'Renewal Type' },
  { id: 3, title: 'Replacement Details' },
  { id: 4, title: 'Supporting Proof' },
  { id: 5, title: 'Continuity Review' },
  { id: 6, title: 'Declaration & Submit' },
];

export default function RenewalRequestWizard() {
  const { fdrId } = useParams();
  const navigate = useNavigate();
  const { currentInstitution, user } = useAuth();

  const institutionId = currentInstitution?.id || user?.institutionId || 'inst-001';

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Source FDR & Institution FDRs
  const [originalFdr, setOriginalFdr] = useState(null);
  const [availableFdrs, setAvailableFdrs] = useState([]);
  const [eligibility, setEligibility] = useState(null);

  // Form State
  const [renewalType, setRenewalType] = useState(RENEWAL_TYPES.REPLACEMENT_FDR);
  const [proposedMaturityDate, setProposedMaturityDate] = useState('');
  const [selectedReplacementIds, setSelectedReplacementIds] = useState([]);
  const [manualReplacements, setManualReplacements] = useState([]);
  const [documentNotes, setDocumentNotes] = useState('');
  const [declaredLegalCompliance, setDeclaredLegalCompliance] = useState(false);
  const [draftId, setDraftId] = useState(null);

  // Continuity Evaluation
  const [continuityResult, setContinuityResult] = useState(null);

  useEffect(() => {
    loadWizardData();
  }, [fdrId, institutionId]);

  const loadWizardData = async () => {
    try {
      setLoading(true);
      setError('');

      const allInstFdrs = await fdrRepository.getFdrsByInstitutionId(institutionId);
      setAvailableFdrs(allInstFdrs);

      let target = null;
      if (fdrId) {
        target = allInstFdrs.find((f) => String(f.id || f.fdrId) === String(fdrId));
      } else if (allInstFdrs.length > 0) {
        target = allInstFdrs[0];
      }

      if (!target) {
        setError('No eligible FDR record found for renewal.');
        setLoading(false);
        return;
      }

      setOriginalFdr(target);

      // Check eligibility
      const existingReqs = await renewalRequestRepository.getRequestsByInstitutionId(institutionId);
      const elig = evaluateRenewalEligibility(target, institutionId, existingReqs);
      setEligibility(elig);

      // Check if draft already exists
      const activeDraft = existingReqs.find(
        (r) => String(r.originalFdrId) === String(target.id || target.fdrId) && r.status === RENEWAL_STATUS.DRAFT
      );
      if (activeDraft) {
        setDraftId(activeDraft.renewalRequestId);
        setRenewalType(activeDraft.renewalType || RENEWAL_TYPES.REPLACEMENT_FDR);
        setSelectedReplacementIds(activeDraft.replacementFdrIds || []);
        setProposedMaturityDate(activeDraft.proposedMaturityDate || '');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to initialize renewal wizard.');
    } finally {
      setLoading(false);
    }
  };

  // Recalculate continuity when step 5 is active or inputs change
  useEffect(() => {
    if (!originalFdr) return;

    let replacementRecords = [];
    if (renewalType === RENEWAL_TYPES.REPLACEMENT_FDR || renewalType === RENEWAL_TYPES.MULTIPLE_REPLACEMENT_FDRS) {
      replacementRecords = availableFdrs.filter((f) => selectedReplacementIds.includes(String(f.id || f.fdrId)));
    }

    const result = calculateDepositContinuity({
      originalFdr,
      replacementFdrs: replacementRecords,
      renewalType,
      proposedMaturityDate,
    });

    setContinuityResult(result);
  }, [originalFdr, renewalType, selectedReplacementIds, proposedMaturityDate, availableFdrs]);

  const toggleReplacementFdr = (id) => {
    const sId = String(id);
    if (renewalType === RENEWAL_TYPES.REPLACEMENT_FDR) {
      setSelectedReplacementIds([sId]);
    } else {
      setSelectedReplacementIds((prev) =>
        prev.includes(sId) ? prev.filter((item) => item !== sId) : [...prev, sId]
      );
    }
  };

  const handleSaveDraft = async () => {
    if (!originalFdr) return;
    try {
      setSubmitting(true);
      const payload = {
        institutionId,
        institutionName: originalFdr.institutionName || currentInstitution?.name,
        originalFdrId: originalFdr.id || originalFdr.fdrId,
        originalFdrNumber: originalFdr.fdrNumber,
        replacementFdrIds: selectedReplacementIds,
        renewalType,
        oldMaturityDate: originalFdr.maturityDate,
        proposedMaturityDate,
        originalAmountPaise: originalFdr.depositAmountPaise || originalFdr.amountPaise || 0,
        replacementTotalPaise: continuityResult?.replacementTotalPaise || 0,
        continuityStatus: continuityResult?.continuityStatus,
        officerNotes: documentNotes ? [documentNotes] : [],
        requestedBy: user?.id || 'institution-user',
      };

      if (draftId) {
        await renewalRequestRepository.updateDraft(draftId, payload);
      } else {
        const saved = await renewalRequestRepository.createRequest(payload, true);
        setDraftId(saved.renewalRequestId);
      }

      alert('Renewal request draft saved successfully.');
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitApplication = async () => {
    if (!declaredLegalCompliance) {
      alert('Please check the statutory declaration before final submission.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        institutionId,
        institutionName: originalFdr.institutionName || currentInstitution?.name,
        originalFdrId: originalFdr.id || originalFdr.fdrId,
        originalFdrNumber: originalFdr.fdrNumber,
        replacementFdrIds: selectedReplacementIds,
        renewalType,
        oldMaturityDate: originalFdr.maturityDate,
        proposedMaturityDate,
        originalAmountPaise: originalFdr.depositAmountPaise || originalFdr.amountPaise || 0,
        replacementTotalPaise: continuityResult?.replacementTotalPaise || 0,
        continuityStatus: continuityResult?.continuityStatus,
        officerNotes: documentNotes ? [documentNotes] : [],
        requestedBy: user?.id || 'institution-user',
      };

      if (draftId) {
        // Transition existing draft to submitted
        await renewalRequestRepository.updateDraft(draftId, payload);
        await renewalRequestRepository.transitionStatus(draftId, RENEWAL_STATUS.SUBMITTED, {
          actorId: user?.id || 'institution-user',
          actorRole: 'institution',
          reason: 'Application submitted after wizard completion',
        });
      } else {
        await renewalRequestRepository.createRequest(payload, false);
      }

      navigate('/institution/renewals');
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-sm text-gray-500">
        Loading FDR renewal wizard...
      </div>
    );
  }

  if (error || !originalFdr) {
    return (
      <div className="p-6 bg-white rounded-lg border border-red-200 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto" />
        <h2 className="text-lg font-bold text-gray-900">Renewal Initiation Error</h2>
        <p className="text-sm text-gray-600">{error || 'Certificate not available.'}</p>
        <Link
          to="/institution/renewals"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#174EA6] rounded hover:bg-[#0B1F54]"
        >
          Return to Renewals
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-100 text-[#0B1F54]">
              Renewal Wizard
            </span>
            <span className="text-xs font-medium text-gray-500">
              Certificate #{originalFdr.fdrNumber}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#0B1F54] mt-1 flex items-center gap-2">
            <RotateCcw className="w-6 h-6 text-[#174EA6]" />
            FDR Renewal & Replacement Application
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveDraft}
            disabled={submitting}
            className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            Save Draft
          </button>
        </div>
      </div>

      {/* Stepper Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
        <div className="flex items-center justify-between">
          {WIZARD_STEPS.map((step, idx) => (
            <div key={step.id} className="flex items-center flex-1">
              <div
                className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition ${
                  currentStep === step.id
                    ? 'bg-[#174EA6] text-white shadow'
                    : currentStep > step.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-500 border border-gray-300'
                }`}
              >
                {currentStep > step.id ? '✓' : step.id}
              </div>
              <span
                className={`ml-2 text-xs font-semibold hidden md:inline ${
                  currentStep === step.id
                    ? 'text-[#0B1F54]'
                    : currentStep > step.id
                    ? 'text-emerald-700'
                    : 'text-gray-400'
                }`}
              >
                {step.title}
              </span>
              {idx < WIZARD_STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-3 hidden sm:block ${
                    currentStep > step.id ? 'bg-emerald-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Wizard Step Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm min-h-[360px]">
        {/* Step 1: Original FDR Details */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-[#0B1F54] border-b pb-2">
              Step 1: Original Certificate Under Scrutiny
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-gray-50 rounded border border-gray-200 space-y-2">
                <div>
                  <span className="text-gray-500 block">FDR Number:</span>
                  <span className="font-bold text-gray-900 text-sm">{originalFdr.fdrNumber}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Issuing Bank & Branch:</span>
                  <span className="font-semibold text-gray-800">
                    {originalFdr.bankName} — {originalFdr.branchName || 'Main Branch'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">Current Maturity Date:</span>
                  <span className="font-bold text-rose-700">{originalFdr.maturityDate}</span>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded border border-gray-200 space-y-2">
                <div>
                  <span className="text-gray-500 block">Deposit Principal:</span>
                  <span className="font-bold text-gray-900 text-sm">
                    ₹{(((originalFdr.depositAmountPaise || originalFdr.amountPaise || 0) / 100)).toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">Joint Lien Beneficiary:</span>
                  <span className="font-semibold text-gray-800">
                    {originalFdr.lienMarkedTo || 'Competent Regulatory Authority (AICTE)'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">Current Lifecycle Status:</span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 inline-block">
                    {originalFdr.status || 'ACTIVE'}
                  </span>
                </div>
              </div>
            </div>

            {eligibility && (
              <div
                className={`p-3 rounded text-xs border ${
                  eligibility.eligible
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                <div className="font-semibold flex items-center gap-1.5">
                  {eligibility.eligible ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  )}
                  Renewal Eligibility Status: {eligibility.outcome}
                </div>
                <p className="mt-1">{eligibility.reason}</p>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Renewal Type */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-[#0B1F54] border-b pb-2">
              Step 2: Select Renewal Classification
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                {
                  type: RENEWAL_TYPES.REPLACEMENT_FDR,
                  title: 'Replacement FDR (1:1)',
                  desc: 'A new successor FDR replaces the maturing certificate with identical or greater coverage.',
                },
                {
                  type: RENEWAL_TYPES.EXTENSION_OF_EXISTING_FDR,
                  title: 'Tenure Extension of Same FDR',
                  desc: 'The issuing bank has extended the maturity date of the existing physical/e-FDR.',
                },
                {
                  type: RENEWAL_TYPES.MULTIPLE_REPLACEMENT_FDRS,
                  title: 'Multiple Replacement FDRs (1:Many)',
                  desc: 'Multiple certificates combined to meet or exceed the required security deposit amount.',
                },
                {
                  type: RENEWAL_TYPES.PARTIAL_REPLACEMENT,
                  title: 'Partial Replacement',
                  desc: 'Replacement deposit submitted with reduced principal (requires regulatory justification).',
                },
              ].map((opt) => (
                <div
                  key={opt.type}
                  onClick={() => setRenewalType(opt.type)}
                  className={`p-4 rounded-lg border cursor-pointer transition ${
                    renewalType === opt.type
                      ? 'border-[#174EA6] bg-blue-50/50 ring-1 ring-[#174EA6]'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-bold text-sm text-[#0B1F54] flex items-center justify-between">
                    <span>{opt.title}</span>
                    <input
                      type="radio"
                      name="renewalType"
                      checked={renewalType === opt.type}
                      onChange={() => setRenewalType(opt.type)}
                      className="text-[#174EA6]"
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-1.5">{opt.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Replacement Deposit Details */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-[#0B1F54] border-b pb-2">
              Step 3: Replacement / Extension Deposit Details
            </h2>

            {renewalType === RENEWAL_TYPES.EXTENSION_OF_EXISTING_FDR ? (
              <div className="space-y-3 max-w-md">
                <label className="block text-xs font-semibold text-gray-700">
                  New Extended Maturity Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={proposedMaturityDate}
                  onChange={(e) => setProposedMaturityDate(e.target.value)}
                  className="w-full text-xs p-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#174EA6]"
                />
                <p className="text-[11px] text-gray-500">
                  Must be after current maturity date ({originalFdr.maturityDate}). Minimum recommended duration: 36–60 months.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-gray-600">
                  Select successor FDR(s) from your institution's registered certificates:
                </p>

                <div className="divide-y divide-gray-200 border border-gray-200 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                  {availableFdrs
                    .filter((f) => String(f.id || f.fdrId) !== String(originalFdr.id || originalFdr.fdrId))
                    .map((rep) => {
                      const repId = String(rep.id || rep.fdrId);
                      const isSelected = selectedReplacementIds.includes(repId);

                      return (
                        <div
                          key={repId}
                          onClick={() => toggleReplacementFdr(repId)}
                          className={`p-3 text-xs flex items-center justify-between cursor-pointer transition ${
                            isSelected ? 'bg-blue-50/70' : 'hover:bg-gray-50'
                          }`}
                        >
                          <div>
                            <div className="font-bold text-gray-900">{rep.fdrNumber}</div>
                            <div className="text-[11px] text-gray-500">
                              {rep.bankName} • Maturity: {rep.maturityDate}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-gray-800">
                              ₹{(((rep.depositAmountPaise || rep.amountPaise || 0) / 100)).toLocaleString('en-IN')}
                            </span>
                            <input
                              type={renewalType === RENEWAL_TYPES.MULTIPLE_REPLACEMENT_FDRS ? 'checkbox' : 'radio'}
                              checked={isSelected}
                              onChange={() => toggleReplacementFdr(repId)}
                              className="text-[#174EA6]"
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>

                {selectedReplacementIds.length === 0 && (
                  <p className="text-xs text-rose-600">
                    Please select at least one replacement certificate to proceed.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Supporting Proof */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-[#0B1F54] border-b pb-2">
              Step 4: Supporting Documents & Bank Letters
            </h2>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Issuing Bank Letter / Renewal Endorsement Notes
              </label>
              <textarea
                rows={4}
                value={documentNotes}
                onChange={(e) => setDocumentNotes(e.target.value)}
                placeholder="Enter bank confirmation letter reference, sanction memorandum details, or branch manager endorsement note..."
                className="w-full text-xs p-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#174EA6]"
              />
            </div>

            <div className="p-3 bg-blue-50 rounded border border-blue-200 text-xs text-blue-900 flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Integrated Document Storage: </span>
                Uploaded scanned PDF/JPEG certificates remain persisted in your browser's client-side IndexedDB repository. No external server upload is executed.
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Continuity Review */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-[#0B1F54] border-b pb-2">
              Step 5: Pre-Submission Deposit Continuity Evaluation
            </h2>

            {continuityResult && (
              <div className="space-y-4">
                <div
                  className={`p-4 rounded-lg border ${
                    continuityResult.continuityStatus === 'CONTINUOUS_DECLARED_COVERAGE'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : continuityResult.continuityStatus === 'PARTIAL_DECLARED_COVERAGE'
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm flex items-center gap-1.5">
                      {continuityResult.continuityStatus === 'CONTINUOUS_DECLARED_COVERAGE' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-rose-600" />
                      )}
                      Continuity Status: {continuityResult.continuityStatus}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-white/70">
                      Baseline: ₹{(continuityResult.requiredDepositPaise / 100).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p className="text-xs mt-1.5">{continuityResult.explanation}</p>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-gray-50 rounded border border-gray-200">
                    <span className="text-[11px] text-gray-500 block">Coverage Before</span>
                    <span className="text-sm font-bold text-gray-800">
                      ₹{(continuityResult.coverageBeforeRenewal / 100).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded border border-gray-200">
                    <span className="text-[11px] text-gray-500 block">Coverage During</span>
                    <span className="text-sm font-bold text-gray-800">
                      ₹{(continuityResult.coverageDuringTransition / 100).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded border border-gray-200">
                    <span className="text-[11px] text-gray-500 block">Coverage After</span>
                    <span className="text-sm font-bold text-gray-800">
                      ₹{(continuityResult.coverageAfterRenewal / 100).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {continuityResult.uncoveredIntervals?.length > 0 && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-900 space-y-1">
                    <span className="font-semibold">Identified Uncovered Windows:</span>
                    {continuityResult.uncoveredIntervals.map((gap, i) => (
                      <div key={i} className="text-[11px]">
                        • {gap.startDate} to {gap.endDate || 'Ongoing'}: {gap.reason}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 6: Declaration & Submit */}
        {currentStep === 6 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-[#0B1F54] border-b pb-2">
              Step 6: Statutory Declaration & Formal Submission
            </h2>

            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3 text-xs text-gray-700">
              <p className="font-semibold text-gray-900">Institutional Declaration:</p>
              <p>
                1. I certify that the replacement / extended deposit details submitted herein represent genuine financial security created in joint name with the regulatory authority.
              </p>
              <p>
                2. I acknowledge that administrative record acceptance in NidhiSetu does not constitute a commercial banking lien discharge or release of underlying collateral.
              </p>
              <p>
                3. The institution agrees to furnish original physical receipts or bank advice upon official requisition by the scrutiny officer.
              </p>

              <label className="flex items-start gap-2 pt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={declaredLegalCompliance}
                  onChange={(e) => setDeclaredLegalCompliance(e.target.checked)}
                  className="mt-0.5 rounded text-[#174EA6]"
                />
                <span className="font-semibold text-gray-900">
                  I confirm and accept the above declarations on behalf of {originalFdr.institutionName || currentInstitution?.name}.
                </span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <button
          type="button"
          disabled={currentStep === 1}
          onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
          className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition disabled:opacity-40 flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Previous Step
        </button>

        <div className="flex items-center gap-2">
          {currentStep < 6 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => Math.min(6, prev + 1))}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#174EA6] rounded hover:bg-[#0B1F54] transition flex items-center gap-1.5 shadow-sm"
            >
              Continue
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting || !declaredLegalCompliance}
              onClick={handleSubmitApplication}
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-700 rounded hover:bg-emerald-800 transition disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              {submitting ? 'Submitting...' : 'Submit Renewal Application'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
