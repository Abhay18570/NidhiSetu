import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import {
  ShieldAlert,
  Building2,
  Users,
  Layers,
  ArrowRight,
  TrendingUp,
  FileCheck2,
  AlertTriangle,
  RotateCcw,
  Landmark,
  FileText,
  Activity,
  CheckCircle,
  HelpCircle,
  Filter,
  RefreshCw,
  Sliders,
  Database,
  BarChart2,
} from 'lucide-react';
import {
  aggregatePortfolio,
  computePortfolioMetrics,
  computeOfficerWorkload,
  evaluateOperationalAlerts,
  computePortfolioTrends,
  COMMAND_CENTER_PROTOTYPE_DISCLAIMER,
  BANK_SIMULATION_DISCLAIMER,
} from '../../commandCenter';

export default function AdminCommandCenterPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [workload, setWorkload] = useState(null);
  const [trends, setTrends] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [dataQualityIssues, setDataQualityIssues] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const loadData = async () => {
    setLoading(true);
    try {
      const [aggPortfolio, calculatedMetrics, calculatedWorkload, trendData, alertList] =
        await Promise.all([
          aggregatePortfolio(),
          computePortfolioMetrics(),
          computeOfficerWorkload(),
          computePortfolioTrends('30D'),
          evaluateOperationalAlerts(),
        ]);

      setMetrics(calculatedMetrics);
      setWorkload(calculatedWorkload);
      setTrends(trendData);
      setAlerts(alertList);

      // Inspect Data Quality & Freshness across records
      const detectedIssues = [];
      aggPortfolio.institutions.forEach((inst) => {
        if (!inst.category) {
          detectedIssues.push({
            id: `DQ-CAT-${inst.institutionId}`,
            type: 'MISSING_CATEGORY_METADATA',
            affectedRecord: `Institution ${inst.institutionName} (${inst.institutionId})`,
            severity: 'LOW',
            explanation: 'Institution lacks defined accreditation or regulatory category classification.',
            remediation: 'Update institutional profile from Institution Registry.',
          });
        }
        if (inst.hasComplianceShortfall && !inst.latestComplianceAssessment) {
          detectedIssues.push({
            id: `DQ-COMP-${inst.institutionId}`,
            type: 'ORPHANED_SHORTFALL_SIGNAL',
            affectedRecord: `Institution ${inst.institutionName}`,
            severity: 'MEDIUM',
            explanation: 'Shortfall flag indicated without corresponding assessment snapshot record.',
            remediation: 'Trigger compliance recalculation in Regulatory Rules engine.',
          });
        }
      });

      if (trendData.totals.submissions > 0 && calculatedMetrics.pendingAdministrativeReviewsCount > 10) {
        detectedIssues.push({
          id: 'DQ-QUEUE-BACKLOG',
          type: 'SCRUTINY_QUEUE_SATURATION',
          affectedRecord: 'Officer Administrative Queue',
          severity: 'HIGH',
          explanation: 'Pending administrative reviews exceed recommended 10-item threshold.',
          remediation: 'Reallocate pending reviews across active scrutiny officers.',
        });
      }

      setDataQualityIssues(detectedIssues);
    } catch (err) {
      console.error('[NidhiSetu Admin Command Center] Load failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw className="w-8 h-8 text-[#0B1F54] animate-spin" />
        <p className="text-sm font-medium text-slate-600">
          Compiling platform administrative telemetry...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Admin Command Header */}
      <div className="bg-[#0B1F54] text-white rounded-xl p-6 shadow-md border border-[#162E73] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#13805E] text-white uppercase tracking-wider">
              Administrator Console
            </span>
            <span className="text-xs text-slate-300 font-mono">
              PLATFORM TELEMETRY & WORKLOADS
            </span>
          </div>
          <h1 className="text-2xl font-bold mt-1 text-white">
            Administrator Command Center
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Cross-institution governance, officer scrutiny distribution, data quality integrity monitoring, and SIH demonstration management.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className="text-white border-white/20 hover:bg-white/10"
          >
            <RefreshCw className="w-4 h-4 mr-1.5" />
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/admin/demo-center')}
            className="bg-[#E89B24] hover:bg-[#d68a18] text-slate-900 font-semibold"
          >
            <Sliders className="w-4 h-4 mr-1.5" />
            SIH Demo Center
          </Button>
        </div>
      </div>

      {/* Disclaimers Banner */}
      <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-lg text-xs text-blue-900 flex items-start gap-2.5">
        <Database className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Governance Boundary: </span>
          {COMMAND_CENTER_PROTOTYPE_DISCLAIMER} All bank-derived statistics are simulated. Administrators cannot bypass underlying domain state machines.
        </div>
      </div>

      {/* Top Telemetry KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase">Total Institutions</span>
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{metrics?.totalInstitutionsCount || 0}</div>
          <div className="text-[11px] text-slate-500 mt-1">Platform-wide registered</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase">Total FDRs Declared</span>
            <FileCheck2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{metrics?.totalFdrsCount || 0}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            ₹{((metrics?.totalDeclaredDepositPaise || 0) / 100).toLocaleString('en-IN')}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase">Active Scrutiny Backlog</span>
            <Layers className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{workload?.totalOpenTasks || 0}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            {workload?.totalUnassignedTasks || 0} unassigned task(s)
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase">Active Alerts</span>
            <ShieldAlert className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-red-700">{alerts.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Operational attention items</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase">Simulated Confirmations</span>
            <Landmark className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {trends?.distributions?.simulatedBankOutcomes?.CONFIRMED_LIEN || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">[SIMULATED] Mock SFMS</div>
        </div>
      </div>

      {/* Officer Workload & Scrutiny Backlog */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Officer Workload & Scrutiny Allocation</h2>
                <p className="text-[11px] text-slate-500">Distribution of active verification and review tasks</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate('/officer/action-inbox')}
                className="text-xs"
              >
                Reallocate Tasks
              </Button>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Officer Name</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3 text-center">Open Tasks</th>
                    <th className="py-2.5 px-3 text-center">High Priority</th>
                    <th className="py-2.5 px-3 text-center">Overdue</th>
                    <th className="py-2.5 px-3 text-right">Workload Bar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {workload?.officerStats.map((off) => {
                    const maxTasks = 10;
                    const pct = Math.min(100, Math.round((off.openTasksCount / maxTasks) * 100));
                    return (
                      <tr key={off.officerId} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {off.officerName}
                          <div className="text-[10px] text-slate-400 font-normal">{off.officerEmail}</div>
                        </td>
                        <td className="py-2.5 px-3 uppercase text-[10px] font-bold text-slate-500">
                          {off.role}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-900">
                          {off.openTasksCount}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-orange-600">
                          {off.highPriorityTasksCount}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-red-600">
                          {off.overdueTasksCount}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="w-24 bg-slate-100 rounded-full h-2 inline-block overflow-hidden">
                            <div
                              className={`h-2 rounded-full ${pct > 75 ? 'bg-red-500' : pct > 40 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Data Quality & Integrity Warnings */}
        <Card className="p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Data Quality & Freshness</h2>
              <p className="text-[11px] text-slate-500">Repository integrity checks</p>
            </div>
            <Database className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-4 space-y-3">
            {dataQualityIssues.length === 0 ? (
              <div className="text-center py-8 text-xs text-emerald-600 flex flex-col items-center gap-1">
                <CheckCircle className="w-6 h-6 text-emerald-500" />
                <span>Zero integrity discrepancies detected across repositories.</span>
              </div>
            ) : (
              dataQualityIssues.map((issue) => (
                <div key={issue.id} className="p-3 rounded-lg border border-amber-200 bg-amber-50/50 text-xs space-y-1">
                  <div className="flex items-center justify-between font-semibold text-slate-800">
                    <span>{issue.type}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 font-bold">
                      {issue.severity}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600">{issue.explanation}</div>
                  <div className="text-[10px] text-blue-700 font-medium">Fix: {issue.remediation}</div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Quick Administration Actions */}
      <Card className="p-5">
        <h2 className="text-sm font-bold text-slate-900 mb-3">Governance Consoles & Reports</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Button
            variant="outline"
            onClick={() => navigate('/admin/renewal-monitoring')}
            className="flex items-center justify-center gap-2 text-xs py-3"
          >
            <RotateCcw className="w-4 h-4 text-blue-600" />
            Renewal Telemetry
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/admin/compliance-rules')}
            className="flex items-center justify-center gap-2 text-xs py-3"
          >
            <ShieldAlert className="w-4 h-4 text-emerald-600" />
            Regulatory Rules
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/admin/demo-center')}
            className="flex items-center justify-center gap-2 text-xs py-3 bg-amber-50 border-amber-200"
          >
            <Sliders className="w-4 h-4 text-amber-600" />
            SIH Demonstration Center
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/officer/portfolio-analytics')}
            className="flex items-center justify-center gap-2 text-xs py-3"
          >
            <BarChart2 className="w-4 h-4 text-purple-600" />
            Portfolio Analytics
          </Button>
        </div>
      </Card>
    </div>
  );
}
