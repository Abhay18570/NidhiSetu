import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Building,
  FileCheck2,
  AlertTriangle,
  Clock,
  HelpCircle,
  MessageSquare,
  Send,
  CheckCircle2,
  Info,
  Calendar,
  ExternalLink,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { fdrRepository } from '../../storage/fdrRepository';
import { complianceRuleRepository } from '../../storage/complianceRuleRepository';
import { complianceAssessmentRepository } from '../../storage/complianceAssessmentRepository';
import { complianceCaseRepository } from '../../storage/complianceCaseRepository';
import { buildComplianceAssessment } from '../../compliance/complianceAssessmentBuilder';
import { PROTOTYPE_COMPLIANCE_DISCLAIMER } from '../../compliance/complianceDemoFixtures';

export default function InstitutionCompliancePage() {
  const { currentInstitution, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState(null);
  const [cases, setCases] = useState([]);
  const [responseModalOpen, setResponseModalOpen] = useState(false);
  const [targetCase, setTargetCase] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [notification, setNotification] = useState('');

  const institutionId = currentInstitution?.id || user?.institutionId || 'inst-001';

  useEffect(() => {
    loadInstitutionCompliance();
  }, [institutionId]);

  const loadInstitutionCompliance = async () => {
    try {
      setLoading(true);
      const [allRules, instFdrs, allAss, instCases] = await Promise.all([
        complianceRuleRepository.getAllRules(),
        fdrRepository.getFdrsByInstitutionId(institutionId),
        complianceAssessmentRepository.getAssessmentsByInstitutionId(institutionId),
        complianceCaseRepository.getCasesByInstitutionId(institutionId),
      ]);

      setCases(instCases);

      let currentAss = allAss[0] || null;
      if (!currentAss && currentInstitution) {
        currentAss = await buildComplianceAssessment({
          institution: currentInstitution,
          rules: allRules,
          fdrRecords: instFdrs,
        });
        await complianceAssessmentRepository.saveAssessment(currentAss);
      }
      setAssessment(currentAss);
    } catch (err) {
      console.error('Failed to load institution compliance:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenResponse = (c) => {
    setTargetCase(c);
    setResponseText('');
    setResponseModalOpen(true);
  };

  const handleSubmitResponse = async (e) => {
    e.preventDefault();
    if (!responseText || responseText.trim().length < 5) {
      alert('Response text must be at least 5 characters.');
      return;
    }
    try {
      await complianceCaseRepository.submitInstitutionResponse(targetCase.caseId, {
        responseText,
        institutionUserId: user?.id || 'inst-user',
      });
      setResponseModalOpen(false);
      setNotification('Clarification response submitted to reviewing officer.');
      loadInstitutionCompliance();
      setTimeout(() => setNotification(''), 4000);
    } catch (err) {
      alert(`Submission failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
          <span>Institutional Workspace</span>
          <span>/</span>
          <span className="text-[#174EA6]">Compliance & Adequacy</span>
        </div>
        <h1 className="text-2xl font-bold text-[#0B1F54] flex items-center gap-2">
          <ShieldCheck className="w-7 h-7 text-[#174EA6]" />
          Regulatory Security Deposit Compliance & Adequacy Overview
        </h1>
        <p className="text-sm text-slate-600 mt-0.5">
          View applicable regulatory deposit requirements, evaluate declared coverage adequacy, and respond to officer clarification notices.
        </p>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 flex items-start gap-3 text-amber-900 text-xs">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">PROTOTYPE ADVISORY: </span>
          {PROTOTYPE_COMPLIANCE_DISCLAIMER} This view reflects synthetic prototype rules and your institution's declared FDR records.
        </div>
      </div>

      {/* Success Notification */}
      {notification && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg p-3 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Compliance Overview Card */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div>
            <h2 className="text-base font-bold text-[#0B1F54]">Applicable Regulatory Requirement Status</h2>
            <div className="text-xs text-slate-500 mt-0.5">
              {assessment?.ruleCode ? (
                <span>
                  Configured Rule: <span className="font-mono font-semibold text-slate-800">{assessment.ruleCode}</span> (v{assessment.ruleVersion}) — {assessment.ruleTitle}
                </span>
              ) : (
                <span className="text-amber-800">No applicable deposit requirement has been configured for this institution in the prototype.</span>
              )}
            </div>
          </div>

          <div>
            {assessment?.adequacyStatus === 'ADEQUATE_DECLARED' && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ADEQUATE COVERAGE
              </span>
            )}
            {assessment?.adequacyStatus === 'SHORTFALL_DECLARED' && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                SHORTFALL IDENTIFIED
              </span>
            )}
            {assessment?.adequacyStatus === 'EXCESS_DECLARED' && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                SURPLUS DEPOSIT
              </span>
            )}
            {assessment?.adequacyStatus === 'REQUIREMENT_NOT_CONFIGURED' && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                UNCONFIGURED
              </span>
            )}
          </div>
        </div>

        {/* Financial Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-xs font-semibold text-slate-500 uppercase">Configured Minimum Required</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              ₹{((assessment?.requiredAmountPaise || 0) / 100).toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 font-mono">
              Integer Paise: {assessment?.requiredAmountPaise || 0}
            </div>
          </div>

          <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100">
            <div className="text-xs font-semibold text-[#174EA6] uppercase">Eligible Declared FDR Deposits</div>
            <div className="text-2xl font-bold text-[#174EA6] mt-1">
              ₹{((assessment?.eligibleDeclaredAmountPaise || 0) / 100).toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-blue-700 mt-1">
              Coverage: {assessment?.coveragePercentage}% of requirement
            </div>
          </div>

          <div
            className={`p-4 rounded-lg border ${
              assessment?.shortfallPaise > 0
                ? 'bg-red-50/50 border-red-200'
                : 'bg-emerald-50/50 border-emerald-200'
            }`}
          >
            <div
              className={`text-xs font-semibold uppercase ${
                assessment?.shortfallPaise > 0 ? 'text-red-700' : 'text-emerald-700'
              }`}
            >
              {assessment?.shortfallPaise > 0 ? 'Deposit Shortfall' : 'Deposit Surplus'}
            </div>
            <div
              className={`text-2xl font-bold mt-1 ${
                assessment?.shortfallPaise > 0 ? 'text-red-700' : 'text-emerald-700'
              }`}
            >
              ₹{(((assessment?.shortfallPaise || assessment?.surplusPaise || 0)) / 100).toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {assessment?.shortfallPaise > 0
                ? 'Action required: Replenish deposit with valid FDR'
                : 'Meets minimum regulatory threshold'}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
            <span>Deposit Coverage Progress</span>
            <span className="font-bold">{assessment?.coveragePercentage}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${
                assessment?.coveragePercentage >= 100 ? 'bg-emerald-600' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(100, assessment?.coveragePercentage || 0)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Active Clarification Inquiries & Actions */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
        <h2 className="text-base font-bold text-[#0B1F54] mb-3 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-[#174EA6]" />
          Regulatory Scrutiny Inquiries & Action Requests
        </h2>

        {cases.filter((c) => ['OPEN', 'UNDER_REVIEW', 'AWAITING_INSTITUTION_RESPONSE'].includes(c.status)).length > 0 ? (
          <div className="space-y-3">
            {cases
              .filter((c) => ['OPEN', 'UNDER_REVIEW', 'AWAITING_INSTITUTION_RESPONSE'].includes(c.status))
              .map((c) => {
                const latestClarification = c.clarificationRequests?.[c.clarificationRequests.length - 1];

                return (
                  <div key={c.caseId} className="p-4 rounded-lg border border-slate-200 bg-slate-50 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">{c.caseNumber}</span>
                        <span className="font-semibold text-[#0B1F54]">{c.title}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                        {c.status}
                      </span>
                    </div>

                    <p className="text-slate-600">{c.description}</p>

                    {latestClarification && (
                      <div className="p-3 bg-white rounded border border-amber-200 space-y-2">
                        <div className="text-amber-900 font-semibold flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          Officer Clarification Inquiry:
                        </div>
                        <div className="text-slate-800">{latestClarification.question}</div>
                        {latestClarification.followUpDeadline && (
                          <div className="text-[11px] text-red-600 font-medium">
                            Response Requested By: {latestClarification.followUpDeadline}
                          </div>
                        )}
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => handleOpenResponse(c)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#174EA6] hover:bg-[#0B1F54] rounded shadow-sm"
                          >
                            <Send className="w-3.5 h-3.5" />
                            Submit Formal Clarification
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>No pending clarification requests or compliance inquiries from regulatory scrutiny officers.</span>
          </div>
        )}
      </div>

      {/* Deposit Maturity Schedule Alerts */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
        <h2 className="text-base font-bold text-[#0B1F54] mb-3 flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#174EA6]" />
          FDR Maturity Alerts & Renewal Tracking
        </h2>

        {assessment?.maturityFindings?.length > 0 ? (
          <div className="space-y-2 text-xs">
            {assessment.maturityFindings.map((m, idx) => (
              <div key={idx} className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900">{m.explanation}</div>
                  <div className="text-[11px] text-[#174EA6] mt-0.5">{m.recommendedAction}</div>
                </div>
                <div className="text-right font-mono text-[11px] font-semibold text-slate-700">
                  {m.daysRemaining < 0 ? `${Math.abs(m.daysRemaining)}d Overdue` : `${m.daysRemaining}d Remaining`}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-slate-50 border border-slate-200 text-slate-600 rounded text-xs">
            All submitted FDRs have active tenure with zero immediate maturity alerts.
          </div>
        )}
      </div>

      {/* Modal: Submit Clarification */}
      {responseModalOpen && targetCase && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-[#0B1F54] text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Submit Clarification Response</h3>
              <button onClick={() => setResponseModalOpen(false)} className="text-white/80 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmitResponse} className="p-5 space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded border border-slate-200 text-slate-700">
                <span className="font-semibold">Case: </span> {targetCase.caseNumber} — {targetCase.title}
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Institutional Clarification / Statement * (Mandatory &gt;= 5 chars)
                </label>
                <textarea
                  rows="4"
                  required
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded"
                  placeholder="Provide detailed explanation, deposit renewal date, bank confirmation details, or rectification plan..."
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResponseModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-[#174EA6] hover:bg-[#0B1F54] text-white font-semibold rounded"
                >
                  Submit to Officer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
