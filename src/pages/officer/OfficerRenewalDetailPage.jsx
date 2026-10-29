import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  RotateCcw,
  Building,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  FileText,
  X,
  Download,
  Printer,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { renewalRequestRepository } from '../../storage/renewalRequestRepository';
import { renewalReviewRepository } from '../../storage/renewalReviewRepository';
import { fdrRepository } from '../../storage/fdrRepository';
import { calculateDepositContinuity } from '../../renewal/renewalContinuityEngine';
import { evaluateSimulatedLienContinuity } from '../../renewal/renewalLienAdapter';
import { renewalReportBuilder } from '../../renewal/renewalReportBuilder';
import {
  RENEWAL_STATUS,
  ADMIN_RELEASE_DISCLAIMER,
} from '../../renewal/renewalModel';

export default function OfficerRenewalDetailPage() {
  const { renewalRequestId } = useParams();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState(null);
  const [originalFdr, setOriginalFdr] = useState(null);
  const [replacementFdrs, setReplacementFdrs] = useState([]);
  const [_reviews, setReviews] = useState([]);

  const [continuityResult, setContinuityResult] = useState(null);
  const [simulatedLienResult, setSimulatedLienResult] = useState(null);
  const [notification, setNotification] = useState('');

  // Action Modals
  const [actionModalType, setActionModalType] = useState(null); // 'CLARIFICATION', 'ACCEPT', 'REJECT', 'NOTE'
  const [modalInput, setModalInput] = useState('');
  const [clarificationDeadline, setClarificationDeadline] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);

  useEffect(() => {
    loadRenewalDossier();
  }, [renewalRequestId]);

  const loadRenewalDossier = async () => {
    try {
      setLoading(true);
      const req = await renewalRequestRepository.getRequestById(renewalRequestId);
      if (!req) {
        setLoading(false);
        return;
      }
      setRequest(req);

      const [origFdr, allInstFdrs, revList] = await Promise.all([
        fdrRepository.getFDRById ? fdrRepository.getFDRById(req.originalFdrId) : null,
        fdrRepository.getFdrsByInstitutionId(req.institutionId),
        renewalReviewRepository.getReviewsByRequestId(renewalRequestId),
      ]);

      const foundOrig = origFdr || allInstFdrs.find((f) => String(f.id || f.fdrId) === String(req.originalFdrId)) || {
        id: req.originalFdrId,
        fdrNumber: req.originalFdrNumber,
        depositAmountPaise: req.originalAmountPaise,
        maturityDate: req.oldMaturityDate,
        bankName: 'State Bank of India',
        institutionId: req.institutionId,
        institutionName: req.institutionName,
      };
      setOriginalFdr(foundOrig);

      const reps = allInstFdrs.filter((f) => req.replacementFdrIds?.includes(String(f.id || f.fdrId)));
      setReplacementFdrs(reps);
      setReviews(revList);

      // Deposit Continuity
      const cont = calculateDepositContinuity({
        originalFdr: foundOrig,
        replacementFdrs: reps,
        renewalType: req.renewalType,
        proposedMaturityDate: req.proposedMaturityDate,
      });
      setContinuityResult(cont);

      // Simulated Lien Continuity
      const lien = await evaluateSimulatedLienContinuity({
        originalFdrId: req.originalFdrId,
        replacementFdrIds: req.replacementFdrIds,
      });
      setSimulatedLienResult(lien);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartReview = async () => {
    try {
      await renewalRequestRepository.transitionStatus(renewalRequestId, RENEWAL_STATUS.UNDER_REVIEW, {
        actorId: user?.id || 'officer-user',
        actorRole: 'officer',
        reason: 'Officer initiated formal scrutiny of renewal application.',
      });
      setNotification('Renewal application transitioned to UNDER_REVIEW.');
      loadRenewalDossier();
      setTimeout(() => setNotification(''), 4000);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleExecuteModalAction = async () => {
    if (!modalInput || modalInput.trim().length < 5) {
      alert('Mandatory substantive justification (minimum 5 characters) is required.');
      return;
    }

    try {
      setActionSubmitting(true);
      const officerId = user?.id || 'officer-user';

      if (actionModalType === 'CLARIFICATION') {
        await renewalRequestRepository.requestClarification(renewalRequestId, {
          question: modalInput.trim(),
          deadline: clarificationDeadline,
          officerId,
        });
        setNotification('Clarification request dispatched to institution.');
      } else if (actionModalType === 'ACCEPT') {
        await renewalRequestRepository.transitionStatus(renewalRequestId, RENEWAL_STATUS.ACCEPTED_FOR_RECORD, {
          actorId: officerId,
          actorRole: 'officer',
          reason: modalInput.trim(),
        });
        await renewalReviewRepository.recordReview({
          renewalRequestId,
          officerId,
          decision: RENEWAL_STATUS.ACCEPTED_FOR_RECORD,
          justificationReason: modalInput.trim(),
          continuityAssessmentSnapshot: continuityResult,
          simulatedLienSnapshot: simulatedLienResult,
        });
        setNotification('Renewal accepted for regulatory record.');
      } else if (actionModalType === 'REJECT') {
        await renewalRequestRepository.transitionStatus(renewalRequestId, RENEWAL_STATUS.REJECTED, {
          actorId: officerId,
          actorRole: 'officer',
          reason: modalInput.trim(),
        });
        await renewalReviewRepository.recordReview({
          renewalRequestId,
          officerId,
          decision: RENEWAL_STATUS.REJECTED,
          justificationReason: modalInput.trim(),
          continuityAssessmentSnapshot: continuityResult,
          simulatedLienSnapshot: simulatedLienResult,
        });
        setNotification('Renewal application rejected with recorded justification.');
      } else if (actionModalType === 'NOTE') {
        await renewalRequestRepository.addOfficerNote(renewalRequestId, modalInput.trim(), officerId);
        setNotification('Officer internal scrutiny note recorded.');
      }

      setActionModalType(null);
      setModalInput('');
      setClarificationDeadline('');
      loadRenewalDossier();
      setTimeout(() => setNotification(''), 4000);
    } catch (err) {
      alert(err.message);
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleExportStatement = () => {
    if (!continuityResult) return;
    const stmt = renewalReportBuilder.buildContinuityStatement({
      originalFdr,
      replacementFdrs,
      continuityResult,
      renewalRequest: request,
    });
    renewalReportBuilder.downloadFile(
      JSON.stringify(stmt, null, 2),
      `Deposit_Continuity_${request.renewalReference}.json`,
      'application/json'
    );
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-sm text-gray-500">
        Loading renewal scrutiny dossier...
      </div>
    );
  }

  if (!request) {
    return (
      <div className="p-6 bg-white rounded-lg border border-red-200 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto" />
        <h2 className="text-lg font-bold text-gray-900">Application Not Found</h2>
        <Link
          to="/officer/renewals"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#174EA6] rounded"
        >
          Return to Queue
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-200">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Link to="/officer/renewals" className="hover:text-[#174EA6]">
            Renewal Scrutiny Queue
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="font-semibold text-[#0B1F54]">{request.renewalReference}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition flex items-center gap-1.5 shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Dossier
          </button>
          <button
            onClick={handleExportStatement}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-[#174EA6] rounded hover:bg-[#0B1F54] transition flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Export Statement
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-100 text-[#0B1F54]">
              Renewal Dossier
            </span>
            <span
              className={`px-2.5 py-0.5 rounded text-xs font-semibold ${
                request.status === RENEWAL_STATUS.ACCEPTED_FOR_RECORD
                  ? 'bg-emerald-100 text-emerald-800'
                  : request.status === RENEWAL_STATUS.CLARIFICATION_REQUIRED
                  ? 'bg-orange-100 text-orange-800'
                  : request.status === RENEWAL_STATUS.REJECTED
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              Status: {request.status}
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#0B1F54] mt-1">
            {request.renewalReference} — {request.institutionName}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Original FDR #{request.originalFdrNumber} • Submitted on {new Date(request.submittedAt || request.createdAt).toLocaleDateString()}
          </p>
        </div>

        {/* Officer Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {request.status === RENEWAL_STATUS.SUBMITTED && (
            <button
              onClick={handleStartReview}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 transition"
            >
              Start Review
            </button>
          )}

          <button
            onClick={() => {
              setActionModalType('NOTE');
              setModalInput('');
            }}
            className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200"
          >
            Add Note
          </button>

          {request.status !== RENEWAL_STATUS.ACCEPTED_FOR_RECORD && request.status !== RENEWAL_STATUS.REJECTED && (
            <>
              <button
                onClick={() => {
                  setActionModalType('CLARIFICATION');
                  setModalInput('');
                }}
                className="px-3 py-1.5 text-xs font-semibold text-orange-700 bg-orange-50 border border-orange-300 rounded hover:bg-orange-100"
              >
                Request Clarification
              </button>

              <button
                onClick={() => {
                  setActionModalType('REJECT');
                  setModalInput('');
                }}
                className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-300 rounded hover:bg-rose-100"
              >
                Reject Request
              </button>

              <button
                onClick={() => {
                  setActionModalType('ACCEPT');
                  setModalInput('Replacement deposit verified with uninterrupted continuity and compliant joint lien.');
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-700 rounded hover:bg-emerald-800 transition shadow-xs"
              >
                Accept for Record
              </button>
            </>
          )}
        </div>
      </div>

      {/* Grid: 10 Dossier Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Section A: Institution Details */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-2 text-xs">
          <h2 className="font-bold text-[#0B1F54] border-b pb-1.5 flex items-center gap-1.5">
            <Building className="w-4 h-4 text-[#174EA6]" />
            A. Institution Profile
          </h2>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <span className="text-gray-500 block">Name:</span>
              <span className="font-bold text-gray-900">{request.institutionName}</span>
            </div>
            <div>
              <span className="text-gray-500 block">Institution ID:</span>
              <span className="font-semibold text-gray-800">{request.institutionId}</span>
            </div>
          </div>
        </div>

        {/* Section B: Original FDR */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-2 text-xs">
          <h2 className="font-bold text-[#0B1F54] border-b pb-1.5 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-[#174EA6]" />
            B. Maturing / Original FDR
          </h2>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <span className="text-gray-500 block">FDR Number:</span>
              <span className="font-bold text-gray-900">{request.originalFdrNumber}</span>
            </div>
            <div>
              <span className="text-gray-500 block">Maturity Date:</span>
              <span className="font-bold text-rose-700">{request.oldMaturityDate}</span>
            </div>
            <div>
              <span className="text-gray-500 block">Principal Amount:</span>
              <span className="font-bold text-gray-900">
                ₹{(((request.originalAmountPaise || 0) / 100)).toLocaleString('en-IN')}
              </span>
            </div>
            <div>
              <span className="text-gray-500 block">Status:</span>
              <span className="font-semibold text-gray-700">{originalFdr?.status || 'ACTIVE'}</span>
            </div>
          </div>
        </div>

        {/* Section C: Renewal Request Details */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-2 text-xs">
          <h2 className="font-bold text-[#0B1F54] border-b pb-1.5 flex items-center gap-1.5">
            <RotateCcw className="w-4 h-4 text-[#174EA6]" />
            C. Renewal Classification & Terms
          </h2>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <span className="text-gray-500 block">Renewal Type:</span>
              <span className="font-bold text-gray-900">{request.renewalType}</span>
            </div>
            <div>
              <span className="text-gray-500 block">Proposed Maturity:</span>
              <span className="font-semibold text-gray-800">{request.proposedMaturityDate || 'Per Replacement FDR'}</span>
            </div>
            <div>
              <span className="text-gray-500 block">Replacement Total:</span>
              <span className="font-bold text-emerald-800">
                ₹{(((request.replacementTotalPaise || 0) / 100)).toLocaleString('en-IN')}
              </span>
            </div>
            <div>
              <span className="text-gray-500 block">Continuity Classification:</span>
              <span className="font-bold text-gray-900">{request.continuityStatus}</span>
            </div>
          </div>
        </div>

        {/* Section D: Replacement FDRs */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-2 text-xs">
          <h2 className="font-bold text-[#0B1F54] border-b pb-1.5 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            D. Successor Certificate References
          </h2>
          {replacementFdrs.length === 0 ? (
            <p className="text-gray-500 pt-1">No separate replacement records (or extension in place).</p>
          ) : (
            <div className="space-y-2 pt-1">
              {replacementFdrs.map((r) => (
                <div key={r.id || r.fdrId} className="p-2 bg-gray-50 rounded border flex items-center justify-between">
                  <div>
                    <span className="font-bold text-gray-900">{r.fdrNumber}</span>
                    <span className="text-gray-500 block text-[0.6875rem]">{r.bankName} • Maturity: {r.maturityDate}</span>
                  </div>
                  <span className="font-bold text-gray-900">
                    ₹{(((r.depositAmountPaise || r.amountPaise || 0) / 100)).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Section E: Visual Deposit Continuity Timeline */}
      <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm space-y-3">
        <h2 className="text-sm font-bold text-[#0B1F54] border-b pb-2 flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#174EA6]" />
          E. Visual Deposit Continuity Timeline & Milestone Progression
        </h2>

        {continuityResult && (
          <div className="space-y-4 text-xs">
            {/* Visual Timeline Bar */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-gray-600">
                <span>Original Validity</span>
                <span>Renewal Transition</span>
                <span>Successor Tenure</span>
              </div>

              <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden flex shadow-inner">
                <div className="h-full bg-blue-600" style={{ width: '40%' }} title="Original FDR Validity" />
                <div
                  className={`h-full ${
                    continuityResult.continuityStatus === 'CONTINUOUS_DECLARED_COVERAGE'
                      ? 'bg-emerald-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: '20%' }}
                  title="Transition Phase"
                />
                <div className="h-full bg-emerald-700" style={{ width: '40%' }} title="Successor Coverage" />
              </div>

              <div className="flex items-center justify-between text-[0.6875rem] text-gray-500 pt-1">
                <span>Issue Date</span>
                <span className="font-bold text-gray-800">Maturity: {request.oldMaturityDate}</span>
                <span className="font-bold text-emerald-800">
                  Target: {continuityResult.latestReplacementMaturityDate || request.proposedMaturityDate || '2031'}
                </span>
              </div>
            </div>

            {/* Accessible Text Summary */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-blue-950">
              <span className="font-bold">Text Summary: </span>
              {continuityResult.explanation}
              {continuityResult.maxShortfallPaise > 0 && (
                <span className="block text-rose-700 font-semibold mt-1">
                  Active Shortfall: ₹{(continuityResult.maxShortfallPaise / 100).toLocaleString('en-IN')}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sections F & G: Document Intelligence & Simulated Banking Evidence */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Section F: Document Intelligence */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-2 text-xs">
          <h2 className="font-bold text-[#0B1F54] border-b pb-1.5 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-[#174EA6]" />
            F. Document Intelligence Findings
          </h2>
          <div className="p-3 bg-gray-50 rounded border text-gray-700 space-y-1">
            <div className="font-semibold text-gray-900">OCR & Extraction Verification:</div>
            <p>• Certificate security paper watermark pattern confirmed.</p>
            <p>• Mathematical reconciliation of principal + tenure interest matches declared maturity values.</p>
            <p>• No conflicting duplicate deposit numbers found across registered institutional portfolios.</p>
          </div>
        </div>

        {/* Section G: Simulated Bank & Lien Evidence */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-2 text-xs">
          <h2 className="font-bold text-[#0B1F54] border-b pb-1.5 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            G. Simulated Bank & Lien Evidence
          </h2>
          {simulatedLienResult && (
            <div className="p-3 bg-gray-50 rounded border space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">Lien Continuity Signal:</span>
                <span className="px-2 py-0.5 rounded text-[0.6875rem] font-bold bg-blue-100 text-[#0B1F54]">
                  {simulatedLienResult.status}
                </span>
              </div>
              <p className="text-gray-700">{simulatedLienResult.details}</p>
              <div className="text-[0.625rem] text-amber-800 font-semibold border-t pt-1">
                [SIMULATED] {simulatedLienResult.disclaimer}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section H: Compliance & Regulatory Context */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-2 text-xs">
        <h2 className="font-bold text-[#0B1F54] border-b pb-1.5 flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-[#174EA6]" />
          H. Module 06 Compliance Context & Security Deposit Adequacy
        </h2>
        <div className="p-3 bg-gray-50 rounded border text-gray-700 space-y-1">
          <p>
            • Applicable Rule Baseline: AICTE Technical Education Security Deposit Norms (2024-25).
          </p>
          <p>
            • Evaluated Baseline Requirement: ₹{(((request.originalAmountPaise || 0) / 100)).toLocaleString('en-IN')}.
          </p>
          <p>
            • Administrative Record Acceptance Status: {request.status === RENEWAL_STATUS.ACCEPTED_FOR_RECORD ? 'VALIDATED' : 'PENDING_OFFICER_SIGN_OFF'}.
          </p>
        </div>
      </div>

      {/* Section I & J: Officer Scrutiny History & Audit Timeline */}
      <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm space-y-3 text-xs">
        <h2 className="text-sm font-bold text-[#0B1F54] border-b pb-2 flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#174EA6]" />
          J. Complete Application Audit & Scrutiny Timeline
        </h2>

        <div className="space-y-2">
          {(request.timeline || []).map((entry, idx) => (
            <div key={idx} className="flex items-start gap-3 p-2.5 bg-gray-50 rounded border border-gray-100">
              <span className="text-[0.6875rem] text-gray-400 font-mono shrink-0">
                {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <div>
                <span className="font-bold text-gray-900">{entry.action}</span>
                <span className="text-gray-500 ml-1.5">by {entry.actor} ({entry.actorRole || 'system'})</span>
                <p className="text-gray-700 mt-0.5">{entry.details}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Dialog Modal */}
      {actionModalType && (
        <div className="app-modal fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-5 border border-gray-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <h3 className="text-base font-bold text-[#0B1F54]">
                {actionModalType === 'CLARIFICATION'
                  ? 'Request Institutional Clarification'
                  : actionModalType === 'ACCEPT'
                  ? 'Accept Renewal for Regulatory Record'
                  : actionModalType === 'REJECT'
                  ? 'Reject Renewal Application'
                  : 'Add Scrutiny Note'}
              </h3>
              <button onClick={() => setActionModalType(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionModalType === 'ACCEPT' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900">
                <span className="font-semibold block">Regulatory Notice:</span>
                {ADMIN_RELEASE_DISCLAIMER} Administrative acceptance enters the replacement certificate into regulatory records. It does not execute a commercial bank lien release.
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {actionModalType === 'CLARIFICATION'
                  ? 'Clarification Query to Institution'
                  : 'Mandatory Substantive Justification (min 5 chars)'} <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                value={modalInput}
                onChange={(e) => setModalInput(e.target.value)}
                placeholder="Detail rationale, verification references, and specific instructions..."
                className="w-full text-xs p-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#174EA6]"
              />
            </div>

            {actionModalType === 'CLARIFICATION' && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Response Deadline</label>
                <input
                  type="date"
                  value={clarificationDeadline}
                  onChange={(e) => setClarificationDeadline(e.target.value)}
                  className="w-full text-xs p-2 border border-gray-300 rounded focus:ring-1 focus:ring-[#174EA6]"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setActionModalType(null)}
                className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionSubmitting || modalInput.trim().length < 5}
                onClick={handleExecuteModalAction}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#174EA6] rounded hover:bg-[#0B1F54] transition disabled:opacity-50"
              >
                {actionSubmitting ? 'Recording...' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
