import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  Filter,
  Play,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Building,
  FileCheck2,
  FileWarning,
  Eye,
  Info,
} from 'lucide-react';
import { institutionRepository } from '../../storage/institutionRepository';
import { fdrRepository } from '../../storage/fdrRepository';
import { complianceRuleRepository } from '../../storage/complianceRuleRepository';
import { complianceAssessmentRepository } from '../../storage/complianceAssessmentRepository';
import { complianceCaseRepository } from '../../storage/complianceCaseRepository';
import { buildComplianceAssessment } from '../../compliance/complianceAssessmentBuilder';
import { PROTOTYPE_COMPLIANCE_DISCLAIMER } from '../../compliance/complianceDemoFixtures';

export default function OfficerCompliancePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [runningAssessmentId, setRunningAssessmentId] = useState(null);
  const [institutions, setInstitutions] = useState([]);
  const [assessmentsMap, setAssessmentsMap] = useState({});
  const [rules, setRules] = useState([]);
  const [cases, setCases] = useState([]);
  const [notification, setNotification] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [adequacyFilter, setAdequacyFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [insts, allRules, allAssessments, allCases, allFdrs] = await Promise.all([
        institutionRepository.getAllInstitutions(),
        complianceRuleRepository.getAllRules(),
        complianceAssessmentRepository.getAllAssessments(),
        complianceCaseRepository.getAllCases(),
        fdrRepository.getAllFdrRecords(),
      ]);

      setInstitutions(insts);
      setRules(allRules);
      setCases(allCases);

      // Build map of latest assessment per institution
      const map = {};
      allAssessments.forEach((ass) => {
        if (!map[ass.institutionId] || new Date(ass.createdAt) > new Date(map[ass.institutionId].createdAt)) {
          map[ass.institutionId] = ass;
        }
      });

      // Auto-evaluate any institution that has never been assessed
      for (const inst of insts) {
        if (!map[inst.id]) {
          try {
            const fresh = await buildComplianceAssessment({
              institution: inst,
              rules: allRules,
              fdrRecords: allFdrs,
            });
            await complianceAssessmentRepository.saveAssessment(fresh);
            map[inst.id] = fresh;
          } catch (e) {
            console.warn('Initial assessment failed for', inst.id, e);
          }
        }
      }

      setAssessmentsMap(map);
    } catch (err) {
      console.error('Failed to load compliance data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunAssessment = async (institution) => {
    try {
      setRunningAssessmentId(institution.id);
      const allFdrs = await fdrRepository.getAllFdrRecords();
      const prev = assessmentsMap[institution.id] || null;

      const freshAssessment = await buildComplianceAssessment({
        institution,
        rules,
        fdrRecords: allFdrs,
        previousAssessment: prev,
      });

      await complianceAssessmentRepository.saveAssessment(freshAssessment);
      setAssessmentsMap((prevMap) => ({ ...prevMap, [institution.id]: freshAssessment }));
      setNotification(`Compliance assessment re-evaluated for ${institution.name || institution.id}.`);
      setTimeout(() => setNotification(''), 4000);
    } catch (err) {
      alert(`Assessment failed: ${err.message}`);
    } finally {
      setRunningAssessmentId(null);
    }
  };

  const handleReassessAll = async () => {
    try {
      setLoading(true);
      const allFdrs = await fdrRepository.getAllFdrRecords();
      for (const inst of institutions) {
        const prev = assessmentsMap[inst.id] || null;
        const fresh = await buildComplianceAssessment({
          institution: inst,
          rules,
          fdrRecords: allFdrs,
          previousAssessment: prev,
        });
        await complianceAssessmentRepository.saveAssessment(fresh);
      }
      await loadData();
      setNotification('All institution assessments successfully re-evaluated.');
      setTimeout(() => setNotification(''), 4000);
    } catch (err) {
      alert(`Batch assessment failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // KPI Calculations
  const assessedCount = Object.keys(assessmentsMap).length;
  const shortfallCount = Object.values(assessmentsMap).filter(
    (a) => a.adequacyStatus === 'SHORTFALL_DECLARED'
  ).length;
  const upcomingMaturityCount = Object.values(assessmentsMap).reduce((acc, a) => {
    return acc + (a.maturityFindings?.filter((m) => m.daysRemaining >= 0 && m.daysRemaining <= 90)?.length || 0);
  }, 0);
  const openCasesCount = cases.filter((c) => ['OPEN', 'UNDER_REVIEW', 'AWAITING_INSTITUTION_RESPONSE'].includes(c.status)).length;
  const highPriorityCount = Object.values(assessmentsMap).filter((a) => ['HIGH', 'CRITICAL'].includes(a.overallPriority)).length;
  const staleAssessmentsCount = Object.values(assessmentsMap).filter((a) => a.assessmentStatus === 'STALE').length;

  // Filtered rows
  const filteredInstitutions = institutions.filter((inst) => {
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      (inst.name && inst.name.toLowerCase().includes(q)) ||
      (inst.code && inst.code.toLowerCase().includes(q)) ||
      (inst.id && String(inst.id).toLowerCase().includes(q));

    const assessment = assessmentsMap[inst.id];
    const matchesAdequacy =
      adequacyFilter === 'ALL' || (assessment && assessment.adequacyStatus === adequacyFilter);
    const matchesPriority =
      priorityFilter === 'ALL' || (assessment && assessment.overallPriority === priorityFilter);
    const matchesCategory =
      categoryFilter === 'ALL' || (inst.category || inst.institutionType) === categoryFilter;

    return matchesQuery && matchesAdequacy && matchesPriority && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <span>Regulatory Oversight</span>
            <span>/</span>
            <span className="text-[#174EA6]">Compliance Intelligence</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0B1F54] flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-[#174EA6]" />
            Regulatory Compliance Monitoring Console
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Real-time deposit adequacy analysis, calendar-safe maturity risks, OCR intelligence, and simulated bank confirmation signals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReassessAll}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 shadow-sm transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Reassess All Institutions
          </button>
        </div>
      </div>

      {/* Disclaimer Alert */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 flex items-start gap-3 text-amber-900 text-xs">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">PROTOTYPE NOTICE: </span>
          {PROTOTYPE_COMPLIANCE_DISCLAIMER} Automated calculations are indicative advisory indicators designed to aid regulatory officers.
        </div>
      </div>

      {/* Success Notification */}
      {notification && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg p-3 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Assessed</div>
          <div className="text-xl font-bold text-[#0B1F54] mt-1">{assessedCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Institutions monitored</div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-red-600 uppercase">Shortfalls</div>
          <div className="text-xl font-bold text-red-700 mt-1">{shortfallCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Deposit deficit</div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-amber-600 uppercase">Maturity Alerts</div>
          <div className="text-xl font-bold text-amber-700 mt-1">{upcomingMaturityCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Within 90 days</div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-purple-600 uppercase">Active Cases</div>
          <div className="text-xl font-bold text-purple-700 mt-1">{openCasesCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Officer scrutiny</div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-[#174EA6] uppercase">High Priority</div>
          <div className="text-xl font-bold text-[#174EA6] mt-1">{highPriorityCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Requires intervention</div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-600 uppercase">Stale Scans</div>
          <div className="text-xl font-bold text-slate-700 mt-1">{staleAssessmentsCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Reassessment pending</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search institution name, code, ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-[#174EA6]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={adequacyFilter}
            onChange={(e) => setAdequacyFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-md py-1.5 px-2 bg-white"
          >
            <option value="ALL">All Adequacy States</option>
            <option value="ADEQUATE_DECLARED">ADEQUATE_DECLARED</option>
            <option value="SHORTFALL_DECLARED">SHORTFALL_DECLARED</option>
            <option value="EXCESS_DECLARED">EXCESS_DECLARED</option>
            <option value="REQUIREMENT_NOT_CONFIGURED">REQUIREMENT_NOT_CONFIGURED</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-md py-1.5 px-2 bg-white"
          >
            <option value="ALL">All Risk Priorities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
            <option value="INFORMATIONAL">INFORMATIONAL</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-md py-1.5 px-2 bg-white"
          >
            <option value="ALL">All Categories</option>
            <option value="ENGINEERING">ENGINEERING</option>
            <option value="MANAGEMENT">MANAGEMENT</option>
            <option value="PHARMACY">PHARMACY</option>
            <option value="POLYTECHNIC">POLYTECHNIC</option>
          </select>
        </div>
      </div>

      {/* Compliance Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Institution</th>
                <th className="py-3 px-4">Applicable Rule</th>
                <th className="py-3 px-4">Declared Coverage</th>
                <th className="py-3 px-4">Adequacy Status</th>
                <th className="py-3 px-4">Maturity Status</th>
                <th className="py-3 px-4">Document / Bank</th>
                <th className="py-3 px-4">Review Priority</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-500">
                    Evaluating compliance parameters across institutions...
                  </td>
                </tr>
              ) : filteredInstitutions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-500">
                    No institutions match the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredInstitutions.map((inst) => {
                  const assessment = assessmentsMap[inst.id];
                  const hasAssessment = Boolean(assessment);
                  const isRunning = runningAssessmentId === inst.id;

                  const reqInr = hasAssessment ? (assessment.requiredAmountPaise / 100).toLocaleString('en-IN') : '—';
                  const decInr = hasAssessment ? (assessment.eligibleDeclaredAmountPaise / 100).toLocaleString('en-IN') : '—';
                  const shortfallInr = hasAssessment && assessment.shortfallPaise > 0
                    ? `(Shortfall ₹${(assessment.shortfallPaise / 100).toLocaleString('en-IN')})`
                    : '';

                  const maturityAlerts = assessment?.maturityFindings || [];
                  const docIssues = assessment?.documentFindings?.length || 0;
                  const bankIssues = assessment?.simulatedBankFindings?.filter((b) => b.signalType !== 'SIMULATED_EXACT_MATCH').length || 0;

                  return (
                    <tr key={inst.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#0B1F54]">{inst.name || inst.institutionName}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <span className="font-mono">{inst.code || inst.id}</span>
                          <span>•</span>
                          <span>{inst.category || inst.institutionType || 'TECHNICAL'}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {assessment?.ruleCode ? (
                          <div>
                            <span className="font-mono text-[11px] font-semibold text-slate-800">
                              {assessment.ruleCode}
                            </span>
                            <div className="text-[10px] text-slate-500">v{assessment.ruleVersion}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">No Rule Configured</span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono">
                        <div>
                          <span className="font-semibold text-slate-900">₹{decInr}</span>
                          <span className="text-[10px] text-slate-500"> / ₹{reqInr}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1">
                          <span>{hasAssessment ? `${assessment.coveragePercentage}% coverage` : ''}</span>
                          {shortfallInr && <span className="text-red-600 font-semibold">{shortfallInr}</span>}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {assessment?.adequacyStatus === 'ADEQUATE_DECLARED' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            ADEQUATE
                          </span>
                        )}
                        {assessment?.adequacyStatus === 'SHORTFALL_DECLARED' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                            SHORTFALL
                          </span>
                        )}
                        {assessment?.adequacyStatus === 'EXCESS_DECLARED' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                            SURPLUS
                          </span>
                        )}
                        {assessment?.adequacyStatus === 'REQUIREMENT_NOT_CONFIGURED' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                            UNCONFIGURED
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {maturityAlerts.length > 0 ? (
                          <div className="flex flex-col gap-0.5">
                            {maturityAlerts.slice(0, 1).map((m, idx) => (
                              <span
                                key={idx}
                                className={`text-[10px] font-semibold ${
                                  m.daysRemaining < 0
                                    ? 'text-red-700 font-bold'
                                    : m.daysRemaining <= 30
                                    ? 'text-amber-700'
                                    : 'text-slate-600'
                                }`}
                              >
                                {m.daysRemaining < 0
                                  ? `Matured ${Math.abs(m.daysRemaining)}d ago`
                                  : `Matures in ${m.daysRemaining}d`}
                              </span>
                            ))}
                            {maturityAlerts.length > 1 && (
                              <span className="text-[9px] text-slate-400">+{maturityAlerts.length - 1} more alert</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-emerald-700 font-medium">All Healthy</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-[10px]">
                          <span
                            className={`px-1.5 py-0.5 rounded font-mono ${
                              docIssues > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            DOC: {docIssues}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded font-mono ${
                              bankIssues > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                            }`}
                            title="Simulated Bank Findings"
                          >
                            SIM: {bankIssues}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {assessment?.overallPriority === 'CRITICAL' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-red-600 text-white">
                            CRITICAL
                          </span>
                        )}
                        {assessment?.overallPriority === 'HIGH' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white">
                            HIGH
                          </span>
                        )}
                        {assessment?.overallPriority === 'MEDIUM' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                            MEDIUM
                          </span>
                        )}
                        {assessment?.overallPriority === 'LOW' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800">
                            LOW
                          </span>
                        )}
                        {assessment?.overallPriority === 'INFORMATIONAL' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                            INFO
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleRunAssessment(inst)}
                            disabled={isRunning}
                            title="Run compliance assessment"
                            className="p-1 text-slate-600 hover:text-[#174EA6] hover:bg-slate-100 rounded"
                          >
                            <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
                          </button>
                          <Link
                            to={`/officer/compliance/${inst.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-white bg-[#174EA6] hover:bg-[#0B1F54] rounded transition-colors"
                          >
                            <Eye className="w-3 h-3" />
                            Dossier
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
