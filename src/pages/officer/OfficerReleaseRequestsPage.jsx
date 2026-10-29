import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileCheck2,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Download,
  Building,
  ShieldAlert,
} from 'lucide-react';
import { releaseRequestRepository } from '../../storage/releaseRequestRepository';
import { renewalReportBuilder } from '../../renewal/renewalReportBuilder';
import { RELEASE_STATUS, ADMIN_RELEASE_DISCLAIMER } from '../../renewal/renewalModel';

export default function OfficerReleaseRequestsPage() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    loadReleaseRequests();
  }, []);

  const loadReleaseRequests = async () => {
    try {
      setLoading(true);
      const all = await releaseRequestRepository.getAllRequests();
      setRequests(all);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = () => {
    const csv = renewalReportBuilder.exportReleaseRequestsToCsv(requests);
    renewalReportBuilder.downloadFile(csv, `Administrative_Release_Officer_Queue.csv`);
  };

  // KPIs
  const pendingCount = requests.filter(
    (r) => r.status === RELEASE_STATUS.SUBMITTED || r.status === RELEASE_STATUS.UNDER_REVIEW
  ).length;
  const clearedCount = requests.filter((r) => r.status === RELEASE_STATUS.ADMINISTRATIVELY_CLEARED).length;
  const declinedCount = requests.filter((r) => r.status === RELEASE_STATUS.DECLINED).length;

  const filteredRequests = requests.filter((r) => {
    const matchesSearch =
      (r.requestReference || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.originalFdrNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.institutionName || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-900">
              Administrative Clearance Queue
            </span>
            <span className="text-xs font-medium text-gray-500">
              Module 07 Release Scrutiny
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#0B1F54] mt-1 flex items-center gap-2">
            <FileCheck2 className="w-6 h-6 text-emerald-700" />
            Administrative Release Request Adjudication
          </h1>
          <p className="text-sm text-gray-600 mt-0.5">
            Evaluate institutional requests for administrative release of superseded or matured security deposits.
          </p>
        </div>

        <div className="mt-4 md:mt-0 flex items-center gap-3">
          <Link
            to="/officer/renewals"
            className="px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition shadow-xs"
          >
            Renewals Queue
          </Link>
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 rounded hover:bg-emerald-800 transition flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-4 h-4" />
            Export Queue CSV
          </button>
        </div>
      </div>

      {/* Regulatory Boundary Notice */}
      <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900 flex items-start gap-2">
        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Regulatory Scope: </span>
          {ADMIN_RELEASE_DISCLAIMER} Clearance granted here reflects administrative record acceptance only and does not discharge underlying banking liens.
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Pending Adjudication</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600 mt-2">{pendingCount}</p>
          <p className="text-xs text-gray-500 mt-0.5">Awaiting scrutiny</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Administratively Cleared</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-2">{clearedCount}</p>
          <p className="text-xs text-gray-500 mt-0.5">Clearance recorded</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Declined Applications</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-rose-600 mt-2">{declinedCount}</p>
          <p className="text-xs text-gray-500 mt-0.5">Insufficient justification</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs p-2 border border-gray-300 rounded focus:ring-1 focus:ring-[#174EA6]"
        >
          <option value="ALL">All Statuses</option>
          <option value={RELEASE_STATUS.SUBMITTED}>Submitted</option>
          <option value={RELEASE_STATUS.UNDER_REVIEW}>Under Review</option>
          <option value={RELEASE_STATUS.ADMINISTRATIVELY_CLEARED}>Administratively Cleared</option>
          <option value={RELEASE_STATUS.DECLINED}>Declined</option>
        </select>

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
            <FileCheck2 className="w-4 h-4 text-emerald-700" />
            Release Request Scrutiny Queue
          </h2>
          <span className="text-xs text-gray-500 font-medium">
            Showing {filteredRequests.length} applications
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-gray-500">
            Loading administrative release requests...
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            No administrative release requests match the current filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-100/75 text-gray-700 uppercase tracking-wider font-semibold border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Institution</th>
                  <th className="px-4 py-3">Target FDR</th>
                  <th className="px-4 py-3">Stated Reason</th>
                  <th className="px-4 py-3">Related Renewal</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRequests.map((req) => (
                  <tr key={req.requestId} className="hover:bg-emerald-50/20 transition">
                    <td className="px-4 py-3.5 font-bold text-[#0B1F54]">
                      {req.requestReference || req.requestId}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-gray-900">{req.institutionName}</div>
                      <div className="text-[0.6875rem] text-gray-500">ID: {req.institutionId}</div>
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
                      {req.relatedRenewalRequestId || 'Direct'}
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[0.6875rem] font-semibold ${
                          req.status === RELEASE_STATUS.ADMINISTRATIVELY_CLEARED
                            ? 'bg-emerald-100 text-emerald-800'
                            : req.status === RELEASE_STATUS.DECLINED
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <Link
                        to={`/officer/release-requests/${req.requestId}`}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 rounded hover:bg-emerald-800 transition inline-flex items-center gap-1 shadow-xs"
                      >
                        Review Request
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
