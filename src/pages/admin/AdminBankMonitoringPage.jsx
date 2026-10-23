import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  bankVerificationRepository,
  bankMessageRepository,
  bankReviewRepository,
} from '../../storage';
import { bankRegistry } from '../../banking/bankRegistry';
import { SIMULATION_DISCLAIMER } from '../../banking/bankMessageSchema';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import {
  ShieldAlert,
  RotateCcw,
  CheckCircle2,
  Server,
  Activity,
  ChevronRight,
  Building2,
  Trash2,
} from 'lucide-react';

export default function AdminBankMonitoringPage() {

  const [stats, setStats] = useState({
    totalRequests: 0,
    responseStatuses: { SUCCESS: 0, FAILED: 0, TIMEOUT: 0, MALFORMED: 0 },
    timeoutCount: 0,
    lienConfirmedCount: 0,
    lienDiscrepancyCount: 0,
    activeSimulatorsCount: 6,
  });
  const [banks, setBanks] = useState([]);
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const loadMonitoringData = async () => {
    setLoading(true);
    try {
      const [adminStats, bankList, allReqs] = await Promise.all([
        bankVerificationRepository.getAdminMonitoringStats(),
        bankRegistry.getAllBanks(),
        bankVerificationRepository.getAllRequests(),
      ]);

      setStats(adminStats);
      setBanks(bankList);
      setRecentRequests(
        allReqs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8)
      );
    } catch (err) {
      console.error('Error loading admin bank monitoring data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMonitoringData();
  }, []);

  // Reset Synthetic Registry
  const handleResetRegistry = async () => {
    if (!window.confirm('Reset all synthetic bank profiles to system defaults?')) return;
    setResetting(true);
    try {
      await bankRegistry.resetRegistry();
      setSuccessMsg('Synthetic bank registry successfully reset to baseline profiles.');
      await loadMonitoringData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert('Registry reset failed: ' + err.message);
    } finally {
      setResetting(false);
    }
  };

  // Reset Demo Verification Records
  const handleResetVerifications = async () => {
    if (!window.confirm('Clear all verification simulation records and restore default demo fixtures?')) return;
    setResetting(true);
    try {
      await bankVerificationRepository.clearAll();
      await bankMessageRepository.clearAll();
      await bankReviewRepository.clearAll();
      window.location.reload();
    } catch (err) {
      alert('Verification reset failed: ' + err.message);
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* SIMULATION DISCLAIMER BANNER */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl shadow-xs">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <span className="font-bold uppercase tracking-wider block text-amber-800 text-[11px]">
              {SIMULATION_DISCLAIMER}
            </span>
            Administrator Telemetry Console for client-side banking simulation engines. All bank nodes, core-banking
            interfaces, and financial messaging gateways operate under prototype simulation constraints.
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Page Header & Reset Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0B1F54] flex items-center gap-2">
            <Server className="w-6 h-6 text-[#174EA6]" />
            Synthetic Bank Simulator Monitoring
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Platform-wide telemetry, gateway status distribution, synthetic ledger controls, and simulation resets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={RotateCcw}
            onClick={handleResetRegistry}
            disabled={resetting}
          >
            Reset Bank Registry
          </Button>
          <Button
            variant="danger"
            size="sm"
            icon={Trash2}
            onClick={handleResetVerifications}
            disabled={resetting}
            className="bg-rose-600 hover:bg-rose-700 text-white"
          >
            Reset All Verifications
          </Button>
        </div>
      </div>

      {/* Telemetry Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-[#174EA6] space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Verifications
          </div>
          <div className="text-2xl font-black text-[#0B1F54]">{stats.totalRequests}</div>
          <div className="text-[11px] text-slate-500">Exchanged simulation runs</div>
        </Card>

        <Card className="p-4 border-l-4 border-l-emerald-600 space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Lien Confirmed Rate
          </div>
          <div className="text-2xl font-black text-emerald-600">
            {stats.totalRequests > 0
              ? `${Math.round((stats.lienConfirmedCount / stats.totalRequests) * 100)}%`
              : '0%'}
          </div>
          <div className="text-[11px] text-slate-500">
            {stats.lienConfirmedCount} confirmed in simulation
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-amber-500 space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Active Simulator Nodes
          </div>
          <div className="text-2xl font-black text-amber-600">{banks.length}</div>
          <div className="text-[11px] text-slate-500">Registered commercial banks</div>
        </Card>

        <Card className="p-4 border-l-4 border-l-rose-500 space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Simulated Timeouts
          </div>
          <div className="text-2xl font-black text-rose-600">{stats.timeoutCount}</div>
          <div className="text-[11px] text-slate-500">Network latency scenario triggers</div>
        </Card>
      </div>

      {/* Synthetic Bank Registry Directory */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="text-xs font-bold text-[#0B1F54] uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#174EA6]" />
            Synthetic Bank Registry Directory ({banks.length})
          </div>
          <span className="text-[11px] text-slate-500">
            All nodes strictly marked as client-side test profiles
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Bank Profile</th>
                <th className="py-3 px-4">Code / ID</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Supported Inquiries</th>
                <th className="py-3 px-4">Simulation Latency</th>
                <th className="py-3 px-4">Node Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {banks.map((b) => (
                <tr key={b.bankId} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-[#0B1F54]">{b.displayName}</div>
                    <div className="text-[10px] text-slate-400">{b.headquarters}</div>
                  </td>

                  <td className="py-3 px-4">
                    <span className="font-mono font-bold text-[#174EA6]">{b.bankCode}</span>
                    <span className="block text-[10px] font-mono text-slate-400">{b.bankId}</span>
                  </td>

                  <td className="py-3 px-4 text-slate-600">{b.bankCategory}</td>

                  <td className="py-3 px-4">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                      {b.supportedVerificationTypes?.length || 4} Verification Types
                    </span>
                  </td>

                  <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                    {b.mockResponseDelay} ms
                  </td>

                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      ACTIVE SIMULATOR
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Recent Simulation Inquiries Table */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="text-xs font-bold text-[#0B1F54] uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#174EA6]" />
            Recent Simulation Verification Activity
          </div>
          <Link
            to="/officer/bank-verifications"
            className="text-xs text-[#174EA6] hover:underline flex items-center gap-1 font-bold"
          >
            <span>Open Officer Workspace</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Institution</th>
                <th className="py-3 px-4">Target Bank</th>
                <th className="py-3 px-4">Scenario</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentRequests.map((r) => (
                <tr key={r.requestId} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-mono font-bold text-[#174EA6]">
                    {r.requestReference}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    {r.institutionName}
                  </td>
                  <td className="py-3 px-4 text-slate-700">{r.bankName}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                      {r.scenarioId ? r.scenarioId.replace('SCENARIO_', '') : 'EXACT_MATCH'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      {r.requestStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      to={`/officer/bank-verifications/${r.requestId}`}
                      className="text-[#174EA6] hover:underline font-bold text-xs"
                    >
                      View Dossier →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
