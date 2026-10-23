import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  RotateCcw,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Download,
  Building,
  ShieldCheck,
  FileText,
  UserCheck,
} from 'lucide-react';
import { renewalRequestRepository } from '../../storage/renewalRequestRepository';
import { fdrRepository } from '../../storage/fdrRepository';
import { renewalReportBuilder } from '../../renewal/renewalReportBuilder';
import { RENEWAL_STATUS, RENEWAL_TYPES } from '../../renewal/renewalModel';

export default function OfficerRenewalsPage() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  useEffect(() => {
    loadOfficerRenewals();
  }, []);

  const loadOfficerRenewals = async () => {
    try {
      setLoading(true);
      const all = await renewalRequestRepository.getAllRequests();
      setRequests(all);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = () => {
    const csv = renewalReportBuilder.exportRenewalRequestsToCsv(requests);
    renewalReportBuilder.downloadFile(csv, `Renewal_Applications_Officer_Queue.csv`);
  };

  // KPIs
  const pendingCount = requests.filter(
    (r) => r.status === RENEWAL_STATUS.SUBMITTED || r.status === RENEWAL_STATUS.RESUBMITTED
  ).length;
  const underReviewCount = requests.filter((r) => r.status === RENEWAL_STATUS.UNDER_REVIEW).length;
  const clarificationCount = requests.filter((r) => r.status === RENEWAL_STATUS.CLARIFICATION_REQUIRED).length;
  const acceptedCount = requests.filter((r) => r.status === RENEWAL_STATUS.ACCEPTED_FOR_RECORD).length;
  const gapCount = requests.filter((r) => r.continuityStatus === 'COVERAGE_GAP' || r.continuityStatus === 'PARTIAL_DECLARED_COVERAGE').length;

  const filteredRequests = requests.filter((r) => {
    const matchesSearch =
      (r.renewalReference || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.originalFdrNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.institutionName || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    if (typeFilter !== 'ALL' && r.renewalType !== typeFilter) return false;

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-100 text-[#0B1F54]">
              Officer Scrutiny Queue
            </span>
            <span className="text-xs font-medium text-gray-500">
              Module 07 Regulatory Review
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#0B1F54] mt-1 flex items-center gap-2">
            <RotateCcw className="w-6 h-6 text-[#174EA6]" />
            FDR Renewal & Replacement Applications
          </h1>
          <p className="text-sm text-gray-600 mt-0.5">
            Adjudicate renewal requests, scrutinize successor certificates, and verify continuous deposit coverage.
          </p>
        </div>

        <div className="mt-4 md:mt-0 flex items-center gap-3">
          <Link
            to="/officer/release-requests"
            className="px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition shadow-sm"
          >
            Clearance Requests Queue
          </Link>
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-[#174EA6] rounded hover:bg-[#0B1F54] transition flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export Queue CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Pending Scrutiny</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600 mt-2">{pendingCount}</p>
          <p className="text-xs text-gray-500 mt-0.5">Submitted / Resubmitted</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Under Review</span>
            <UserCheck className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-blue-600 mt-2">{underReviewCount}</p>
          <p className="text-xs text-gray-500 mt-0.5">Assigned to officers</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Clarification Active</span>
            <FileText className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-2xl font-bold text-orange-600 mt-2">{clarificationCount}</p>
          <p className="text-xs text-gray-500 mt-0.5">Awaiting institution reply</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Accepted for Record</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-2">{acceptedCount}</p>
          <p className="text-xs text-gray-500 mt-0.5">Continuity confirmed</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Coverage Gaps</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-rose-600 mt-2">{gapCount}</p>
          <p className="text-xs text-gray-500 mt-0.5">Flagged shortfall/gap</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs p-2 border border-gray-300 rounded focus:ring-1 focus:ring-[#174EA6]"
          >
            <option value="ALL">All Statuses</option>
            <option value={RENEWAL_STATUS.SUBMITTED}>Submitted</option>
            <option value={RENEWAL_STATUS.UNDER_REVIEW}>Under Review</option>
            <option value={RENEWAL_STATUS.CLARIFICATION_REQUIRED}>Clarification Required</option>
            <option value={RENEWAL_STATUS.RESUBMITTED}>Resubmitted</option>
            <option value={RENEWAL_STATUS.ACCEPTED_FOR_RECORD}>Accepted for Record</option>
            <option value={RENEWAL_STATUS.REJECTED}>Rejected</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs p-2 border border-gray-300 rounded focus:ring-1 focus:ring-[#174EA6]"
          >
            <option value="ALL">All Renewal Types</option>
            <option value={RENEWAL_TYPES.REPLACEMENT_FDR}>Replacement FDR (1:1)</option>
            <option value={RENEWAL_TYPES.EXTENSION_OF_EXISTING_FDR}>Tenure Extension</option>
            <option value={RENEWAL_TYPES.MULTIPLE_REPLACEMENT_FDRS}>Multiple Replacements</option>
            <option value={RENEWAL_TYPES.PARTIAL_REPLACEMENT}>Partial Replacement</option>
          </select>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search reference, institution, FDR..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[#174EA6]"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#0B1F54] flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-[#174EA6]" />
            Renewal Dossier Queue
          </h2>
          <span className="text-xs text-gray-500 font-medium">
            Showing {filteredRequests.length} applications
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-gray-500">
            Loading renewal scrutiny dossiers...
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            No renewal applications match the current filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-100/75 text-gray-700 uppercase tracking-wider font-semibold border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Institution</th>
                  <th className="px-4 py-3">Original FDR</th>
                  <th className="px-4 py-3">Renewal Type</th>
                  <th className="px-4 py-3">Coverage (INR)</th>
                  <th className="px-4 py-3">Continuity</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRequests.map((req) => (
                  <tr key={req.renewalRequestId} className="hover:bg-blue-50/30 transition">
                    <td className="px-4 py-3.5 font-bold text-[#0B1F54]">
                      {req.renewalReference || req.renewalRequestId}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-gray-900">{req.institutionName}</div>
                      <div className="text-[11px] text-gray-500">ID: {req.institutionId}</div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-gray-800">{req.originalFdrNumber}</div>
                      <div className="text-[11px] text-gray-500">Matures: {req.oldMaturityDate}</div>
                    </td>

                    <td className="px-4 py-3.5 text-gray-600">
                      <span className="px-2 py-0.5 rounded text-[11px] bg-gray-100 font-medium">
                        {req.renewalType}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-gray-900">
                        ₹{(((req.replacementTotalPaise || 0) / 100)).toLocaleString('en-IN')}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        Orig: ₹{(((req.originalAmountPaise || 0) / 100)).toLocaleString('en-IN')}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                          req.continuityStatus === 'CONTINUOUS_DECLARED_COVERAGE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : req.continuityStatus === 'PARTIAL_DECLARED_COVERAGE'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {req.continuityStatus || 'PENDING_CHECK'}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                          req.status === RENEWAL_STATUS.ACCEPTED_FOR_RECORD
                            ? 'bg-emerald-100 text-emerald-800'
                            : req.status === RENEWAL_STATUS.CLARIFICATION_REQUIRED
                            ? 'bg-orange-100 text-orange-800'
                            : req.status === RENEWAL_STATUS.REJECTED
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <Link
                        to={`/officer/renewals/${req.renewalRequestId}`}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-[#174EA6] rounded hover:bg-[#0B1F54] transition inline-flex items-center gap-1 shadow-xs"
                      >
                        Open Dossier
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
