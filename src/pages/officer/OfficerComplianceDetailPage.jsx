import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Building2,
  FileCheck2,
  AlertTriangle,
  Clock,
  Landmark,
  ScrollText,
  FileText,
  CheckCircle2,
  RefreshCw,
  Printer,
  Download,
  Plus,
  History,
  Info,
  ExternalLink,
  X,
} from 'lucide-react';
import { institutionRepository } from '../../storage/institutionRepository';
import { fdrRepository } from '../../storage/fdrRepository';
import { complianceRuleRepository } from '../../storage/complianceRuleRepository';
import { complianceAssessmentRepository } from '../../storage/complianceAssessmentRepository';
import { complianceCaseRepository } from '../../storage/complianceCaseRepository';
import { complianceReviewRepository, COMPLIANCE_REVIEW_DECISIONS } from '../../storage/complianceReviewRepository';
import { buildComplianceAssessment } from '../../compliance/complianceAssessmentBuilder';
import {
  exportAssessmentAsJson,
  exportAssessmentAsCsv,
} from '../../compliance/complianceReportBuilder';
import {
  PROTOTYPE_COMPLIANCE_DISCLAIMER,
  SIMULATED_BANK_DISCLAIMER,
} from '../../compliance/complianceDemoFixtures';

export default function OfficerComplianceDetailPage() {
  const { institutionId } = useParams();
  const [loading, setLoading] = useState(true);
  const [institution, setInstitution] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [history, setHistory] = useState([]);
  const [cases, setCases] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [rules, setRules] = useState([]);
  const [notification, setNotification] = useState('');

  // Modals
  const [isCaseModalOpen, setIsCaseModalOpen] = useState(false);
  const [caseFormData, setCaseFormData] = useState({
    title: 'Deposit Adequacy & Documentation Scrutiny',
    description: '',
    priority: 'HIGH',
  });

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewFormData, setReviewFormData] = useState({
    decision: COMPLIANCE_REVIEW_DECISIONS.APPROVED_COMPLIANT,
    justificationReason: '',
    notes: '',
  });

  const [isClarificationModalOpen, setIsClarificationModalOpen] = useState(false);
  const [targetCaseId, setTargetCaseId] = useState(null);
  const [clarificationData, setClarificationData] = useState({
    question: '',
    deadline: '',
  });

  const [dismissSignalModalOpen, setDismissSignalModalOpen] = useState(false);
  const [targetSignal, setTargetSignal] = useState(null);
  const [dismissalRationale, setDismissalRationale] = useState('');

  useEffect(() => {
    loadDossier();
  }, [institutionId]);

  const loadDossier = async () => {
    try {
      setLoading(true);
      const [inst, allRules, allFdrs, allAss, instCases] = await Promise.all([
        institutionRepository.getInstitutionById(institutionId),
        complianceRuleRepository.getAllRules(),
        fdrRepository.getFdrsByInstitutionId(institutionId),
        complianceAssessmentRepository.getAssessmentsByInstitutionId(institutionId),
        complianceCaseRepository.getCasesByInstitutionId(institutionId),
      ]);

      setInstitution(inst);
      setRules(allRules);
      setHistory(allAss);
      setCases(instCases);

      let currentAssessment = allAss[0] || null;

      // If no assessment exists yet, auto-evaluate
      if (!currentAssessment && inst) {
        currentAssessment = await buildComplianceAssessment({
          institution: inst,
          rules: allRules,
          fdrRecords: allFdrs,
        });
        await complianceAssessmentRepository.saveAssessment(currentAssessment);
        setHistory([currentAssessment]);
      }

      setAssessment(currentAssessment);

      if (currentAssessment) {
        const revs = await complianceReviewRepository.getReviewsByAssessmentId(currentAssessment.assessmentId);
        setReviews(revs);
      }
    } catch (err) {
      console.error('Failed to load compliance dossier:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReassess = async () => {
    try {
      setLoading(true);
      const allFdrs = await fdrRepository.getFdrsByInstitutionId(institutionId);
      const fresh = await buildComplianceAssessment({
        institution,
        rules,
        fdrRecords: allFdrs,
        previousAssessment: assessment,
      });
      await complianceAssessmentRepository.saveAssessment(fresh);
      setAssessment(fresh);
      setHistory((prev) => [fresh, ...prev]);
      setNotification('Compliance assessment refreshed with newest deposit evidence.');
      setTimeout(() => setNotification(''), 4000);
    } catch (err) {
      alert(`Reassessment failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCase = async (e) => {
    e.preventDefault();
    try {
      await complianceCaseRepository.createCase({
        institutionId,
        institutionName: institution?.name,
        assessmentId: assessment?.assessmentId,
        priority: caseFormData.priority,
        title: caseFormData.title,
        description: caseFormData.description,
      });
      setIsCaseModalOpen(false);
      setNotification('Compliance case opened successfully.');
      loadDossier();
      setTimeout(() => setNotification(''), 4000);
    } catch (err) {
      alert(`Case creation failed: ${err.message}`);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewFormData.justificationReason || reviewFormData.justificationReason.trim().length < 5) {
      alert('A substantive justification reason (at least 5 characters) is mandatory.');
      return;
    }
    try {
      await complianceReviewRepository.recordAssessmentReview({
        assessmentId: assessment.assessmentId,
        decision: reviewFormData.decision,
        justificationReason: reviewFormData.justificationReason,
        notes: reviewFormData.notes,
      });
      setIsReviewModalOpen(false);
      setNotification('Officer review determination recorded successfully.');
      loadDossier();
      setTimeout(() => setNotification(''), 4000);
    } catch (err) {
      alert(`Review recording failed: ${err.message}`);
    }
  };

  const handleOpenClarification = (caseId) => {
    setTargetCaseId(caseId);
    setClarificationData({ question: '', deadline: '' });
    setIsClarificationModalOpen(true);
  };

  const handleSubmitClarification = async (e) => {
    e.preventDefault();
    if (!clarificationData.question || clarificationData.question.trim().length < 5) {
      alert('Clarification question must be at least 5 characters.');
      return;
    }
    try {
      await complianceCaseRepository.requestClarification(targetCaseId, {
        clarificationQuestion: clarificationData.question,
        followUpDeadline: clarificationData.deadline,
      });
      setIsClarificationModalOpen(false);
      setNotification('Clarification request issued to institution.');
      loadDossier();
      setTimeout(() => setNotification(''), 4000);
    } catch (err) {
      alert(`Failed to request clarification: ${err.message}`);
    }
  };

  const handleOpenDismissSignal = (signal) => {
    setTargetSignal(signal);
    setDismissalRationale('');
    setDismissSignalModalOpen(true);
  };

  const handleConfirmDismissSignal = async () => {
    if (!dismissalRationale || dismissalRationale.trim().length < 5) {
      alert('Substantive dismissal rationale (at least 5 characters) is required.');
      return;
    }
    try {
      await complianceReviewRepository.dismissRiskSignal({
        assessmentId: assessment.assessmentId,
        signalId: targetSignal.signalId,
        dismissalRationale,
      });
      setDismissSignalModalOpen(false);
      setNotification(`Risk signal ${targetSignal.signalId} dismissed.`);
      loadDossier();
      setTimeout(() => setNotification(''), 4000);
    } catch (err) {
      alert(`Failed to dismiss signal: ${err.message}`);
    }
  };

  if (loading && !assessment) {
    return (
      <div className="p-12 text-center text-slate-500 text-xs">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#174EA6] mb-2" />
        Synthesizing compliance dossier...
      </div>
    );
  }

  const dismissedSignalIds = new Set(
    reviews.filter((r) => r.dismissalId).map((r) => r.signalId)
  );

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <Link to="/officer/compliance" className="hover:text-[#174EA6]">
              Compliance Console
            </Link>
            <span>/</span>
            <span className="text-[#174EA6]">Institution Dossier</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0B1F54] flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-[#174EA6]" />
            Regulatory Compliance Dossier: {institution?.name || institutionId}
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Full compliance audit trail, deposit adequacy verification, and evidence adjudication.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleReassess}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Re-evaluate Snapshot
          </button>
          <button
            type="button"
            onClick={() => exportAssessmentAsCsv(assessment)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => exportAssessmentAsJson(assessment)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            Export JSON
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#174EA6] rounded hover:bg-[#0B1F54] shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Dossier
          </button>
        </div>
      </div>

      {/* Disclaimers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-900 text-xs flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">PROTOTYPE ASSESSMENT: </span>
            {PROTOTYPE_COMPLIANCE_DISCLAIMER}
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-blue-900 text-xs flex items-start gap-2">
          <Landmark className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">BANK SIMULATION NOTICE: </span>
            {SIMULATED_BANK_DISCLAIMER}
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {notification && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg p-3 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Section A: Institution Profile & Assessment Metadata */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
          <h2 className="text-sm font-bold text-[#0B1F54] flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#174EA6]" />
            Section A: Institution Profile & Assessment Baseline
          </h2>
          <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">
            Engine v{assessment?.assessmentEngineVersion}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <div className="text-slate-500 text-[11px]">Institution Name</div>
            <div className="font-semibold text-slate-900">{institution?.name}</div>
          </div>
          <div>
            <div className="text-slate-500 text-[11px]">Code / Reference ID</div>
            <div className="font-mono font-medium text-slate-800">{institution?.code || institutionId}</div>
          </div>
          <div>
            <div className="text-slate-500 text-[11px]">Category / Type</div>
            <div className="font-medium text-slate-800">
              {institution?.category || institution?.institutionType || 'TECHNICAL'}
            </div>
          </div>
          <div>
            <div className="text-slate-500 text-[11px]">Assessment Snapshot ID</div>
            <div className="font-mono text-[11px] text-[#174EA6] font-semibold">{assessment?.assessmentId}</div>
          </div>
        </div>
      </div>

      {/* Section B: Applicable Regulatory Rule */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
          <h2 className="text-sm font-bold text-[#0B1F54] flex items-center gap-2">
            <ScrollText className="w-4 h-4 text-[#174EA6]" />
            Section B: Applicable Regulatory Deposit Rule
          </h2>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
            {assessment?.ruleStatus || 'CONFIGURED'}
          </span>
        </div>

        {assessment?.ruleCode ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div>
              <div className="text-slate-500 text-[11px]">Configured Rule Code</div>
              <div className="font-mono font-bold text-[#0B1F54]">{assessment.ruleCode} (v{assessment.ruleVersion})</div>
              <div className="text-[10px] text-slate-600 mt-0.5">{assessment.ruleTitle}</div>
            </div>
            <div>
              <div className="text-slate-500 text-[11px]">Required Minimum Deposit</div>
              <div className="font-mono font-bold text-slate-900 text-sm">
                ₹{((assessment.requiredAmountPaise || 0) / 100).toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-slate-500">Integer Paise: {assessment.requiredAmountPaise}</div>
            </div>
            <div>
              <div className="text-slate-500 text-[11px]">Resolution Status</div>
              <div className="font-semibold text-emerald-800 flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                {assessment.ruleResolutionStatus}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
            No applicable deposit requirement rule has been configured for this institution in the prototype.
          </div>
        )}
      </div>

      {/* Section C: Deposit Adequacy Summary */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
          <h2 className="text-sm font-bold text-[#0B1F54] flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-[#174EA6]" />
            Section C: Security Deposit Adequacy Calculation
          </h2>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
              assessment?.adequacyStatus === 'ADEQUATE_DECLARED'
                ? 'bg-emerald-100 text-emerald-800'
                : assessment?.adequacyStatus === 'SHORTFALL_DECLARED'
                ? 'bg-red-100 text-red-800'
                : 'bg-blue-100 text-blue-800'
            }`}
          >
            {assessment?.adequacyStatus}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-4">
          <div className="bg-slate-50 p-3 rounded border border-slate-200">
            <div className="text-slate-500 text-[11px]">Required Minimum</div>
            <div className="text-base font-bold text-slate-800 mt-1">
              ₹{((assessment?.requiredAmountPaise || 0) / 100).toLocaleString('en-IN')}
            </div>
          </div>
          <div className="bg-slate-50 p-3 rounded border border-slate-200">
            <div className="text-slate-500 text-[11px]">Eligible Declared</div>
            <div className="text-base font-bold text-[#174EA6] mt-1">
              ₹{((assessment?.eligibleDeclaredAmountPaise || 0) / 100).toLocaleString('en-IN')}
            </div>
          </div>
          <div className="bg-slate-50 p-3 rounded border border-slate-200">
            <div className="text-slate-500 text-[11px]">Coverage Percentage</div>
            <div className="text-base font-bold text-slate-800 mt-1">
              {assessment?.coveragePercentage}%
            </div>
          </div>
          <div className="bg-slate-50 p-3 rounded border border-slate-200">
            <div className="text-slate-500 text-[11px]">Shortfall / Surplus</div>
            <div
              className={`text-base font-bold mt-1 ${
                assessment?.shortfallPaise > 0 ? 'text-red-700' : 'text-emerald-700'
              }`}
            >
              {assessment?.shortfallPaise > 0
                ? `-₹${(assessment.shortfallPaise / 100).toLocaleString('en-IN')}`
                : `+₹${((assessment?.surplusPaise || 0) / 100).toLocaleString('en-IN')}`}
            </div>
          </div>
        </div>

        {/* Formula breakdown notice */}
        <div className="p-3 bg-slate-50 rounded border border-slate-200 text-[11px] text-slate-600">
          <span className="font-semibold text-slate-800">Formula Breakdown: </span>
          Shortfall = max(0, Required ₹{((assessment?.requiredAmountPaise || 0) / 100).toLocaleString('en-IN')} − Eligible Declared ₹{((assessment?.eligibleDeclaredAmountPaise || 0) / 100).toLocaleString('en-IN')}) =
          <span className="font-mono font-bold text-red-700"> ₹{((assessment?.shortfallPaise || 0) / 100).toLocaleString('en-IN')}</span>.
          Integer paise precision ensures zero floating-point rounding errors.
        </div>
      </div>

      {/* Section D: Eligible & Excluded FDRs */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
          <h2 className="text-sm font-bold text-[#0B1F54] flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#174EA6]" />
            Section D: Eligible Declared FDRs & Double-Counting Exclusions
          </h2>
          <div className="text-xs text-slate-500">
            {assessment?.eligibleDeposits?.length || 0} Eligible / {assessment?.excludedDeposits?.length || 0} Excluded
          </div>
        </div>

        <div className="space-y-4 text-xs">
          {/* Eligible Table */}
          <div>
            <div className="font-semibold text-slate-800 mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Eligible Security Deposit Certificates ({assessment?.eligibleDeposits?.length || 0})
            </div>
            {assessment?.eligibleDeposits?.length > 0 ? (
              <div className="border border-slate-200 rounded overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-semibold text-[11px]">
                    <tr>
                      <th className="py-2 px-3">FDR Number</th>
                      <th className="py-2 px-3">Issuing Bank</th>
                      <th className="py-2 px-3">Declared Amount</th>
                      <th className="py-2 px-3">Maturity Date</th>
                      <th className="py-2 px-3">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {assessment.eligibleDeposits.map((dep, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono font-semibold text-slate-800">{dep.fdrNumber}</td>
                        <td className="py-2 px-3">{dep.bankName || 'Scheduled Commercial Bank'}</td>
                        <td className="py-2 px-3 font-semibold text-slate-900 font-mono">
                          ₹{((dep.amountPaise || 0) / 100).toLocaleString('en-IN')}
                        </td>
                        <td className="py-2 px-3 font-mono">{dep.maturityDate}</td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-blue-50 text-blue-700 font-medium">
                            {dep.isRenewal ? 'Renewed Deposit' : 'Original Deposit'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 text-slate-500 rounded border border-slate-200">
                No eligible security deposit certificates found for this institution.
              </div>
            )}
          </div>

          {/* Excluded Table */}
          {assessment?.excludedDeposits?.length > 0 && (
            <div>
              <div className="font-semibold text-slate-800 mb-2 flex items-center gap-1.5 text-amber-800">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Excluded Deposit Records — Double-Count Prevention ({assessment.excludedDeposits.length})
              </div>
              <div className="border border-slate-200 rounded overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-amber-50/50 text-amber-900 font-semibold text-[11px]">
                    <tr>
                      <th className="py-2 px-3">FDR Identifier</th>
                      <th className="py-2 px-3">Amount</th>
                      <th className="py-2 px-3">Exclusion Reason</th>
                      <th className="py-2 px-3">Architectural Justification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {assessment.excludedDeposits.map((ex, idx) => (
                      <tr key={idx} className="bg-amber-50/20">
                        <td className="py-2 px-3 font-mono font-medium text-slate-700">{ex.fdrNumber || ex.fdrId}</td>
                        <td className="py-2 px-3 font-mono">₹{((ex.amountPaise || 0) / 100).toLocaleString('en-IN')}</td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                            {ex.reason}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-600">{ex.explanation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section E: Maturity & Renewal Risks */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
          <h2 className="text-sm font-bold text-[#0B1F54] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#174EA6]" />
            Section E: Maturity Schedule & Renewal Risks (Calendar-Safe)
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            {assessment?.maturityFindings?.length || 0} Risk Signals
          </span>
        </div>

        {assessment?.maturityFindings?.length > 0 ? (
          <div className="space-y-2 text-xs">
            {assessment.maturityFindings.map((m, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        m.severity === 'HIGH'
                          ? 'bg-red-100 text-red-800'
                          : m.severity === 'MEDIUM'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {m.severity}
                    </span>
                    <span className="font-mono font-semibold text-slate-800">{m.riskType}</span>
                  </div>
                  <div className="text-slate-700 mt-1">{m.explanation}</div>
                  <div className="text-[11px] text-[#174EA6] mt-0.5 font-medium">
                    Recommended Action: {m.recommendedAction}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono text-[11px] font-semibold text-slate-700">
                    Maturity: {m.maturityDate}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {m.daysRemaining < 0
                      ? `${Math.abs(m.daysRemaining)} days overdue`
                      : `${m.daysRemaining} days remaining`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>No imminent maturity or renewal risks detected for this institution.</span>
          </div>
        )}
      </div>

      {/* Section F: Document Intelligence Findings (Module 04) */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
          <h2 className="text-sm font-bold text-[#0B1F54] flex items-center gap-2">
            <ScrollText className="w-4 h-4 text-[#174EA6]" />
            Section F: Document Intelligence & OCR Anomalies (Module 04)
          </h2>
          <span className="text-xs text-slate-500">
            {assessment?.documentFindings?.length || 0} Findings
          </span>
        </div>

        {assessment?.documentFindings?.length > 0 ? (
          <div className="space-y-2 text-xs">
            {assessment.documentFindings.map((doc, idx) => (
              <div key={idx} className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        doc.isConfirmedDiscrepancy ? 'bg-red-600 text-white' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {doc.isConfirmedDiscrepancy ? 'CONFIRMED DISCREPANCY' : doc.severity}
                    </span>
                    <span className="font-mono font-medium text-slate-800">FDR #{doc.fdrNumber}</span>
                    <span className="text-[10px] text-slate-500">({doc.field || 'General'})</span>
                  </div>
                  <div className="text-slate-700 mt-1">{doc.explanation}</div>
                  {doc.declaredValue && (
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Declared: <span className="font-mono">{doc.declaredValue}</span> | OCR Extracted: <span className="font-mono">{doc.extractedValue}</span>
                    </div>
                  )}
                </div>
                {doc.dossierLink && (
                  <Link
                    to={doc.dossierLink}
                    className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-[#174EA6] hover:underline"
                  >
                    View OCR Dossier
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>All OCR field extractions match declared deposit parameters with zero active discrepancies.</span>
          </div>
        )}
      </div>

      {/* Section G: Simulated Bank Confirmation Evidence (Module 05) */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
          <h2 className="text-sm font-bold text-[#0B1F54] flex items-center gap-2">
            <Landmark className="w-4 h-4 text-[#174EA6]" />
            Section G: Simulated Bank Confirmation Evidence (Module 05)
          </h2>
          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800">
            SIMULATION ONLY
          </span>
        </div>

        {assessment?.simulatedBankFindings?.length > 0 ? (
          <div className="space-y-2 text-xs">
            {assessment.simulatedBankFindings.map((bank, idx) => (
              <div key={idx} className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                      [SIMULATED]
                    </span>
                    <span className="font-mono font-medium text-slate-800">{bank.signalType}</span>
                    <span className="text-[10px] text-slate-500">Priority: {bank.severity}</span>
                  </div>
                  <div className="text-slate-700 mt-1">{bank.explanation}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Recommended Action: {bank.recommendedAction}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-3 bg-slate-50 border border-slate-200 text-slate-600 rounded text-xs">
            No simulated bank verification signals recorded for this institution's deposits.
          </div>
        )}
      </div>

      {/* Section H: Explainable Risk Prioritization */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
          <h2 className="text-sm font-bold text-[#0B1F54] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#174EA6]" />
            Section H: Explainable Compliance Risk Prioritization
          </h2>
          <span
            className={`px-3 py-1 rounded text-xs font-extrabold ${
              assessment?.overallPriority === 'CRITICAL'
                ? 'bg-red-600 text-white'
                : assessment?.overallPriority === 'HIGH'
                ? 'bg-amber-500 text-white'
                : 'bg-blue-100 text-blue-800'
            }`}
          >
            OVERALL PRIORITY: {assessment?.overallPriority}
          </span>
        </div>

        <div className="space-y-2 text-xs">
          {assessment?.riskAnalysis?.indicators?.map((ind, idx) => {
            const isDismissed = dismissedSignalIds.has(ind.signalId);

            return (
              <div
                key={idx}
                className={`p-3 rounded-lg border ${
                  isDismissed
                    ? 'border-slate-200 bg-slate-100 opacity-60'
                    : ind.severity === 'CRITICAL'
                    ? 'border-red-200 bg-red-50/50'
                    : ind.severity === 'HIGH'
                    ? 'border-amber-200 bg-amber-50/50'
                    : 'border-slate-200 bg-slate-50'
                } flex items-start justify-between gap-3`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        ind.severity === 'CRITICAL'
                          ? 'bg-red-600 text-white'
                          : ind.severity === 'HIGH'
                          ? 'bg-amber-600 text-white'
                          : 'bg-slate-200 text-slate-800'
                      }`}
                    >
                      {ind.severity}
                    </span>
                    <span className="font-mono font-semibold text-slate-900">{ind.signalId}</span>
                    <span className="text-[10px] text-slate-500 font-mono">({ind.source})</span>
                    {isDismissed && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                        DISMISSED BY OFFICER
                      </span>
                    )}
                  </div>
                  <div className="text-slate-800 mt-1 font-medium">{ind.explanation}</div>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    Action: {ind.recommendedAction}
                  </div>
                </div>

                {!isDismissed && (
                  <button
                    type="button"
                    onClick={() => handleOpenDismissSignal(ind)}
                    className="shrink-0 px-2.5 py-1 text-[11px] font-medium text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-50 shadow-sm"
                  >
                    Dismiss Indicator
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Section I: Officer Review & Case Adjudication */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
          <h2 className="text-sm font-bold text-[#0B1F54] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#174EA6]" />
            Section I: Officer Scrutiny Determinations & Compliance Cases
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsReviewModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow-sm"
            >
              Record Adjudication
            </button>
            <button
              type="button"
              onClick={() => setIsCaseModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#174EA6] hover:bg-[#0B1F54] rounded shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Open Compliance Case
            </button>
          </div>
        </div>

        {/* Reviews History */}
        {reviews.length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Official Determinations on this Snapshot
            </div>
            <div className="space-y-2 text-xs">
              {reviews.map((rev) => (
                <div key={rev.reviewId || rev.dismissalId} className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900 font-mono">
                      {rev.decision || `DISMISSAL: ${rev.signalId}`}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(rev.createdAt || rev.dismissedAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-slate-800 mt-1 font-medium">
                    {rev.justificationReason || rev.dismissalRationale}
                  </div>
                  {rev.notes && <div className="text-[11px] text-slate-600 mt-1">Notes: {rev.notes}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cases Table */}
        <div>
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Active & Resolved Compliance Cases ({cases.length})
          </div>
          {cases.length > 0 ? (
            <div className="space-y-3">
              {cases.map((c) => (
                <div key={c.caseId} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">{c.caseNumber}</span>
                      <span className="font-semibold text-[#0B1F54]">{c.title}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                        {c.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {['OPEN', 'UNDER_REVIEW'].includes(c.status) && (
                        <button
                          type="button"
                          onClick={() => handleOpenClarification(c.caseId)}
                          className="px-2.5 py-1 text-[11px] font-medium text-white bg-[#174EA6] hover:bg-[#0B1F54] rounded"
                        >
                          Request Clarification
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-slate-600">{c.description}</p>

                  {/* Clarifications / Responses */}
                  {c.clarificationRequests?.length > 0 && (
                    <div className="mt-2 pl-3 border-l-2 border-[#174EA6] space-y-2">
                      {c.clarificationRequests.map((req, qIdx) => (
                        <div key={qIdx} className="bg-white p-2.5 rounded border border-slate-200">
                          <div className="text-slate-700 font-medium">
                            <span className="font-bold text-[#174EA6]">Officer Inquiry: </span>
                            {req.question}
                          </div>
                          {c.institutionResponses && c.institutionResponses[qIdx] && (
                            <div className="mt-1.5 pt-1.5 border-t border-slate-100 text-emerald-800 font-medium">
                              <span className="font-bold">Institution Clarification: </span>
                              {c.institutionResponses[qIdx].responseText}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {c.resolutionReason && (
                    <div className="p-2.5 bg-emerald-50 rounded border border-emerald-200 text-emerald-900">
                      <span className="font-bold">Resolution Rationale: </span>
                      {c.resolutionReason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 bg-slate-50 text-slate-500 rounded border border-slate-200 text-xs">
              No formal compliance cases currently pending for this institution.
            </div>
          )}
        </div>
      </div>

      {/* Section J: Audit Lineage & Assessment History */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
          <h2 className="text-sm font-bold text-[#0B1F54] flex items-center gap-2">
            <History className="w-4 h-4 text-[#174EA6]" />
            Section J: Assessment Fingerprint & Historical Lineage
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            {history.length} Reassessment Snapshots
          </span>
        </div>

        <div className="text-xs space-y-2">
          <div className="bg-slate-50 p-3 rounded border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <div className="font-semibold text-slate-800">Current Input Fingerprint (Canonical FNV-1a)</div>
              <div className="font-mono text-[11px] text-[#174EA6] font-bold mt-0.5">
                {assessment?.inputFingerprint}
              </div>
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              Evaluated: {new Date(assessment?.createdAt || 0).toLocaleString()}
            </div>
          </div>

          <div className="border border-slate-200 rounded overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold text-[11px]">
                <tr>
                  <th className="py-2 px-3">Assessment ID</th>
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Adequacy Status</th>
                  <th className="py-2 px-3">Shortfall (Paise)</th>
                  <th className="py-2 px-3">Priority</th>
                  <th className="py-2 px-3">Snapshot Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((snap) => (
                  <tr key={snap.assessmentId} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-mono font-medium text-slate-800">{snap.assessmentId}</td>
                    <td className="py-2 px-3 font-mono">{snap.assessmentDate}</td>
                    <td className="py-2 px-3 font-semibold">{snap.adequacyStatus}</td>
                    <td className="py-2 px-3 font-mono">₹{((snap.shortfallPaise || 0) / 100).toLocaleString('en-IN')}</td>
                    <td className="py-2 px-3">{snap.overallPriority}</td>
                    <td className="py-2 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          snap.assessmentStatus === 'STALE'
                            ? 'bg-slate-200 text-slate-700'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {snap.assessmentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal: Open Case */}
      {isCaseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-[#0B1F54] text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Open Formal Compliance Review Case</h3>
              <button onClick={() => setIsCaseModalOpen(false)} className="text-white/80 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateCase} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Case Title *</label>
                <input
                  type="text"
                  required
                  value={caseFormData.title}
                  onChange={(e) => setCaseFormData({ ...caseFormData, title: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Priority</label>
                <select
                  value={caseFormData.priority}
                  onChange={(e) => setCaseFormData({ ...caseFormData, priority: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded bg-white"
                >
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Scrutiny Summary & Scope</label>
                <textarea
                  rows="3"
                  value={caseFormData.description}
                  onChange={(e) => setCaseFormData({ ...caseFormData, description: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded"
                  placeholder="Detail the specific shortfall, maturity, or document findings under inquiry..."
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCaseModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-[#174EA6] hover:bg-[#0B1F54] text-white font-semibold rounded"
                >
                  Create Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Record Adjudication */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-[#0B1F54] text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Record Official Compliance Determination</h3>
              <button onClick={() => setIsReviewModalOpen(false)} className="text-white/80 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmitReview} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Official Determination *</label>
                <select
                  value={reviewFormData.decision}
                  onChange={(e) => setReviewFormData({ ...reviewFormData, decision: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded bg-white font-semibold"
                >
                  {Object.values(COMPLIANCE_REVIEW_DECISIONS).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Substantive Justification Reason * (Mandatory &gt;= 5 chars)
                </label>
                <textarea
                  rows="3"
                  required
                  value={reviewFormData.justificationReason}
                  onChange={(e) => setReviewFormData({ ...reviewFormData, justificationReason: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded"
                  placeholder="Record formal statutory / administrative justification for this finding determination..."
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Confidential Notes (Optional)</label>
                <textarea
                  rows="2"
                  value={reviewFormData.notes}
                  onChange={(e) => setReviewFormData({ ...reviewFormData, notes: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded"
                >
                  Save Determination
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Request Clarification */}
      {isClarificationModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-[#0B1F54] text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Request Institution Clarification</h3>
              <button onClick={() => setIsClarificationModalOpen(false)} className="text-white/80 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmitClarification} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Clarification Inquiry * (Mandatory &gt;= 5 chars)
                </label>
                <textarea
                  rows="3"
                  required
                  value={clarificationData.question}
                  onChange={(e) => setClarificationData({ ...clarificationData, question: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded"
                  placeholder="Ask institution to clarify shortfall, submit renewal confirmation, or explain variance..."
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Follow-Up Due Date</label>
                <input
                  type="date"
                  value={clarificationData.deadline}
                  onChange={(e) => setClarificationData({ ...clarificationData, deadline: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsClarificationModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-[#174EA6] hover:bg-[#0B1F54] text-white font-semibold rounded"
                >
                  Send Inquiry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Dismiss Risk Signal */}
      {dismissSignalModalOpen && targetSignal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Dismiss Risk Signal: {targetSignal.signalId}</h3>
              <button onClick={() => setDismissSignalModalOpen(false)} className="text-white/80 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-700">
                {targetSignal.explanation}
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Substantive Dismissal Rationale * (Mandatory &gt;= 5 chars)
                </label>
                <textarea
                  rows="3"
                  value={dismissalRationale}
                  onChange={(e) => setDismissalRationale(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded"
                  placeholder="State why this risk signal does not represent non-compliance..."
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDismissSignalModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDismissSignal}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded"
                >
                  Confirm Dismissal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
