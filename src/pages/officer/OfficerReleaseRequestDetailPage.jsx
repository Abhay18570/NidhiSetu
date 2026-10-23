import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FileCheck2,
  Building,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ChevronRight,
  X,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { releaseRequestRepository } from '../../storage/releaseRequestRepository';
import { renewalRequestRepository } from '../../storage/renewalRequestRepository';
import { fdrRepository } from '../../storage/fdrRepository';
import { evaluateReleaseEligibility } from '../../renewal/releaseEligibilityEngine';
import {
  RELEASE_STATUS,
  ADMIN_RELEASE_DISCLAIMER,
} from '../../renewal/renewalModel';

export default function OfficerReleaseRequestDetailPage() {
  const { requestId } = useParams();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState(null);
  const [originalFdr, setOriginalFdr] = useState(null);
  const [linkedRenewal, setLinkedRenewal] = useState(null);
  const [eligibilityResult, setEligibilityResult] = useState(null);
  const [notification, setNotification] = useState('');

  // Modals
  const [modalType, setModalType] = useState(null); // 'CLEAR', 'DECLINE', 'NOTE'
  const [modalReason, setModalReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadReleaseDossier();
  }, [requestId]);

  const loadReleaseDossier = async () => {
    try {
      setLoading(true);
      const rel = await releaseRequestRepository.getRequestById(requestId);
      if (!rel) {
        setLoading(false);
        return;
      }
      setRequest(rel);

      const [origFdr, ren] = await Promise.all([
        fdrRepository.getFDRById ? fdrRepository.getFDRById(rel.originalFdrId) : null,
        rel.relatedRenewalRequestId ? renewalRequestRepository.getRequestById(rel.relatedRenewalRequestId) : null,
      ]);

      const foundOrig = origFdr || {
        id: rel.originalFdrId,
        fdrNumber: rel.originalFdrNumber,
        depositAmountPaise: rel.amountPaise,
        institutionId: rel.institutionId,
        institutionName: rel.institutionName,
      };
      setOriginalFdr(foundOrig);
      setLinkedRenewal(ren);

      const elig = await evaluateReleaseEligibility({
        originalFdr: foundOrig,
        renewalRequest: ren,
        releaseReason: rel.releaseReason,
      });
      setEligibilityResult(elig);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartReview = async () => {
    try {
      await releaseRequestRepository.transitionStatus(requestId, RELEASE_STATUS.UNDER_REVIEW, {
        actorId: user?.id || 'officer-user',
        actorRole: 'officer',
        reason: 'Officer initiated formal scrutiny of release request.',
      });
      setNotification('Release request transitioned to UNDER_REVIEW.');
      loadReleaseDossier();
      setTimeout(() => setNotification(''), 4000);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleExecuteDecision = async () => {
    if (!modalReason || modalReason.trim().length < 5) {
      alert('Mandatory substantive rationale (minimum 5 characters) is required.');
      return;
    }

    try {
      setSubmitting(true);
      const officerId = user?.id || 'officer-user';

      if (modalType === 'CLEAR') {
        await releaseRequestRepository.transitionStatus(requestId, RELEASE_STATUS.ADMINISTRATIVELY_CLEARED, {
          actorId: officerId,
          actorRole: 'officer',
          reason: modalReason.trim(),
        });
        setNotification('FDR record administratively cleared.');
      } else if (modalType === 'DECLINE') {
        await releaseRequestRepository.transitionStatus(requestId, RELEASE_STATUS.DECLINED, {
          actorId: officerId,
          actorRole: 'officer',
          reason: modalReason.trim(),
        });
        setNotification('Administrative release request declined.');
      }

      setModalType(null);
      setModalReason('');
      loadReleaseDossier();
      setTimeout(() => setNotification(''), 4000);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-sm text-gray-500">
        Loading release application dossier...
      </div>
    );
  }

  if (!request) {
    return (
      <div className="p-6 bg-white rounded-lg border border-red-200 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto" />
        <h2 className="text-lg font-bold text-gray-900">Release Request Not Found</h2>
        <Link
          to="/officer/release-requests"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 rounded"
        >
          Return to Queue
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-500 pb-3 border-b border-gray-200">
        <Link to="/officer/release-requests" className="hover:text-emerald-700">
          Release Requests Queue
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-[#0B1F54]">{request.requestReference}</span>
      </div>

      {notification && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{notification}</span>
        </div>
      )}

      {/* Prominent Regulatory Boundary Banner */}
      <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-lg text-xs text-amber-900 flex items-start gap-3 shadow-xs">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-sm text-amber-950">
            Mandatory Non-Banking Regulatory Boundary
          </h3>
          <p className="mt-0.5 leading-relaxed">
            {ADMIN_RELEASE_DISCLAIMER} Administrative clearance indicates that the regulatory authority no longer requires administrative tracking of this certificate. Under NO circumstances does administrative clearance discharge commercial bank liens or authorize fund encashment.
          </p>
        </div>
      </div>

      {/* Header Banner */}
      <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-900">
              Clearance Application
            </span>
            <span
              className={`px-2.5 py-0.5 rounded text-xs font-semibold ${
                request.status === RELEASE_STATUS.ADMINISTRATIVELY_CLEARED
                  ? 'bg-emerald-100 text-emerald-800'
                  : request.status === RELEASE_STATUS.DECLINED
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              Status: {request.status}
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#0B1F54] mt-1">
            {request.requestReference} — {request.institutionName}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Target FDR #{request.originalFdrNumber} • Submitted on {new Date(request.createdAt).toLocaleDateString()}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {request.status === RELEASE_STATUS.SUBMITTED && (
            <button
              onClick={handleStartReview}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 transition"
            >
              Start Review
            </button>
          )}

          {request.status !== RELEASE_STATUS.ADMINISTRATIVELY_CLEARED && request.status !== RELEASE_STATUS.DECLINED && (
            <>
              <button
                onClick={() => {
                  setModalType('DECLINE');
                  setModalReason('');
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-300 rounded hover:bg-rose-100"
              >
                Decline Request
              </button>

              <button
                onClick={() => {
                  setModalType('CLEAR');
                  setModalReason('Successor deposit accepted for regulatory record with continuous coverage. Administrative tracking released.');
                }}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-700 rounded hover:bg-emerald-800 transition shadow-xs"
              >
                Administratively Clear
              </button>
            </>
          )}
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-2">
          <h2 className="font-bold text-[#0B1F54] border-b pb-1.5 flex items-center gap-1.5">
            <Building className="w-4 h-4 text-emerald-700" />
            Target Deposit & Institution
          </h2>
          <div className="space-y-1 pt-1">
            <div>
              <span className="text-gray-500 block">Institution:</span>
              <span className="font-bold text-gray-900">{request.institutionName}</span>
            </div>
            <div>
              <span className="text-gray-500 block">Certificate Number:</span>
              <span className="font-bold text-gray-900">{request.originalFdrNumber}</span>
            </div>
            <div>
              <span className="text-gray-500 block">Deposit Principal:</span>
              <span className="font-bold text-gray-900">
                ₹{(((request.amountPaise || 0) / 100)).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-2">
          <h2 className="font-bold text-[#0B1F54] border-b pb-1.5 flex items-center gap-1.5">
            <FileCheck2 className="w-4 h-4 text-emerald-700" />
            Stated Release Justification
          </h2>
          <div className="space-y-1 pt-1">
            <div>
              <span className="text-gray-500 block">Stated Reason:</span>
              <span className="font-bold text-gray-900">{request.releaseReason}</span>
            </div>
            <div>
              <span className="text-gray-500 block">Institutional Explanation:</span>
              <p className="text-gray-700 mt-0.5">{request.supportingExplanation || 'None provided.'}</p>
            </div>
            {request.relatedRenewalRequestId && (
              <div>
                <span className="text-gray-500 block">Linked Renewal Reference:</span>
                <span className="font-semibold text-blue-700">{request.relatedRenewalRequestId}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Eligibility Advisory Result */}
      {eligibilityResult && (
        <div
          className={`p-4 rounded-lg border text-xs ${
            eligibilityResult.eligible
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          <div className="font-bold flex items-center gap-2 text-sm">
            {eligibilityResult.eligible ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            )}
            Advisory Scrutiny Assessment: {eligibilityResult.outcome}
          </div>
          <p className="mt-1">{eligibilityResult.reason}</p>
        </div>
      )}

      {/* Decision Details if Cleared or Declined */}
      {(request.clearanceReason || request.declinedReason) && (
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm text-xs space-y-1">
          <span className="font-bold text-gray-900 block">Adjudication Rationale on Record:</span>
          <p className="text-gray-800">{request.clearanceReason || request.declinedReason}</p>
          {request.clearedAt && (
            <span className="text-gray-500 text-[11px] block mt-1">Cleared At: {request.clearedAt}</span>
          )}
        </div>
      )}

      {/* Modal Dialog */}
      {modalType && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-5 border border-gray-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <h3 className="text-base font-bold text-[#0B1F54]">
                {modalType === 'CLEAR' ? 'Grant Administrative Clearance' : 'Decline Release Request'}
              </h3>
              <button onClick={() => setModalType(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalType === 'CLEAR' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900 font-semibold">
                Mandatory Regulatory Confirmation: {ADMIN_RELEASE_DISCLAIMER}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Mandatory Substantive Rationale (min 5 characters) <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                value={modalReason}
                onChange={(e) => setModalReason(e.target.value)}
                placeholder="Detail rationale, regulatory verification, or reasons for decline..."
                className="w-full text-xs p-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#174EA6]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting || modalReason.trim().length < 5}
                onClick={handleExecuteDecision}
                className={`px-4 py-1.5 text-xs font-semibold text-white rounded transition disabled:opacity-50 ${
                  modalType === 'CLEAR' ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-rose-700 hover:bg-rose-800'
                }`}
              >
                {submitting ? 'Recording...' : 'Confirm Decision'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
