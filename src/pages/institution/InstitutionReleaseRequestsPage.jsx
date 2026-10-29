import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  Download,
  Search,
  X,
  Send,
  Building,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { fdrRepository } from '../../storage/fdrRepository';
import { renewalRequestRepository } from '../../storage/renewalRequestRepository';
import { releaseRequestRepository } from '../../storage/releaseRequestRepository';
import { evaluateReleaseEligibility } from '../../renewal/releaseEligibilityEngine';
import { renewalReportBuilder } from '../../renewal/renewalReportBuilder';
import {
  RELEASE_STATUS,
  ADMIN_RELEASE_DISCLAIMER,
  RENEWAL_STATUS,
} from '../../renewal/renewalModel';

export default function InstitutionReleaseRequestsPage() {
  const { currentInstitution, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [fdrs, setFdrs] = useState([]);
  const [renewalReqs, setRenewalReqs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState('');

  // New Request Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFdrId, setSelectedFdrId] = useState('');
  const [releaseReason, setReleaseReason] = useState('Renewal completed and replacement FDR submitted');
  const [relatedRenewalId, setRelatedRenewalId] = useState('');
  const [explanation, setExplanation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [eligibilityWarning, setEligibilityWarning] = useState('');

  const institutionId = currentInstitution?.id || user?.institutionId || 'inst-001';

  useEffect(() => {
    loadReleaseData();
  }, [institutionId]);

  const loadReleaseData = async () => {
    try {
      setLoading(true);
      const [allRel, allFdrs, allRen] = await Promise.all([
        releaseRequestRepository.getRequestsByInstitutionId(institutionId),
        fdrRepository.getFdrsByInstitutionId(institutionId),
        renewalRequestRepository.getRequestsByInstitutionId(institutionId),
      ]);
      setRequests(allRel);
      setFdrs(allFdrs);
      setRenewalReqs(allRen);

      if (allFdrs.length > 0 && !selectedFdrId) {
        setSelectedFdrId(String(allFdrs[0].id || allFdrs[0].fdrId));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = () => {
    const csv = renewalReportBuilder.exportReleaseRequestsToCsv(requests);
    renewalReportBuilder.downloadFile(csv, `Release_Requests_${institutionId}.csv`);
  };

  const checkEligibilityForSelectedFdr = async (targetFdrId) => {
    const targetFdr = fdrs.find((f) => String(f.id || f.fdrId) === String(targetFdrId));
    if (!targetFdr) return;

    const linkedRen = renewalReqs.find((r) => String(r.originalFdrId) === String(targetFdrId));
    const result = await evaluateReleaseEligibility({
      originalFdr: targetFdr,
      renewalRequest: linkedRen,
      releaseReason,
    });

    if (!result.eligible) {
      setEligibilityWarning(result.reason);
    } else {
      setEligibilityWarning('');
    }
  };

  const handleSubmitReleaseRequest = async (e) => {
    e.preventDefault();
    if (!selectedFdrId || !releaseReason || !explanation.trim()) {
      alert('Please fill out all mandatory fields.');
      return;
    }

    const targetFdr = fdrs.find((f) => String(f.id || f.fdrId) === String(selectedFdrId));

    try {
      setSubmitting(true);
      await releaseRequestRepository.createRequest(
        {
          institutionId,
          institutionName: targetFdr?.institutionName || currentInstitution?.name,
          originalFdrId: selectedFdrId,
          originalFdrNumber: targetFdr?.fdrNumber || '',
          amountPaise: targetFdr?.depositAmountPaise || targetFdr?.amountPaise || 0,
          releaseReason,
          relatedRenewalRequestId: relatedRenewalId || null,
          supportingExplanation: explanation.trim(),
          requestedBy: user?.id || 'institution-user',
        },
        false
      );

      setNotification('Administrative release request submitted successfully.');
      setIsModalOpen(false);
      setExplanation('');
      loadReleaseData();
      setTimeout(() => setNotification(''), 4000);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRequests = requests.filter((r) =>
    (r.requestReference || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.originalFdrNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.releaseReason || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-900">
              Module 07 Clearance
            </span>
            <span className="text-xs font-medium text-gray-500">
              Administrative Clearance Management
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#0B1F54] mt-1 flex items-center gap-2">
            <FileCheck2 className="w-6 h-6 text-emerald-700" />
            Administrative FDR Release Requests
          </h1>
          <p className="text-sm text-gray-600 mt-0.5">
            Request administrative clearance for superseded or matured deposits no longer required for regulatory retention.
          </p>
        </div>

        <div className="mt-4 md:mt-0 flex items-center gap-3">
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 rounded hover:bg-emerald-800 transition flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Request Release
          </button>
        </div>
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
            Administrative Clearance Protocol — Strictly Non-Banking
          </h3>
          <p className="mt-0.5 leading-relaxed">
            {ADMIN_RELEASE_DISCLAIMER} Submitting an administrative clearance request indicates that the regulatory authority no longer requires administrative tracking of the superseded certificate. An officer's clearance certificate serves as an administrative record only and does not discharge, encash, or alter commercial bank lien encumbrances.
          </p>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#0B1F54] flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-700" />
            Administrative Release Application History
          </h2>
          <div className="relative w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2" />
            <input
              type="text"
              placeholder="Search reference or FDR..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[#174EA6]"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-gray-500">
            Loading administrative clearance records...
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            No administrative release requests found. Click "Request Release" above to submit one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-100/75 text-gray-700 uppercase tracking-wider font-semibold border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">FDR Certificate</th>
                  <th className="px-4 py-3">Stated Reason</th>
                  <th className="px-4 py-3">Related Renewal</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Decision Details</th>
                  <th className="px-4 py-3 text-right">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRequests.map((req) => (
                  <tr key={req.requestId} className="hover:bg-gray-50/50 transition">
                    <td className="px-4 py-3.5 font-bold text-gray-900">
                      {req.requestReference || req.requestId}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-gray-800">{req.originalFdrNumber}</div>
                      <div className="text-[0.6875rem] text-gray-500">
                        ₹{(((req.amountPaise || 0) / 100)).toLocaleString('en-IN')}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 max-w-xs text-gray-700 truncate" title={req.releaseReason}>
                      {req.releaseReason}
                    </td>

                    <td className="px-4 py-3.5 text-gray-600">
                      {req.relatedRenewalRequestId || 'Direct Release'}
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[0.6875rem] font-semibold ${
                          req.status === RELEASE_STATUS.ADMINISTRATIVELY_CLEARED
                            ? 'bg-emerald-100 text-emerald-800'
                            : req.status === RELEASE_STATUS.DECLINED
                            ? 'bg-rose-100 text-rose-800'
                            : req.status === RELEASE_STATUS.UNDER_REVIEW
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 max-w-xs text-gray-600 text-[0.6875rem]">
                      {req.clearanceReason || req.declinedReason || (req.officerNotes && req.officerNotes[0]) || 'Under initial review'}
                    </td>

                    <td className="px-4 py-3.5 text-right text-gray-500">
                      {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Submission Modal */}
      {isModalOpen && (
        <div className="app-modal fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-5 border border-gray-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <h3 className="text-base font-bold text-[#0B1F54] flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-emerald-700" />
                Administrative Release Request Form
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReleaseRequest} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-gray-700 mb-1">
                  Target FDR Certificate <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedFdrId}
                  onChange={(e) => {
                    setSelectedFdrId(e.target.value);
                    checkEligibilityForSelectedFdr(e.target.value);
                  }}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-[#174EA6]"
                >
                  {fdrs.map((f) => (
                    <option key={f.id || f.fdrId} value={f.id || f.fdrId}>
                      {f.fdrNumber} — ₹{(((f.depositAmountPaise || f.amountPaise || 0) / 100)).toLocaleString('en-IN')} (Mat: {f.maturityDate})
                    </option>
                  ))}
                </select>
              </div>

              {eligibilityWarning && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded text-amber-900 flex items-start gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Advisory Check: </span>
                    {eligibilityWarning}
                  </div>
                </div>
              )}

              <div>
                <label className="block font-medium text-gray-700 mb-1">
                  Reason for Administrative Clearance <span className="text-rose-500">*</span>
                </label>
                <select
                  value={releaseReason}
                  onChange={(e) => setReleaseReason(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-[#174EA6]"
                >
                  <option value="Renewal completed and replacement FDR submitted">
                    Renewal completed and replacement FDR submitted
                  </option>
                  <option value="Approved program / intake discontinuation proceedings">
                    Approved program / intake discontinuation proceedings
                  </option>
                  <option value="Deposit requirement relaxed under updated regulatory rule">
                    Deposit requirement relaxed under updated regulatory rule
                  </option>
                  <option value="Correction of duplicate or erroneously recorded certificate">
                    Correction of duplicate or erroneously recorded certificate
                  </option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">
                  Related Renewal Application (Optional)
                </label>
                <select
                  value={relatedRenewalId}
                  onChange={(e) => setRelatedRenewalId(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-[#174EA6]"
                >
                  <option value="">None / Independent Clearance</option>
                  {renewalReqs.map((r) => (
                    <option key={r.renewalRequestId} value={r.renewalRequestId}>
                      {r.renewalReference} ({r.originalFdrNumber}) — Status: {r.status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">
                  Institutional Explanation & Justification <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Provide reference to AICTE approval letter, replacement FDR reference, or gazette order..."
                  className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-[#174EA6]"
                />
              </div>

              <div className="p-3 bg-gray-50 border rounded text-[0.6875rem] text-gray-600">
                <span className="font-semibold text-gray-900 block mb-0.5">Statutory Confirmation:</span>
                I acknowledge that administrative clearance in NidhiSetu represents administrative record release only and does NOT release any actual commercial bank lien.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !explanation.trim()}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-700 rounded hover:bg-emerald-800 transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submitting ? 'Submitting...' : 'Submit Clearance Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
