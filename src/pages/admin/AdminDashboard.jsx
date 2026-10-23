import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { userRepository } from '../../storage/userRepository';
import { institutionRepository } from '../../storage/institutionRepository';
import { auditRepository } from '../../storage/auditRepository';
import { fdrRepository } from '../../storage/fdrRepository';
import { FDR_STATUS } from '../../storage/fdrLifecycleRepository';
import { formatINR } from '../../storage/fdrValidation';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import {
  Users,
  Building2,
  ScrollText,
  ShieldCheck,
  ServerCog,
  ArrowRight,
  Activity,
  HardDrive,
  IndianRupee,
  Layers,
  Clock,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';

export default function AdminDashboard() {
  const { currentUser } = useAuth();
  const [userCount, setUserCount] = useState(0);
  const [instCount, setInstCount] = useState(0);
  const [auditCount, setAuditCount] = useState(0);
  const [recentUsers, setRecentUsers] = useState([]);
  const [fdrStats, setFdrStats] = useState({
    totalFDRCount: 0,
    totalDeclaredDepositPaise: 0,
    statusCounts: {},
    upcomingMaturitiesTotal: 0,
    maturedTotal: 0,
  });
  const [institutionBreakdown, setInstitutionBreakdown] = useState([]);

  useEffect(() => {
    async function loadStats() {
      const users = await userRepository.getAllUsers();
      setUserCount(users.length);
      setRecentUsers(users.slice(0, 4));

      const insts = await institutionRepository.getAllInstitutions();
      setInstCount(insts.length);

      const audits = await auditRepository.getAuditLogs();
      setAuditCount(audits.length);

      const stats = await fdrRepository.getPlatformFdrStats();
      setFdrStats(stats);

      const allFdrs = await fdrRepository.getAllFDRs();
      const nonDrafts = allFdrs.filter((f) => f.status !== FDR_STATUS.DRAFT);

      // Group non-drafts by institution
      const breakdownMap = {};
      insts.forEach((inst) => {
        breakdownMap[inst.id] = {
          id: inst.id,
          name: inst.name,
          aisheCode: inst.aisheCode,
          state: inst.state,
          totalCount: 0,
          totalPaise: 0,
          acceptedCount: 0,
          pendingCount: 0,
        };
      });

      nonDrafts.forEach((fdr) => {
        if (!breakdownMap[fdr.institutionId]) {
          breakdownMap[fdr.institutionId] = {
            id: fdr.institutionId,
            name: fdr.institutionId,
            aisheCode: '—',
            state: '—',
            totalCount: 0,
            totalPaise: 0,
            acceptedCount: 0,
            pendingCount: 0,
          };
        }
        const b = breakdownMap[fdr.institutionId];
        b.totalCount++;
        b.totalPaise += fdr.depositAmountPaise || 0;
        if (fdr.status === FDR_STATUS.REVIEW_ACCEPTED) {
          b.acceptedCount++;
        } else if (fdr.status === FDR_STATUS.SUBMITTED || fdr.status === FDR_STATUS.UNDER_REVIEW) {
          b.pendingCount++;
        }
      });

      setInstitutionBreakdown(Object.values(breakdownMap));
    }
    loadStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="bg-white rounded-xl border border-[#D3DDEB] p-6 gov-shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0B1F54]">
              Platform System Governance
            </span>
            <Badge variant="navy" size="sm">
              Root Administrator Seat
            </Badge>
          </div>
          <h1 className="text-2xl font-black text-[#0B1F54]">
            {currentUser?.name || 'Administrator Console'}
          </h1>
          <p className="text-xs sm:text-sm text-[#505F79] mt-0.5">
            Centralized management of demo user roles, institutional accounts, and cryptographic audit telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            to="/admin/users"
            variant="primary"
            size="sm"
            icon={Users}
            className="font-semibold"
          >
            Manage Users
          </Button>
          <Button
            to="/admin/audit-logs"
            variant="outline"
            size="sm"
            icon={ScrollText}
            className="font-semibold"
          >
            Audit Logs
          </Button>
        </div>
      </div>

      {/* Prototype Telemetry Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-[#E89B24] shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Prototype Telemetry Notice: </span>
          Monetary values and submission aggregates shown below are calculated directly from local browser storage.
          These totals represent self-reported institutional deposit figures for demonstration purposes and do not represent bank-confirmed balances.
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex items-center justify-between border-l-4 border-l-[#174EA6]">
          <div>
            <div className="text-xs text-[#505F79] font-medium">Total FDR Records</div>
            <div className="text-2xl font-black text-[#0B1F54] mt-1">{fdrStats.totalFDRCount}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Across All Institutions</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#E8F0FE] text-[#174EA6] flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between border-l-4 border-l-[#13805E]">
          <div>
            <div className="text-xs text-[#505F79] font-medium">Total Declared Value</div>
            <div className="text-2xl font-black text-[#13805E] mt-1">
              {formatINR(fdrStats.totalDeclaredDepositPaise)}
            </div>
            <div className="text-[11px] text-amber-600 font-medium mt-0.5">Self-Reported Prototype Value</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#E6F4EA] text-[#13805E] flex items-center justify-center shrink-0">
            <IndianRupee className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between border-l-4 border-l-[#E89B24]">
          <div>
            <div className="text-xs text-[#505F79] font-medium">Upcoming Maturities</div>
            <div className="text-2xl font-black text-[#E89B24] mt-1">{fdrStats.upcomingMaturitiesTotal}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Expiring ≤ 90 Days</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#FEF7EC] text-[#E89B24] flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between border-l-4 border-l-slate-400">
          <div>
            <div className="text-xs text-[#505F79] font-medium">Audit Trail Stream</div>
            <div className="text-2xl font-black text-[#0B1F54] mt-1">{auditCount}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Recorded Events</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-[#0B1F54] flex items-center justify-center shrink-0">
            <ScrollText className="w-6 h-6" />
          </div>
        </Card>
      </div>

      {/* Status Distribution Strip */}
      <Card className="p-5 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B1F54]">
          Platform FDR Lifecycle Distribution
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
            <div className="text-lg font-black text-[#174EA6]">
              {fdrStats.statusCounts[FDR_STATUS.SUBMITTED] || 0}
            </div>
            <div className="text-[11px] font-semibold text-[#505F79] uppercase mt-0.5">Submitted</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
            <div className="text-lg font-black text-indigo-700">
              {fdrStats.statusCounts[FDR_STATUS.UNDER_REVIEW] || 0}
            </div>
            <div className="text-[11px] font-semibold text-[#505F79] uppercase mt-0.5">Under Review</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
            <div className="text-lg font-black text-amber-600">
              {fdrStats.statusCounts[FDR_STATUS.CLARIFICATION_REQUIRED] || 0}
            </div>
            <div className="text-[11px] font-semibold text-[#505F79] uppercase mt-0.5">Clarification</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
            <div className="text-lg font-black text-[#13805E]">
              {fdrStats.statusCounts[FDR_STATUS.REVIEW_ACCEPTED] || 0}
            </div>
            <div className="text-[11px] font-semibold text-[#505F79] uppercase mt-0.5">Accepted</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
            <div className="text-lg font-black text-[#C5221F]">
              {fdrStats.statusCounts[FDR_STATUS.REVIEW_REJECTED] || 0}
            </div>
            <div className="text-[11px] font-semibold text-[#505F79] uppercase mt-0.5">Rejected</div>
          </div>
        </div>
      </Card>

      {/* Institution-Wise Records Table */}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#174EA6]" />
            <span className="font-bold text-xs text-[#0B1F54] uppercase tracking-wider">
              Institution Deposit Breakdown
            </span>
          </div>
          <Link to="/admin/institutions" className="text-xs font-bold text-[#174EA6] hover:underline flex items-center gap-1">
            <span>View All Institutions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F7FB] border-b border-slate-200 text-[#505F79] font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Institution Name</th>
                <th className="px-3 py-3">AISHE Code</th>
                <th className="px-3 py-3">State</th>
                <th className="px-3 py-3 text-right">FDR Count</th>
                <th className="px-3 py-3 text-right">Accepted / Pending</th>
                <th className="px-4 py-3 text-right">Declared Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[#0B1F54]">
              {institutionBreakdown.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-bold text-[#0B1F54]">{row.name}</div>
                  </td>
                  <td className="px-3 py-3 font-mono font-bold text-[#174EA6]">{row.aisheCode}</td>
                  <td className="px-3 py-3 text-slate-600">{row.state}</td>
                  <td className="px-3 py-3 text-right font-bold">{row.totalCount}</td>
                  <td className="px-3 py-3 text-right">
                    <span className="text-[#13805E] font-semibold">{row.acceptedCount}</span>
                    <span className="text-slate-400 mx-1">/</span>
                    <span className="text-amber-600 font-semibold">{row.pendingCount}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-[#0B1F54]">
                    {formatINR(row.totalPaise)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Recent Users Table */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="p-0 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <span className="font-bold text-xs text-[#0B1F54] uppercase tracking-wider">
                Registered Prototype Users
              </span>
              <Link to="/admin/users" className="text-xs font-bold text-[#174EA6] hover:underline flex items-center gap-1">
                <span>Manage All Accounts</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F5F7FB] border-b border-slate-200 text-[#505F79] font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">User Name</th>
                    <th className="px-3 py-3">Role</th>
                    <th className="px-3 py-3">Email Address</th>
                    <th className="px-3 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[#0B1F54]">
                  {recentUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-bold">{u.name}</div>
                        <div className="text-[11px] text-[#505F79]">{u.designation}</div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="font-mono uppercase font-bold text-[#174EA6] text-[11px]">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-mono text-slate-600">
                        {u.email}
                      </td>
                      <td className="px-3 py-3">
                        <Badge variant={u.status === 'active' ? 'green' : 'gray'} size="sm">
                          {u.status === 'active' ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Column: Quick Governance Utilities */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B1F54] border-b border-slate-100 pb-2">
              Platform Controls
            </h3>
            <div className="space-y-2 text-xs">
              <Link
                to="/admin/users"
                className="block p-3 rounded-lg bg-[#F5F7FB] border border-[#D3DDEB] hover:border-[#174EA6] transition-colors"
              >
                <div className="font-bold text-[#0B1F54]">User Role Governance</div>
                <div className="text-[#505F79] text-[11px] mt-0.5">Activate or deactivate institution and officer seats.</div>
              </Link>

              <Link
                to="/admin/audit-logs"
                className="block p-3 rounded-lg bg-[#F5F7FB] border border-[#D3DDEB] hover:border-[#174EA6] transition-colors"
              >
                <div className="font-bold text-[#0B1F54]">Inspection Audit Trail</div>
                <div className="text-[#505F79] text-[11px] mt-0.5">Review chronological authentication & profile logs.</div>
              </Link>

              <Link
                to="/admin/settings"
                className="block p-3 rounded-lg bg-[#F5F7FB] border border-[#D3DDEB] hover:border-[#174EA6] transition-colors"
              >
                <div className="font-bold text-[#0B1F54]">Demo State & Storage Reset</div>
                <div className="text-[#505F79] text-[11px] mt-0.5">Restore deterministic synthetic seed data.</div>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
