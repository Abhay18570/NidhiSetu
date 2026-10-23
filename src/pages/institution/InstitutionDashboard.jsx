import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { auditRepository } from '../../storage/auditRepository';
import { fdrRepository } from '../../storage/fdrRepository';
import { evaluateAndGenerateMaturityReminders, getMaturityBadgeConfig } from '../../storage/fdrMaturityService';
import { formatINR } from '../../storage/fdrValidation';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import {
  FileText,
  FileCheck2,
  Clock,
  Building2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Plus,
  RotateCcw,
  Sparkles
} from 'lucide-react';

export default function InstitutionDashboard() {
  const { currentUser, currentInstitution } = useAuth();
  const [activities, setActivities] = useState([]);
  const [recentFdrs, setRecentFdrs] = useState([]);
  const [stats, setStats] = useState({
    totalRecords: 0,
    accepted: 0,
    underReview: 0,
    submitted: 0,
    clarification: 0,
    upcomingMaturities: 0,
    maturedCount: 0,
    totalDepositPaise: 0,
  });

  useEffect(() => {
    async function loadData() {
      if (!currentInstitution?.id) return;

      // 1. Load real FDR stats
      const fdrStats = await fdrRepository.getInstitutionFdrStats(currentInstitution.id);
      setStats(fdrStats);

      // 2. Load recent FDR submissions
      const list = await fdrRepository.getFDRsByInstitution(currentInstitution.id);
      setRecentFdrs(list.slice(0, 4));

      // 3. Evaluate and trigger client-side maturity reminders (idempotent)
      await evaluateAndGenerateMaturityReminders(list, currentUser?.id);

      // 4. Load recent activities
      const allLogs = await auditRepository.getAuditLogs();
      const relevant = allLogs.filter(
        (log) =>
          log.targetEntityId === currentInstitution.id ||
          log.actorId === currentUser?.id ||
          log.eventType?.startsWith('FDR_')
      );
      setActivities(relevant.slice(0, 5));
    }

    loadData();
  }, [currentInstitution, currentUser]);

  return (
    <div className="space-y-6 max-w-7xl pb-16">
      {/* Welcome Banner */}
      <div className="bg-white rounded-xl border border-[#D3DDEB] p-6 gov-shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#174EA6]">
              Educational Institution Console
            </span>
            <Badge variant="green" size="sm">
              {currentInstitution?.status === 'active' ? 'Account Active' : 'Pending Verification'}
            </Badge>
          </div>
          <h1 className="text-2xl font-black text-[#0B1F54]">
            Welcome, {currentUser?.name}
          </h1>
          <p className="text-xs sm:text-sm text-[#505F79] mt-0.5">
            {currentInstitution?.name} &bull; <span className="font-mono font-semibold">AISHE: {currentInstitution?.aisheCode}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            to="/institution/fdr/new"
            variant="primary"
            size="sm"
            icon={Plus}
            className="font-bold shadow-sm"
          >
            Submit New FDR
          </Button>
          <Button
            to="/institution/fdr-records"
            variant="outline"
            size="sm"
            icon={FileText}
            className="font-semibold"
          >
            FDR Repository
          </Button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex items-center justify-between">
          <div>
            <div className="text-xs text-[#505F79] font-medium">Total FDR Records</div>
            <div className="text-2xl font-black text-[#0B1F54] mt-1">{stats.totalRecords}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Deposits on File</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#E8F0FE] text-[#174EA6] flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div>
            <div className="text-xs text-[#505F79] font-medium">Verified Deposits</div>
            <div className="text-2xl font-black text-[#13805E] mt-1">{stats.accepted}</div>
            <div className="text-[11px] text-[#13805E] font-semibold mt-0.5">
              {formatINR(stats.totalDepositPaise, true)}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#E6F4EA] text-[#13805E] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div>
            <div className="text-xs text-[#505F79] font-medium">In Scrutiny / Review</div>
            <div className="text-2xl font-black text-[#174EA6] mt-1">
              {stats.underReview + stats.submitted}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {stats.clarification > 0 ? `${stats.clarification} Needs Clarification` : 'With Regulatory Officers'}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#FEF7EC] text-[#E89B24] flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div>
            <div className="text-xs text-[#505F79] font-medium">Upcoming Renewals</div>
            <div className="text-2xl font-black text-rose-600 mt-1">{stats.upcomingMaturities}</div>
            <div className="text-[11px] text-rose-500 font-semibold mt-0.5">
              {stats.maturedCount > 0 ? `${stats.maturedCount} Already Matured` : 'Within 90 Days'}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <RotateCcw className="w-6 h-6" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Recent FDR Submissions & Profile */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active FDR Submissions Docket */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-[#174EA6]" />
                <h2 className="text-base font-bold text-[#0B1F54]">Recent FDR Submissions</h2>
              </div>
              <Link
                to="/institution/fdr-records"
                className="text-xs font-bold text-[#174EA6] hover:underline flex items-center gap-1"
              >
                <span>View All Records</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentFdrs.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <p className="text-xs text-slate-500">No deposit records submitted yet.</p>
                <Button to="/institution/fdr/new" variant="primary" size="sm" icon={Plus}>
                  Submit First FDR Scan
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentFdrs.map((item) => {
                  const badge = getMaturityBadgeConfig(item.maturityDate);
                  return (
                    <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                      <div className="space-y-0.5 truncate max-w-xs">
                        <Link
                          to={`/institution/fdr/${item.id}`}
                          className="font-mono font-bold text-[#174EA6] hover:underline"
                        >
                          {item.referenceNumber}
                        </Link>
                        <div className="font-semibold text-[#0B1F54] truncate">{item.bankName}</div>
                        <div className="text-[11px] text-slate-500">
                          {formatINR(item.depositAmountPaise, true)} &bull; Matures: {item.maturityDate}
                        </div>
                      </div>

                      <div className="text-right space-y-1 shrink-0">
                        <Badge
                          variant={
                            item.status === 'REVIEW_ACCEPTED'
                              ? 'green'
                              : item.status === 'CLARIFICATION_REQUIRED'
                              ? 'saffron'
                              : item.status === 'REVIEW_REJECTED'
                              ? 'red'
                              : 'blue'
                          }
                          size="sm"
                        >
                          {item.status.replace(/_/g, ' ')}
                        </Badge>
                        <div>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${badge.colorClass}`}>
                            {badge.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Institution Profile Summary Card */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#174EA6]" />
                <h2 className="text-base font-bold text-[#0B1F54]">Institution Profile Overview</h2>
              </div>
              <Badge variant="blue" size="sm">
                {currentInstitution?.type || 'Technical Institute'}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 font-semibold block uppercase text-[10px]">Statutory Name:</span>
                <span className="font-bold text-[#0B1F54]">{currentInstitution?.name}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block uppercase text-[10px]">AISHE Code:</span>
                <span className="font-mono font-bold text-[#174EA6]">{currentInstitution?.aisheCode}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block uppercase text-[10px]">Location:</span>
                <span className="text-slate-700">{currentInstitution?.city}, {currentInstitution?.state}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block uppercase text-[10px]">Representative:</span>
                <span className="font-semibold text-slate-800">{currentInstitution?.representativeName}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">
                Ref ID: {currentInstitution?.regReferenceNo || currentInstitution?.id}
              </span>
              <Link
                to="/institution/profile"
                className="text-xs font-bold text-[#174EA6] hover:underline flex items-center gap-1"
              >
                <span>Edit Profile</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Card>
        </div>

        {/* Right Column: Quick Actions & Audit Trail */}
        <div className="lg:col-span-5 space-y-6">
          {/* Quick Actions */}
          <Card className="p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B1F54] border-b border-slate-100 pb-2">
              Workspace Quick Actions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button
                to="/institution/fdr/new"
                variant="primary"
                size="sm"
                icon={Plus}
                className="justify-start text-xs font-bold"
              >
                Submit New FDR
              </Button>
              <Button
                to="/institution/fdr-records"
                variant="secondary"
                size="sm"
                icon={FileCheck2}
                className="justify-start text-xs font-semibold"
              >
                FDR Repository
              </Button>
              <Button
                to="/institution/profile"
                variant="secondary"
                size="sm"
                icon={Building2}
                className="justify-start text-xs font-semibold"
              >
                View Profile
              </Button>
              <Button
                to="/institution/notifications"
                variant="secondary"
                size="sm"
                icon={AlertCircle}
                className="justify-start text-xs font-semibold"
              >
                Notifications
              </Button>
            </div>
          </Card>

          {/* Activity Log */}
          <Card className="p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B1F54]">
                Recent Institutional Activity
              </h3>
              <span className="text-[10px] text-slate-400">Audit Trail</span>
            </div>

            {activities.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#505F79]">
                No recent activity logged for this institution.
              </div>
            ) : (
              <div className="space-y-3">
                {activities.map((act) => (
                  <div key={act.id} className="text-xs border-b border-slate-50 pb-2 last:border-none">
                    <div className="font-semibold text-[#0B1F54]">{act.summary}</div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      <span className="font-mono">{act.eventType}</span>
                      <span>&bull;</span>
                      <span>{new Date(act.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
