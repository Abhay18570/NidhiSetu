import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ShieldCheck,
  Building2,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Search,
  Filter,
  PieChart,
  BarChart3,
  Layers,
  Clock,
  Sparkles,
  Info,
  ExternalLink,
} from 'lucide-react';
import { institutionRepository } from '../../storage/institutionRepository';
import { fdrRepository } from '../../storage/fdrRepository';
import { complianceRuleRepository } from '../../storage/complianceRuleRepository';
import { complianceAssessmentRepository } from '../../storage/complianceAssessmentRepository';
import { complianceCaseRepository } from '../../storage/complianceCaseRepository';
import { buildComplianceAssessment } from '../../compliance/complianceAssessmentBuilder';
import { PROTOTYPE_COMPLIANCE_DISCLAIMER } from '../../compliance/complianceDemoFixtures';

export default function AdminComplianceMonitoringPage() {
  const [loading, setLoading] = useState(true);
  const [reassessing, setReassessing] = useState(false);
  const [institutions, setInstitutions] = useState([]);
  const [rules, setRules] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [cases, setCases] = useState([]);
  const [notification, setNotification] = useState('');

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [ruleFilter, setRuleFilter] = useState('ALL');

  useEffect(() => {
    loadMonitoringData();
  }, []);

  const loadMonitoringData = async () => {
    try {
      setLoading(true);
      const [insts, allRules, allAss, allCases] = await Promise.all([
        institutionRepository.getAllInstitutions(),
        complianceRuleRepository.getAllRules(),
        complianceAssessmentRepository.getAllAssessments(),
        complianceCaseRepository.getAllCases(),
      ]);

      setInstitutions(insts);
      setRules(allRules);
      setAssessments(allAss);
      setCases(allCases);
    } catch (err) {
      console.error('Failed to load compliance monitoring telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleScopedReassess = async () => {
    try {
      setReassessing(true);
      const allFdrs = await fdrRepository.getAllFdrRecords();
      let targets = institutions;
      if (categoryFilter !== 'ALL') {
        targets = targets.filter(
          (i) => (i.category || i.institutionType) === categoryFilter
        );
      }

      for (const inst of targets) {
        const fresh = await buildComplianceAssessment({
          institution: inst,
          rules,
          fdrRecords: allFdrs,
        });
        await complianceAssessmentRepository.saveAssessment(fresh);
      }

      await loadMonitoringData();
      setNotification(`Scoped reassessment completed across ${targets.length} institutions.`);
      setTimeout(() => setNotification(''), 4000);
    } catch (err) {
      alert(`Scoped reassessment failed: ${err.message}`);
    } finally {
      setReassessing(false);
    }
  };

  // Metrics computation
  const totalInstitutions = institutions.length;
  const latestAssessmentsMap = {};
  assessments.forEach((ass) => {
    if (!latestAssessmentsMap[ass.institutionId] || new Date(ass.createdAt) > new Date(latestAssessmentsMap[ass.institutionId].createdAt)) {
      latestAssessmentsMap[ass.institutionId] = ass;
    }
  });

  const latestAssessments = Object.values(latestAssessmentsMap);
  const assessedCount = latestAssessments.length;

  const adequateCount = latestAssessments.filter((a) => a.adequacyStatus === 'ADEQUATE_DECLARED').length;
  const shortfallCount = latestAssessments.filter((a) => a.adequacyStatus === 'SHORTFALL_DECLARED').length;
  const excessCount = latestAssessments.filter((a) => a.adequacyStatus === 'EXCESS_DECLARED').length;
  const unconfiguredCount = latestAssessments.filter((a) => a.adequacyStatus === 'REQUIREMENT_NOT_CONFIGURED').length;

  const criticalRisksCount = latestAssessments.filter((a) => a.overallPriority === 'CRITICAL').length;
  const highRisksCount = latestAssessments.filter((a) => a.overallPriority === 'HIGH').length;
  const mediumRisksCount = latestAssessments.filter((a) => a.overallPriority === 'MEDIUM').length;

  const totalShortfallPaise = latestAssessments.reduce((sum, a) => sum + (a.shortfallPaise || 0), 0);
  const totalEligibleDeclaredPaise = latestAssessments.reduce((sum, a) => sum + (a.eligibleDeclaredAmountPaise || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <span>Administration</span>
            <span>/</span>
            <span className="text-[#174EA6]">Portfolio Monitoring</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0B1F54] flex items-center gap-2">
            <Activity className="w-7 h-7 text-[#174EA6]" />
            National Portfolio Compliance Telemetry
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Platform-wide security deposit adequacy distributions, systemic shortfall analytics, and rule coverage metrics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleScopedReassess}
            disabled={reassessing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#174EA6] hover:bg-[#0B1F54] rounded-md shadow-sm transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${reassessing ? 'animate-spin' : ''}`} />
            Trigger Scoped Reassessments
          </button>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 flex items-start gap-3 text-amber-900 text-xs">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">PROTOTYPE TELEMETRY: </span>
          {PROTOTYPE_COMPLIANCE_DISCLAIMER} All telemetry aggregates are computed from client-side stored records.
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg p-3 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase">Total Portfolio Deposit Monitored</div>
          <div className="text-xl font-bold text-[#0B1F54] mt-1 font-mono">
            ₹{((totalEligibleDeclaredPaise) / 100).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">{assessedCount} institutions assessed</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-red-600 uppercase">Systemic Shortfall Exposure</div>
          <div className="text-xl font-bold text-red-700 mt-1 font-mono">
            ₹{((totalShortfallPaise) / 100).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">{shortfallCount} institutions with shortfall</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-[#174EA6] uppercase">Adequacy Coverage Rate</div>
          <div className="text-xl font-bold text-[#174EA6] mt-1">
            {assessedCount > 0 ? Math.round(((adequateCount + excessCount) / assessedCount) * 100) : 0}%
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">{adequateCount + excessCount} adequate or surplus</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-purple-600 uppercase">Active Scrutiny Cases</div>
          <div className="text-xl font-bold text-purple-700 mt-1">
            {cases.filter((c) => ['OPEN', 'UNDER_REVIEW', 'AWAITING_INSTITUTION_RESPONSE'].includes(c.status)).length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Formal cases open</div>
        </div>
      </div>

      {/* Adequacy & Risk Distributions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Adequacy Distribution Card */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <h2 className="text-sm font-bold text-[#0B1F54] mb-3 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-[#174EA6]" />
            Deposit Adequacy Status Distribution
          </h2>
          <div className="space-y-2.5 text-xs">
            <div>
              <div className="flex justify-between text-slate-700 font-medium mb-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                  Adequate Declared ({adequateCount})
                </span>
                <span>{assessedCount > 0 ? Math.round((adequateCount / assessedCount) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full"
                  style={{ width: `${assessedCount > 0 ? (adequateCount / assessedCount) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-700 font-medium mb-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                  Deposit Shortfall ({shortfallCount})
                </span>
                <span>{assessedCount > 0 ? Math.round((shortfallCount / assessedCount) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full"
                  style={{ width: `${assessedCount > 0 ? (shortfallCount / assessedCount) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-700 font-medium mb-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                  Surplus Declared ({excessCount})
                </span>
                <span>{assessedCount > 0 ? Math.round((excessCount / assessedCount) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${assessedCount > 0 ? (excessCount / assessedCount) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-700 font-medium mb-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block" />
                  Requirement Not Configured ({unconfiguredCount})
                </span>
                <span>{assessedCount > 0 ? Math.round((unconfiguredCount / assessedCount) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-slate-400 h-2 rounded-full"
                  style={{ width: `${assessedCount > 0 ? (unconfiguredCount / assessedCount) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Risk Level Distribution Card */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <h2 className="text-sm font-bold text-[#0B1F54] mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#174EA6]" />
            Regulatory Risk Priority Breakdown
          </h2>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2 rounded bg-red-50 border border-red-200">
              <span className="font-bold text-red-800">CRITICAL Risk Cases</span>
              <span className="font-mono text-base font-extrabold text-red-900">{criticalRisksCount}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-amber-50 border border-amber-200">
              <span className="font-bold text-amber-800">HIGH Priority Interventions</span>
              <span className="font-mono text-base font-extrabold text-amber-900">{highRisksCount}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-blue-50 border border-blue-200">
              <span className="font-semibold text-blue-800">MEDIUM Risk Alerts</span>
              <span className="font-mono text-base font-bold text-blue-900">{mediumRisksCount}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200">
              <span className="font-medium text-slate-700">LOW / INFORMATIONAL</span>
              <span className="font-mono text-base font-semibold text-slate-800">
                {assessedCount - criticalRisksCount - highRisksCount - mediumRisksCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Rules Registry Quick Link */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
        <div>
          <div className="font-bold text-[#0B1F54]">Regulatory Deposit Rules Registry</div>
          <div className="text-slate-600 mt-0.5">
            {rules.filter((r) => r.ruleStatus === 'ACTIVE').length} Active Rules | {rules.filter((r) => r.ruleStatus === 'DRAFT').length} Drafts | {rules.filter((r) => r.ruleStatus === 'RETIRED').length} Retired
          </div>
        </div>
        <Link
          to="/admin/compliance-rules"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 font-semibold text-white bg-[#174EA6] hover:bg-[#0B1F54] rounded transition-colors shadow-sm self-start sm:self-auto"
        >
          Manage Regulatory Rules
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
