import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { useLanguage } from '../../i18n/useLanguage';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import {
  ShieldAlert,
  Building2,
  Clock,
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
  ExternalLink,
} from 'lucide-react';
import {
  aggregatePortfolio,
  computePortfolioMetrics,
  evaluateInstitutionRiskPriority,
  evaluateOperationalAlerts,
  RISK_PRIORITY,
  COMMAND_CENTER_PROTOTYPE_DISCLAIMER,
  BANK_SIMULATION_DISCLAIMER,
} from '../../commandCenter';
import { auditRepository } from '../../storage/auditRepository';

export default function OfficerCommandCenterPage() {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  const [recentAudits, setRecentAudits] = useState([]);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [filterRisk, setFilterRisk] = useState('ALL');

  const loadData = async () => {
    setLoading(true);
    try {
      const [aggPortfolio, calculatedMetrics, alerts, audits] = await Promise.all([
        aggregatePortfolio(),
        computePortfolioMetrics(),
        evaluateOperationalAlerts(),
        auditRepository.getAuditLogs ? auditRepository.getAuditLogs() : [],
      ]);

      // Enrich institutions with risk priority
      const enrichedInstitutions = aggPortfolio.institutions.map((inst) => {
        const evalResult = evaluateInstitutionRiskPriority(inst);
        return {
          ...inst,
          riskPriority: evalResult.priority,
          riskExplanation: evalResult.explanation,
          riskSignals: evalResult.triggeringSignals,
        };
      });

      setPortfolio(enrichedInstitutions);
      setMetrics(calculatedMetrics);
      setActiveAlerts(alerts.slice(0, 5));
      setRecentAudits(audits.slice(0, 6));
    } catch (err) {
      console.error('[NidhiSetu Command Center] Failed to load telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getRiskBadgeColor = (priority) => {
    switch (priority) {
      case RISK_PRIORITY.CRITICAL:
        return 'bg-red-100 text-red-800 border-red-300';
      case RISK_PRIORITY.HIGH:
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case RISK_PRIORITY.MEDIUM:
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case RISK_PRIORITY.LOW:
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case RISK_PRIORITY.INFORMATIONAL:
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const filteredInstitutions = portfolio.filter((inst) => {
    if (filterRisk === 'ALL') return true;
    return inst.riskPriority === filterRisk;
  });

  // Calculate risk counts
  const riskCounts = {
    [RISK_PRIORITY.CRITICAL]: portfolio.filter((i) => i.riskPriority === RISK_PRIORITY.CRITICAL).length,
    [RISK_PRIORITY.HIGH]: portfolio.filter((i) => i.riskPriority === RISK_PRIORITY.HIGH).length,
    [RISK_PRIORITY.MEDIUM]: portfolio.filter((i) => i.riskPriority === RISK_PRIORITY.MEDIUM).length,
    [RISK_PRIORITY.LOW]: portfolio.filter((i) => i.riskPriority === RISK_PRIORITY.LOW).length,
    [RISK_PRIORITY.INFORMATIONAL]: portfolio.filter((i) => i.riskPriority === RISK_PRIORITY.INFORMATIONAL).length,
  };

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw className="w-8 h-8 text-[#0B1F54] animate-spin" />
        <p className="text-sm font-medium text-slate-600">
          Synthesizing regulatory command center telemetry...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-[#0B1F54] text-white rounded-xl p-6 shadow-md border border-[#162E73] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#E89B24] text-slate-900 uppercase tracking-wider">
              Module 08
            </span>
            <span className="text-xs text-slate-300 font-mono">
              REGULATORY TELEMETRY • LIVE
            </span>
          </div>
          <h1 className="text-2xl font-bold mt-1 text-white">
            Unified Regulatory Command Center
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Single-pane portfolio oversight across FDR submissions, document intelligence, simulated bank verification, regulatory adequacy, and continuity lifecycles.
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
            Refresh Telemetry
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/officer/action-inbox')}
            className="bg-[#E89B24] hover:bg-[#d68a18] text-slate-900 font-semibold"
          >
            <Layers className="w-4 h-4 mr-1.5" />
            Open Action Inbox
          </Button>
        </div>
      </div>

      {/* Disclaimers & Transparency Alert */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg text-xs text-amber-900 space-y-1">
        <div className="font-semibold flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span>Regulatory & Educational Governance Safeguards</span>
        </div>
        <p>• {COMMAND_CENTER_PROTOTYPE_DISCLAIMER}</p>
        <p>• {BANK_SIMULATION_DISCLAIMER}</p>
      </div>

      {/* SECTION A: Executive KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* KPI 1 */}
        <div
          onClick={() => navigate('/officer/institutions')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Institutions</span>
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {metrics?.totalInstitutionsCount || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Under regulatory surveillance</div>
        </div>

        {/* KPI 2 */}
        <div
          onClick={() => navigate('/officer/action-inbox')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Reviews</span>
            <Layers className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {metrics?.pendingAdministrativeReviewsCount || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Awaiting scrutiny decisions</div>
        </div>

        {/* KPI 3 */}
        <div
          onClick={() => setFilterRisk(RISK_PRIORITY.CRITICAL)}
          className="bg-white p-4 rounded-xl border border-red-200 bg-red-50/20 shadow-sm hover:shadow-md transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-red-700 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Critical Signals</span>
            <ShieldAlert className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-red-700">
            {riskCounts[RISK_PRIORITY.CRITICAL] || 0}
          </div>
          <div className="text-[11px] text-red-600 mt-1">Immediate action required</div>
        </div>

        {/* KPI 4 */}
        <div
          onClick={() => navigate('/officer/compliance')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Shortfall Deficit</span>
            <TrendingUp className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-xl font-bold text-slate-900">
            ₹{((metrics?.totalShortfallPaise || 0) / 100).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {metrics?.institutionsWithShortfallCount || 0} institution(s) in deficit
          </div>
        </div>

        {/* KPI 5 */}
        <div
          onClick={() => navigate('/officer/renewals')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Upcoming Maturity</span>
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {(metrics?.maturitySchedule?.['0-7_DAYS'] || 0) + (metrics?.maturitySchedule?.['8-30_DAYS'] || 0)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Maturity within 30 days</div>
        </div>

        {/* KPI 6 */}
        <div
          onClick={() => navigate('/officer/compliance')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Open Cases</span>
            <FileText className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {metrics?.openComplianceCasesCount || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Active regulatory inquiries</div>
        </div>
      </div>

      {/* SECTION B, C & D: Risk Distribution, Lifecycles, and Maturity Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SECTION B: Risk Distribution */}
        <Card className="p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Portfolio Risk Distribution</h2>
              <p className="text-[11px] text-slate-500">Explainable operational priority</p>
            </div>
            <ShieldAlert className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-4 space-y-2.5">
            {[
              { label: 'CRITICAL', count: riskCounts[RISK_PRIORITY.CRITICAL], color: 'bg-red-500' },
              { label: 'HIGH', count: riskCounts[RISK_PRIORITY.HIGH], color: 'bg-orange-500' },
              { label: 'MEDIUM', count: riskCounts[RISK_PRIORITY.MEDIUM], color: 'bg-amber-500' },
              { label: 'LOW', count: riskCounts[RISK_PRIORITY.LOW], color: 'bg-blue-500' },
              { label: 'INFORMATIONAL', count: riskCounts[RISK_PRIORITY.INFORMATIONAL], color: 'bg-emerald-500' },
            ].map((item) => (
              <div
                key={item.label}
                onClick={() => setFilterRisk(item.label)}
                className="flex items-center justify-between text-xs p-2 rounded hover:bg-slate-50 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                  <span className="font-medium text-slate-700">{item.label}</span>
                </div>
                <span className="font-bold text-slate-900 px-2 py-0.5 bg-slate-100 rounded">
                  {item.count || 0}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* SECTION C: FDR Lifecycle Distribution */}
        <Card className="p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">FDR Lifecycle Distribution</h2>
              <p className="text-[11px] text-slate-500">Total {metrics?.totalFdrsCount || 0} deposits cataloged</p>
            </div>
            <FileCheck2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-4 space-y-2.5">
            {[
              { label: 'Active & Verified', count: metrics?.activeFdrsCount || 0, color: 'text-emerald-700' },
              { label: 'Pending Scrutiny', count: metrics?.pendingAdministrativeReviewsCount || 0, color: 'text-amber-700' },
              { label: 'Matured Certificates', count: metrics?.maturedFdrsCount || 0, color: 'text-red-700' },
              { label: 'Active Renewals', count: metrics?.activeRenewalRequestsCount || 0, color: 'text-blue-700' },
              { label: 'Pending Releases', count: metrics?.pendingReleaseRequestsCount || 0, color: 'text-slate-700' },
            ].map((row, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs p-2 rounded bg-slate-50">
                <span className="text-slate-600 font-medium">{row.label}</span>
                <span className={`font-bold ${row.color}`}>{row.count}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* SECTION D: Maturity Windows */}
        <Card className="p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Maturity Exposure Schedule</h2>
              <p className="text-[11px] text-slate-500">Renewal countdown timeline</p>
            </div>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-4 space-y-2.5">
            {[
              { label: 'Already Matured', count: metrics?.maturitySchedule?.MATURED || 0, badge: 'bg-red-100 text-red-800' },
              { label: 'Critical: 0–7 Days', count: metrics?.maturitySchedule?.['0-7_DAYS'] || 0, badge: 'bg-orange-100 text-orange-800' },
              { label: 'Upcoming: 8–30 Days', count: metrics?.maturitySchedule?.['8-30_DAYS'] || 0, badge: 'bg-amber-100 text-amber-800' },
              { label: 'Planning: 31–60 Days', count: metrics?.maturitySchedule?.['31-60_DAYS'] || 0, badge: 'bg-blue-100 text-blue-800' },
              { label: 'Standard: 61–90 Days', count: metrics?.maturitySchedule?.['61-90_DAYS'] || 0, badge: 'bg-slate-100 text-slate-700' },
            ].map((win, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs p-2 rounded hover:bg-slate-50">
                <span className="text-slate-700 font-medium">{win.label}</span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${win.badge}`}>
                  {win.count}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* SECTION E: Unified Action Queue Quick Preview & SECTION F: Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Action Queue Preview */}
        <div className="lg:col-span-2">
          <Card className="p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900">High-Priority Operational Alerts</h2>
                <p className="text-[11px] text-slate-500">Cross-module flags requiring regulatory intervention</p>
              </div>
              <Link
                to="/officer/action-inbox"
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
              >
                View Complete Inbox <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="mt-4 divide-y divide-slate-100">
              {activeAlerts.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No active operational alerts flagged.
                </div>
              ) : (
                activeAlerts.map((alert) => (
                  <div key={alert.id || alert.alertId} className="py-3 flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${alert.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                          {alert.severity}
                        </span>
                        <span className="text-xs font-bold text-slate-800">{alert.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-500">{alert.description}</p>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Source: {alert.sourceModule} • Ref: {alert.entityId}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate('/officer/action-inbox')}
                      className="shrink-0 text-xs"
                    >
                      Inspect
                    </Button>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* SECTION F: Recent Activity */}
        <Card className="p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recent Regulatory Activity</h2>
              <p className="text-[11px] text-slate-500">Immutable audit log entries</p>
            </div>
            <Activity className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-4 space-y-3">
            {recentAudits.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">No activity recorded.</div>
            ) : (
              recentAudits.map((log, idx) => (
                <div key={log.id || idx} className="text-xs space-y-0.5 border-l-2 border-blue-400 pl-3">
                  <div className="font-semibold text-slate-800">{log.action}</div>
                  <div className="text-[11px] text-slate-500">
                    {log.performedBy || 'System'} • {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* SECTION G: Institution Attention List */}
      <Card className="p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Institution Attention Portfolio</h2>
            <p className="text-[11px] text-slate-500">
              Aggregated institutional footprints with explainable risk priority
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filter:
            </span>
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className="text-xs border border-slate-300 rounded px-2.5 py-1 text-slate-700 bg-white"
            >
              <option value="ALL">All Priorities</option>
              <option value={RISK_PRIORITY.CRITICAL}>Critical Priority Only</option>
              <option value={RISK_PRIORITY.HIGH}>High Priority Only</option>
              <option value={RISK_PRIORITY.MEDIUM}>Medium Priority</option>
              <option value={RISK_PRIORITY.LOW}>Low Priority</option>
              <option value={RISK_PRIORITY.INFORMATIONAL}>Informational</option>
            </select>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Institution Name</th>
                <th className="py-2.5 px-3">Priority</th>
                <th className="py-2.5 px-3">FDR Footprint</th>
                <th className="py-2.5 px-3">Declared Principal</th>
                <th className="py-2.5 px-3">Shortfall Exposure</th>
                <th className="py-2.5 px-3">Active Items</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredInstitutions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-slate-400">
                    No institutions match the selected risk priority.
                  </td>
                </tr>
              ) : (
                filteredInstitutions.map((inst) => (
                  <tr key={inst.institutionId} className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900">{inst.institutionName}</div>
                      <div className="text-[10px] text-slate-400">
                        ID: {inst.institutionId} • {inst.state}
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getRiskBadgeColor(inst.riskPriority)}`}>
                        {inst.riskPriority}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      {inst.totalFdrs} FDRs ({inst.activeFdrs} Active)
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      ₹{((inst.declaredDepositAmountPaise || 0) / 100).toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 font-semibold">
                      {inst.shortfallPaise > 0 ? (
                        <span className="text-red-700">
                          -₹{((inst.shortfallPaise || 0) / 100).toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <span className="text-emerald-700">Adequate</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-500">
                      {inst.activeRenewalCount > 0 && `${inst.activeRenewalCount} Renewal `}
                      {inst.openComplianceCaseCount > 0 && `${inst.openComplianceCaseCount} Case `}
                      {inst.unresolvedDocumentFindingCount > 0 && `${inst.unresolvedDocumentFindingCount} OCR `}
                      {inst.activeRenewalCount === 0 && inst.openComplianceCaseCount === 0 && inst.unresolvedDocumentFindingCount === 0 && '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Link
                        to={`/officer/institution-intelligence/${inst.institutionId}`}
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold"
                      >
                        Dossier <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* SECTION H: Quick Navigation Workflows */}
      <Card className="p-5">
        <h2 className="text-sm font-bold text-slate-900 mb-3">
          Authoritative Operational Module Consoles
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Scrutiny Queue', route: '/officer/verification-queue', icon: Layers, desc: 'Module 03 FDRs' },
            { label: 'Document Intel', route: '/officer/document-intelligence', icon: FileText, desc: 'Module 04 OCR' },
            { label: 'Bank Confirmations', route: '/officer/bank-verifications', icon: Landmark, desc: 'Module 05 SFMS' },
            { label: 'Compliance Adequacy', route: '/officer/compliance', icon: TrendingUp, desc: 'Module 06 Norms' },
            { label: 'FDR Renewals', route: '/officer/renewals', icon: RotateCcw, desc: 'Module 07 Continuity' },
            { label: 'Portfolio Analytics', route: '/officer/portfolio-analytics', icon: Activity, desc: 'Module 08 Visuals' },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                onClick={() => navigate(item.route)}
                className="p-3 bg-slate-50 border border-slate-200 rounded-lg hover:border-blue-400 hover:bg-blue-50/30 transition cursor-pointer text-center"
              >
                <Icon className="w-5 h-5 mx-auto text-[#0B1F54] mb-1.5" />
                <div className="text-xs font-bold text-slate-800">{item.label}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{item.desc}</div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
