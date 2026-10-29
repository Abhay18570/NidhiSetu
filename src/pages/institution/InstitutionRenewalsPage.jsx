import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  RotateCcw,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  FileCheck2,
  Download,
  Search,
  MessageSquare,
  ShieldCheck,
  Send,
  X,
  FileText,
} from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { fdrRepository } from '../../storage/fdrRepository';
import { renewalRequestRepository } from '../../storage/renewalRequestRepository';
import { renewalPlanRepository } from '../../storage/renewalPlanRepository';
import { generateRenewalPlans } from '../../renewal/renewalPlanner';
import { renewalReportBuilder } from '../../renewal/renewalReportBuilder';
import { RENEWAL_STATUS, RENEWAL_PROTOTYPE_DISCLAIMER } from '../../renewal/renewalModel';

export default function InstitutionRenewalsPage() {
  const { currentInstitution, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [requests, setRequests] = useState([]);
  const [filterTab, setFilterTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState('');

  // Clarification reply modal
  const [clarificationModalOpen, setClarificationModalOpen] = useState(false);
  const [activeRequest, setActiveRequest] = useState(null);
  const [replyText, setReplyText] = useState('');

  const institutionId = currentInstitution?.id || user?.institutionId || 'inst-001';

  useEffect(() => {
    loadRenewalsData();
  }, [institutionId]);

  const loadRenewalsData = async () => {
    try {
      setLoading(true);
      const [allFdrs, allReqs] = await Promise.all([
        fdrRepository.getFdrsByInstitutionId(institutionId),
        renewalRequestRepository.getRequestsByInstitutionId(institutionId),
      ]);

      const computedPlans = generateRenewalPlans(allFdrs, allReqs);
      await renewalPlanRepository.refreshPlans(allFdrs, allReqs);

      setPlans(computedPlans);
      setRequests(allReqs);
    } catch (err) {
      console.error('Failed to load institution renewal data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = () => {
    const csv = renewalReportBuilder.exportRenewalRequestsToCsv(requests);
    renewalReportBuilder.downloadFile(csv, `Renewal_Applications_${institutionId}.csv`);
  };

  const openClarificationModal = (req) => {
    setActiveRequest(req);
    setReplyText('');
    setClarificationModalOpen(true);
  };

  const submitClarificationReply = async () => {
    if (!replyText.trim() || !activeRequest) return;
    try {
      const activeClar = (activeRequest.clarificationRequests || []).find((c) => c.status === 'AWAITING_REPLY');
      await renewalRequestRepository.submitClarificationResponse(activeRequest.renewalRequestId, {
        clarificationId: activeClar ? activeClar.requestId : null,
        responseText: replyText.trim(),
        responderId: user?.id || 'institution-user',
      });
      setNotification('Clarification response submitted successfully.');
      setClarificationModalOpen(false);
      loadRenewalsData();
      setTimeout(() => setNotification(''), 4000);
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  // KPIs
  const upcoming90Count = plans.filter((p) => p.daysUntilMaturity <= 90 && p.daysUntilMaturity >= 0).length;
  const submittedCount = requests.filter((r) => r.status === RENEWAL_STATUS.SUBMITTED || r.status === RENEWAL_STATUS.UNDER_REVIEW).length;
  const clarificationCount = requests.filter((r) => r.status === RENEWAL_STATUS.CLARIFICATION_REQUIRED).length;
  const acceptedCount = requests.filter((r) => r.status === RENEWAL_STATUS.ACCEPTED_FOR_RECORD).length;
  const gapCount = plans.filter((p) => p.potentialCoverageGap || p.daysUntilMaturity < 0).length;

  // Filtered rows
  const filteredPlans = plans.filter((p) => {
    const matchesSearch =
      (p.fdrNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.recommendedNextAction || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterTab === 'UPCOMING') return p.daysUntilMaturity <= 90;
    if (filterTab === 'SUBMITTED') {
      return (
        p.renewalSubmissionStatus === RENEWAL_STATUS.SUBMITTED ||
        p.renewalSubmissionStatus === RENEWAL_STATUS.UNDER_REVIEW
      );
    }
    if (filterTab === 'CLARIFICATION') return p.renewalSubmissionStatus === RENEWAL_STATUS.CLARIFICATION_REQUIRED;
    if (filterTab === 'ACCEPTED') return p.renewalSubmissionStatus === RENEWAL_STATUS.ACCEPTED_FOR_RECORD;
    if (filterTab === 'GAPS') return p.potentialCoverageGap || p.daysUntilMaturity < 0;

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-100 text-[#0B1F54]">
              Module 07
            </span>
            <span className="text-xs font-medium text-gray-500">
              Regulatory Continuity Protocol
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#0B1F54] mt-1 flex items-center gap-2">
            <RotateCcw className="w-6 h-6 text-[#174EA6]" />
            Smart FDR Renewal & Deposit Continuity
          </h1>
          <p className="text-sm text-gray-600 mt-0.5">
            Monitor maturing security deposits, submit successor certificates, and ensure uninterrupted coverage.
          </p>
        </div>

        <div className="mt-4 md:mt-0 flex items-center gap-3">
          <Link
            to="/institution/release-requests"
            className="px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition flex items-center gap-1.5 shadow-sm"
          >
            <FileCheck2 className="w-4 h-4 text-emerald-600" />
            Administrative Releases
          </Link>
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-[#174EA6] rounded hover:bg-[#0B1F54] transition flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{notification}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Upcoming (90d)</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{upcoming90Count}</p>
          <p className="text-xs text-gray-500 mt-0.5">Requiring attention</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Submitted</span>
            <FileText className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{submittedCount}</p>
          <p className="text-xs text-gray-500 mt-0.5">Under officer scrutiny</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Clarification</span>
            <MessageSquare className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-2xl font-bold text-orange-600 mt-2">{clarificationCount}</p>
          <p className="text-xs text-gray-500 mt-0.5">Response required</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Accepted</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-2">{acceptedCount}</p>
          <p className="text-xs text-gray-500 mt-0.5">For regulatory record</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Coverage Gaps</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-rose-600 mt-2">{gapCount}</p>
          <p className="text-xs text-gray-500 mt-0.5">Shortfall / Matured</p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5 text-xs font-medium">
          {[
            { id: 'ALL', label: 'All Deposits' },
            { id: 'UPCOMING', label: 'Upcoming (<90d)' },
            { id: 'SUBMITTED', label: 'Submitted / In Review' },
            { id: 'CLARIFICATION', label: 'Clarification Needed' },
            { id: 'ACCEPTED', label: 'Accepted for Record' },
            { id: 'GAPS', label: 'Coverage Gaps' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id)}
              className={`px-3 py-1.5 rounded transition ${
                filterTab === tab.id
                  ? 'bg-[#174EA6] text-white font-semibold'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search FDR number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[#174EA6] focus:border-[#174EA6]"
          />
        </div>
      </div>

      {/* Main Renewal Plans Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#0B1F54] flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#174EA6]" />
            Security Deposit Renewal Portfolio
          </h2>
          <span className="text-xs text-gray-500 font-medium">
            Showing {filteredPlans.length} records
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-gray-500">
            Evaluating maturity timelines and continuity profiles...
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            No FDR records match the selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-100/75 text-gray-700 uppercase tracking-wider font-semibold border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">Original FDR</th>
                  <th className="px-4 py-3">Maturity Date</th>
                  <th className="px-4 py-3">Remaining</th>
                  <th className="px-4 py-3">Renewal Status</th>
                  <th className="px-4 py-3">Continuity</th>
                  <th className="px-4 py-3">Recommended Action</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPlans.map((plan) => {
                  const req = requests.find((r) => r.renewalRequestId === plan.activeRequestId);

                  return (
                    <tr key={plan.planId} className="hover:bg-blue-50/30 transition">
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-gray-900">{plan.fdrNumber}</div>
                        <div className="text-[0.6875rem] text-gray-500">ID: {plan.fdrId}</div>
                      </td>

                      <td className="px-4 py-3.5 font-medium text-gray-800">
                        {plan.currentMaturityDate}
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[0.6875rem] font-semibold ${
                            plan.daysUntilMaturity < 0
                              ? 'bg-rose-100 text-rose-800'
                              : plan.daysUntilMaturity <= 7
                              ? 'bg-red-100 text-red-800'
                              : plan.daysUntilMaturity <= 30
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {plan.daysUntilMaturity < 0
                            ? `Matured (${Math.abs(plan.daysUntilMaturity)}d ago)`
                            : `${plan.daysUntilMaturity} days`}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[0.6875rem] font-semibold ${
                            plan.renewalSubmissionStatus === RENEWAL_STATUS.ACCEPTED_FOR_RECORD
                              ? 'bg-emerald-100 text-emerald-800'
                              : plan.renewalSubmissionStatus === RENEWAL_STATUS.CLARIFICATION_REQUIRED
                              ? 'bg-orange-100 text-orange-800 animate-pulse'
                              : plan.renewalSubmissionStatus === RENEWAL_STATUS.SUBMITTED ||
                                plan.renewalSubmissionStatus === RENEWAL_STATUS.UNDER_REVIEW
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {plan.renewalSubmissionStatus}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        {plan.potentialCoverageGap ? (
                          <span className="inline-flex items-center gap-1 text-rose-700 font-semibold">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Gap Detected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Continuous
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 max-w-xs text-gray-600 truncate" title={plan.recommendedNextAction}>
                        {plan.recommendedNextAction}
                      </td>

                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        {plan.renewalSubmissionStatus === RENEWAL_STATUS.CLARIFICATION_REQUIRED && req ? (
                          <button
                            onClick={() => openClarificationModal(req)}
                            className="px-2.5 py-1 text-xs font-semibold text-white bg-orange-600 rounded hover:bg-orange-700 transition inline-flex items-center gap-1"
                          >
                            <MessageSquare className="w-3 h-3" />
                            Reply Clarification
                          </button>
                        ) : plan.renewalSubmissionStatus === 'NO_REQUEST' ? (
                          <Link
                            to={`/institution/renewals/new/${plan.fdrId}`}
                            className="px-2.5 py-1 text-xs font-semibold text-white bg-[#174EA6] rounded hover:bg-[#0B1F54] transition inline-flex items-center gap-1"
                          >
                            Submit Renewal
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        ) : plan.renewalSubmissionStatus === RENEWAL_STATUS.DRAFT ? (
                          <Link
                            to={`/institution/renewals/new/${plan.fdrId}`}
                            className="px-2.5 py-1 text-xs font-semibold text-amber-800 bg-amber-100 border border-amber-300 rounded hover:bg-amber-200 transition inline-flex items-center gap-1"
                          >
                            Resume Draft
                          </Link>
                        ) : (
                          <Link
                            to={`/officer/renewals/${plan.activeRequestId}`}
                            className="px-2.5 py-1 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition"
                          >
                            View Dossier
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Educational Disclaimer */}
      <div className="p-3.5 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Regulatory Scope Notice: </span>
          {RENEWAL_PROTOTYPE_DISCLAIMER} Administrative acceptance of renewal documents maintains regulatory record continuity and does not substitute commercial bank lien releases.
        </div>
      </div>

      {/* Clarification Reply Modal */}
      {clarificationModalOpen && activeRequest && (
        <div className="app-modal fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-5 border border-gray-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <h3 className="text-base font-bold text-[#0B1F54] flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-orange-600" />
                Officer Clarification Request
              </h3>
              <button
                onClick={() => setClarificationModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase">Renewal Application</div>
              <div className="text-sm font-bold text-gray-900 mt-0.5">
                {activeRequest.renewalReference} ({activeRequest.originalFdrNumber})
              </div>
            </div>

            <div className="p-3 bg-orange-50 border border-orange-200 rounded text-xs text-orange-900 space-y-1">
              <span className="font-semibold">Scrutiny Query: </span>
              {activeRequest.clarificationRequests?.[0]?.question || 'Please provide supplementary deposit proof.'}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Institution Clarification Response <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Detail explanation and certificate reference numbers..."
                className="w-full text-xs p-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#174EA6] focus:border-[#174EA6]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setClarificationModalOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitClarificationReply}
                disabled={!replyText.trim()}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#174EA6] rounded hover:bg-[#0B1F54] transition disabled:opacity-50 flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                Submit Response
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
