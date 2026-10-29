import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Building,
  ShieldAlert,
  Download,
  RefreshCw,
  Search,
  UserCheck,
  FileCheck2,
} from 'lucide-react';
import { renewalRequestRepository } from '../../storage/renewalRequestRepository';
import { releaseRequestRepository } from '../../storage/releaseRequestRepository';
import { renewalEscalationRepository } from '../../storage/renewalEscalationRepository';
import { fdrRepository } from '../../storage/fdrRepository';
import { generateRenewalPlans } from '../../renewal/renewalPlanner';
import { evaluateRenewalEscalations } from '../../renewal/escalationEngine';
import { resetDemoState } from '../../storage/migrations';
import { renewalReportBuilder } from '../../renewal/renewalReportBuilder';
import {
  RENEWAL_STATUS,
  ESCALATION_LEVELS,
  RENEWAL_PROTOTYPE_DISCLAIMER,
} from '../../renewal/renewalModel';

export default function AdminRenewalMonitoringPage() {
  const [loading, setLoading] = useState(true);
  const [fdrs, setFdrs] = useState([]);
  const [requests, setRequests] = useState([]);
  const [releases, setReleases] = useState([]);
  const [escalations, setEscalations] = useState([]);
  const [plans, setPlans] = useState([]);
  const [notification, setNotification] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadAdminRenewalData();
  }, []);

  const loadAdminRenewalData = async () => {
    try {
      setLoading(true);
      const [allFdrs, allReqs, allRels, existingEsc] = await Promise.all([
        fdrRepository.getAllFDRs ? fdrRepository.getAllFDRs() : fdrRepository.getAllFdrRecords(),
        renewalRequestRepository.getAllRequests(),
        releaseRequestRepository.getAllRequests(),
        renewalEscalationRepository.getAllEscalations(),
      ]);

      const computedPlans = generateRenewalPlans(allFdrs, allReqs);
      const computedEsc = evaluateRenewalEscalations({
        fdrs: allFdrs,
        renewalRequests: allReqs,
        releaseRequests: allRels,
      });

      const syncedEsc = await renewalEscalationRepository.syncEscalations(computedEsc);

      setFdrs(allFdrs);
      setRequests(allReqs);
      setReleases(allRels);
      setPlans(computedPlans);
      setEscalations(syncedEsc);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledgeEscalation = async (escId) => {
    try {
      await renewalEscalationRepository.acknowledgeEscalation(escId, 'admin-user');
      setNotification(`Escalation ${escId} acknowledged.`);
      loadAdminRenewalData();
      setTimeout(() => setNotification(''), 4000);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleResolveEscalation = async (escId) => {
    const notes = prompt('Enter resolution summary / administrative remarks:');
    if (!notes || notes.trim().length === 0) return;
    try {
      await renewalEscalationRepository.resolveEscalation(escId, 'admin-user', notes.trim());
      setNotification(`Escalation ${escId} resolved.`);
      loadAdminRenewalData();
      setTimeout(() => setNotification(''), 4000);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleResetDemo = () => {
    if (window.confirm('Reset all Module 07 demonstration fixtures and renewal requests to initial prototype baseline?')) {
      resetDemoState();
      loadAdminRenewalData();
      setNotification('Storage fixtures reset to baseline demonstration states.');
      setTimeout(() => setNotification(''), 4000);
    }
  };

  const handleExportCsv = () => {
    const csv = renewalReportBuilder.exportRenewalRequestsToCsv(requests);
    renewalReportBuilder.downloadFile(csv, `National_FDR_Renewal_Portfolio.csv`);
  };

  // Metrics
  const totalUpcoming90 = plans.filter((p) => p.daysUntilMaturity <= 90 && p.daysUntilMaturity >= 0).length;
  const totalMatured = plans.filter((p) => p.daysUntilMaturity < 0).length;
  const pendingScrutiny = requests.filter(
    (r) => r.status === RENEWAL_STATUS.SUBMITTED || r.status === RENEWAL_STATUS.RESUBMITTED
  ).length;
  const openEscalations = escalations.filter((e) => e.status === 'OPEN').length;

  const totalShortfallPaise = plans.reduce((sum, p) => sum + (p.shortfallPaise || 0), 0);

  const filteredEscalations = escalations.filter((e) =>
    (e.fdrNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.institutionName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.reason || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-100 text-[#0B1F54]">
              Admin Control Center
            </span>
            <span className="text-xs font-medium text-gray-500">
              Module 07 Portfolio Telemetry
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#0B1F54] mt-1 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[#174EA6]" />
            National Renewal, Continuity & Release Monitoring
          </h1>
          <p className="text-sm text-gray-600 mt-0.5">
            Cross-institutional oversight of upcoming deposit maturities, continuity gap exposures, and escalations.
          </p>
        </div>

        <div className="mt-4 md:mt-0 flex items-center gap-3">
          <button
            onClick={handleResetDemo}
            className="px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition flex items-center gap-1.5 shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Demo State
          </button>
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-[#174EA6] rounded hover:bg-[#0B1F54] transition flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-4 h-4" />
            Export Portfolio CSV
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
          <p className="text-2xl font-bold text-gray-900 mt-2">{totalUpcoming90}</p>
          <p className="text-xs text-gray-500 mt-0.5">Across all institutions</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Matured Deposits</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-rose-600 mt-2">{totalMatured}</p>
          <p className="text-xs text-gray-500 mt-0.5">Urgent renewal required</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Pending Scrutiny</span>
            <UserCheck className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-blue-600 mt-2">{pendingScrutiny}</p>
          <p className="text-xs text-gray-500 mt-0.5">Officer review backlog</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Shortfall Exposure</span>
            <ShieldAlert className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-2xl font-bold text-orange-600 mt-2">
            ₹{((totalShortfallPaise / 10000000)).toFixed(2)} Cr
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Cumulative coverage gap</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Active Escalations</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-red-600 mt-2">{openEscalations}</p>
          <p className="text-xs text-gray-500 mt-0.5">Requiring intervention</p>
        </div>
      </div>

      {/* Escalations Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-[#0B1F54] flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            System Renewal Escalations & Backlog Triggers
          </h2>
          <div className="relative w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2" />
            <input
              type="text"
              placeholder="Search escalations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[#174EA6]"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-gray-500">
            Evaluating cross-institutional telemetry...
          </div>
        ) : filteredEscalations.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            No active escalations recorded.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-100/75 text-gray-700 uppercase tracking-wider font-semibold border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">Escalation ID</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Institution & Certificate</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Trigger Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredEscalations.map((esc) => (
                  <tr key={esc.escalationId} className="hover:bg-red-50/20 transition">
                    <td className="px-4 py-3.5 font-bold text-gray-900 font-mono">
                      {esc.escalationId}
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[0.6875rem] font-semibold ${
                          esc.severity === ESCALATION_LEVELS.URGENT
                            ? 'bg-red-100 text-red-800'
                            : esc.severity === ESCALATION_LEVELS.HIGH_PRIORITY
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {esc.severity}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-gray-900">{esc.institutionName}</div>
                      <div className="text-[0.6875rem] text-gray-500">FDR #{esc.fdrNumber}</div>
                    </td>

                    <td className="px-4 py-3.5 max-w-sm text-gray-700 truncate" title={esc.reason}>
                      {esc.reason}
                    </td>

                    <td className="px-4 py-3.5 text-gray-600">
                      {esc.triggerDate}
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[0.6875rem] font-semibold ${
                          esc.status === 'RESOLVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : esc.status === 'ACKNOWLEDGED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-rose-100 text-rose-800 animate-pulse'
                        }`}
                      >
                        {esc.status}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      {esc.status === 'OPEN' && (
                        <button
                          onClick={() => handleAcknowledgeEscalation(esc.escalationId)}
                          className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 mr-2"
                        >
                          Acknowledge
                        </button>
                      )}
                      {esc.status !== 'RESOLVED' && (
                        <button
                          onClick={() => handleResolveEscalation(esc.escalationId)}
                          className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded hover:bg-emerald-100"
                        >
                          Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Prototype Notice */}
      <div className="p-3 bg-gray-50 border rounded text-xs text-gray-600">
        <span className="font-semibold text-gray-900">Administrative Notice: </span>
        {RENEWAL_PROTOTYPE_DISCLAIMER} Administrative monitoring algorithms enforce deterministic continuity tracking across the prototype network.
      </div>
    </div>
  );
}
