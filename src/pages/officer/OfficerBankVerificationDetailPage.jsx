import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import {
  bankVerificationRepository,
  bankMessageRepository,
  bankReviewRepository,
  fdrRepository,
  documentAnalysisRepository,
  formatINR,
  BANK_REVIEW_STATUS,
  BANK_REVIEW_ACTIONS,
} from '../../storage';
import { SIMULATION_DISCLAIMER } from '../../banking/bankMessageSchema';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import {
  Landmark,
  ShieldAlert,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Clock,
  Copy,
  Check,
  FileText,
  Building2,
  ShieldCheck,
  Code2,
  MessageSquare,
  HelpCircle,
  Play,
  X,
  FileCheck2,
} from 'lucide-react';

export default function OfficerBankVerificationDetailPage() {
  const { requestId } = useParams();
  const { currentUser } = useAuth();

  const [request, setRequest] = useState(null);
  const [fdr, setFdr] = useState(null);
  const [ocrAnalysis, setOcrAnalysis] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Active Message Tab
  const [activeMessageId, setActiveMessageId] = useState(null);
  const [copiedMsgId, setCopiedMsgId] = useState(null);

  // Review Action Form State
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [actionReason, setActionReason] = useState('');
  const [actionNotes, setActionNotes] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');

  // Re-run simulation state
  const [isRetrying, setIsRetrying] = useState(false);

  const loadDossier = async () => {
    if (!requestId) return;
    setLoading(true);
    try {
      const req = await bankVerificationRepository.getRequestById(requestId);
      if (!req) {
        setErrorMsg('Bank verification inquiry not found.');
        return;
      }
      setRequest(req);

      // Load related FDR
      if (req.fdrId) {
        const fdrData = await fdrRepository.getFDRById(req.fdrId);
        setFdr(fdrData);

        // Load OCR analysis if available from Module 04
        if (fdrData?.id) {
          const analysis = await documentAnalysisRepository.getAnalysisByFdrId(fdrData.id);
          setOcrAnalysis(analysis);
        }
      }

      // Load Messages & Reviews
      const [msgList, revList] = await Promise.all([
        bankMessageRepository.getMessagesByRequestId(req.requestId),
        bankReviewRepository.getReviewsByRequestId(req.requestId),
      ]);

      setMessages(msgList);
      if (msgList.length > 0 && !activeMessageId) {
        setActiveMessageId(msgList[0].messageId);
      }
      setReviews(revList);
    } catch (err) {
      console.error('Failed to load dossier:', err);
      setErrorMsg('Failed to load verification dossier: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDossier();
  }, [requestId]);

  // Copy JSON helper
  const handleCopyJson = (text, msgId) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(msgId);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  // Open Action Modal
  const openActionDialog = (action) => {
    setPendingAction(action);
    setActionReason('');
    setActionNotes('');
    setActionError('');
    setActionModalOpen(true);
  };

  // Submit Review Action
  const handleSubmitReviewAction = async (e) => {
    e.preventDefault();
    setActionError('');

    if (
      (pendingAction === BANK_REVIEW_ACTIONS.REQUEST_FOLLOW_UP ||
        pendingAction === BANK_REVIEW_ACTIONS.CLOSE_REVIEW) &&
      (!actionReason || actionReason.trim().length < 5)
    ) {
      setActionError('A substantive justification of at least 5 characters is mandatory.');
      return;
    }

    setActionSubmitting(true);
    try {
      // 1. Record officer review entry
      await bankReviewRepository.recordReviewAction({
        requestId: request.requestId,
        fdrId: request.fdrId,
        officerId: currentUser?.id || 'usr-demo-officer-01',
        reviewAction: pendingAction,
        reason: actionReason.trim(),
        notes: actionNotes.trim(),
      });

      // 2. Transition review status
      let nextReviewStatus = request.reviewStatus;
      if (pendingAction === BANK_REVIEW_ACTIONS.START_REVIEW) {
        nextReviewStatus = BANK_REVIEW_STATUS.UNDER_REVIEW;
      } else if (pendingAction === BANK_REVIEW_ACTIONS.MARK_CONSISTENT) {
        nextReviewStatus = BANK_REVIEW_STATUS.REVIEW_COMPLETED;
      } else if (pendingAction === BANK_REVIEW_ACTIONS.REQUEST_FOLLOW_UP) {
        nextReviewStatus = BANK_REVIEW_STATUS.REQUIRES_FOLLOW_UP;
      } else if (pendingAction === BANK_REVIEW_ACTIONS.CLOSE_REVIEW) {
        nextReviewStatus = BANK_REVIEW_STATUS.REVIEW_COMPLETED;
      } else if (pendingAction === BANK_REVIEW_ACTIONS.REOPEN_REVIEW) {
        nextReviewStatus = BANK_REVIEW_STATUS.UNDER_REVIEW;
      }

      if (nextReviewStatus !== request.reviewStatus) {
        await bankVerificationRepository.updateReviewStatus(
          request.requestId,
          nextReviewStatus,
          currentUser?.id || 'usr-demo-officer-01',
          actionReason
        );
      }

      setActionModalOpen(false);
      await loadDossier();
    } catch (err) {
      setActionError(err.message || 'Failed to submit review decision.');
    } finally {
      setActionSubmitting(false);
    }
  };

  // Retry / Re-execute Simulation
  const handleRetrySimulation = async () => {
    if (!window.confirm('Re-run simulation exchange for this verification inquiry?')) return;
    setIsRetrying(true);
    try {
      await bankVerificationRepository.processVerificationRequest(request.requestId, {
        scenarioId: request.scenarioId,
      });
      await loadDossier();
    } catch (err) {
      alert('Simulation retry failed: ' + err.message);
    } finally {
      setIsRetrying(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-slate-500 space-y-2">
        <Clock className="w-8 h-8 text-[#174EA6] animate-spin mx-auto" />
        <div>Loading verification dossier and simulated financial messages...</div>
      </div>
    );
  }

  if (errorMsg || !request) {
    return (
      <div className="p-8 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
        <div className="text-sm font-bold text-slate-800">{errorMsg || 'Record Not Found'}</div>
        <Link to="/officer/bank-verifications">
          <Button variant="outline" size="sm" icon={ArrowLeft}>
            Back to Bank Verifications
          </Button>
        </Link>
      </div>
    );
  }

  const { simulationResponse, summaryScorecard } = request;
  const activeMessage = messages.find((m) => m.messageId === activeMessageId) || messages[0];

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <Breadcrumbs
        items={[
          { label: 'Scrutiny Console', path: '/officer/dashboard' },
          { label: 'Bank Verifications', path: '/officer/bank-verifications' },
          { label: request.requestReference, path: `/officer/bank-verifications/${request.requestId}` },
        ]}
      />

      {/* MANDATORY SIMULATION DISCLAIMER BANNER */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl shadow-xs">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <span className="font-bold uppercase tracking-wider block text-amber-800 text-[0.6875rem]">
              {SIMULATION_DISCLAIMER}
            </span>
            All responses, financial message structures, ledger values, and lien confirmations shown on this page are
            simulated for educational and hackathon compliance demonstration purposes. No real bank connection is
            implied.
          </div>
        </div>
      </div>

      {/* Dossier Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Verification Inquiry Dossier
            </span>
            <span className="text-xs font-mono px-2 py-0.5 bg-slate-100 rounded text-slate-600">
              {request.correlationId}
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#0B1F54] flex items-center gap-2">
            <Landmark className="w-6 h-6 text-[#174EA6]" />
            {request.requestReference}
          </h1>
          <p className="text-xs text-slate-500">
            FDR: <strong>{request.fdrNumber}</strong> ({request.fdrReference}) | Institution:{' '}
            <strong>{request.institutionName}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Request Status Badge */}
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            {request.requestStatus}
          </span>

          {/* Review Status Badge */}
          {request.reviewStatus === 'REVIEW_COMPLETED' ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              REVIEW COMPLETED
            </span>
          ) : request.reviewStatus === 'REQUIRES_FOLLOW_UP' ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
              REQUIRES FOLLOW-UP
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
              {request.reviewStatus}
            </span>
          )}

          {/* Retry Button */}
          <Button
            variant="outline"
            size="sm"
            icon={RotateCcw}
            onClick={handleRetrySimulation}
            disabled={isRetrying}
          >
            {isRetrying ? 'Re-running...' : 'Re-Run Simulation'}
          </Button>
        </div>
      </div>

      {/* Grid: Overview & OCR Intelligence Context */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SECTION A: Verification Inquiry Overview */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-[#0B1F54] border-b border-slate-100 pb-2">
            <Building2 className="w-4 h-4 text-[#174EA6]" />
            <span>A. Simulation Target & Setup</span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Target Bank Simulator:</span>
              <span className="font-bold text-[#0B1F54]">{request.bankName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Bank Code / IFSC:</span>
              <span className="font-mono text-slate-700">{simulationResponse?.branchIfsc || 'SBIN0001110'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Selected Scenario:</span>
              <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                {request.scenarioId}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Initiated At:</span>
              <span className="font-mono text-slate-600">
                {new Date(request.createdAt).toLocaleString()}
              </span>
            </div>
            <div className="border-t border-slate-100 pt-2">
              <span className="text-slate-500 block text-[0.6875rem]">Audit / Statutory Reason:</span>
              <p className="mt-1 text-slate-700 bg-slate-50 p-2 rounded border border-slate-200 leading-relaxed">
                {request.officerReason}
              </p>
            </div>
          </div>
        </Card>

        {/* SECTION B: Submitted FDR Details */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-[#0B1F54] border-b border-slate-100 pb-2">
            <FileText className="w-4 h-4 text-[#13805E]" />
            <span>B. Institution Submission (Module 03)</span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Declared Principal:</span>
              <span className="text-base font-black text-[#13805E]">
                {formatINR(request.declaredAmountPaise, true)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Deposit Date:</span>
              <span className="font-medium text-slate-700">{request.depositDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Maturity Date:</span>
              <span className="font-bold text-[#0B1F54]">{request.maturityDate}</span>
            </div>
            <div className="border-t border-slate-100 pt-2">
              <span className="text-slate-500 block text-[0.6875rem]">Declared Account Holder:</span>
              <span className="font-semibold text-[#0B1F54] mt-0.5 block">{request.accountHolderName}</span>
            </div>
            {fdr && (
              <div className="pt-2">
                <Link
                  to={`/officer/fdr/${fdr.id}`}
                  className="text-xs text-[#174EA6] hover:underline flex items-center gap-1 font-bold"
                >
                  <span>View Full FDR Lifecycle Record</span>
                  <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                </Link>
              </div>
            )}
          </div>
        </Card>

        {/* SECTION C: OCR Intelligence Context */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-[#0B1F54] border-b border-slate-100 pb-2">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>C. OCR Intelligence Context (Module 04)</span>
          </div>

          {ocrAnalysis ? (
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">OCR Extraction Status:</span>
                <span className="font-bold text-purple-700">{ocrAnalysis.status || 'COMPLETED'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Confidence Score:</span>
                <span className="font-semibold text-slate-800">
                  {ocrAnalysis.ocrResults?.overallConfidence || 94}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Document Anomalies:</span>
                <span className="font-semibold text-slate-700">
                  {ocrAnalysis.findings?.length || 0} finding(s)
                </span>
              </div>
              <div className="border-t border-slate-100 pt-2">
                <Link
                  to={`/officer/document-intelligence/${request.fdrId}`}
                  className="text-xs text-purple-700 hover:underline flex items-center gap-1 font-bold"
                >
                  <span>Open Document AI Inspection Dossier</span>
                  <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-slate-500 space-y-2">
              <HelpCircle className="w-6 h-6 text-slate-300 mx-auto" />
              <div>No Module 04 OCR report available for this FDR record.</div>
            </div>
          )}
        </Card>
      </div>

      {/* SECTION E: Side-by-Side Comparison */}
      <Card className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-[#0B1F54] flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#174EA6]" />
              E. Side-by-Side Verification Comparison
            </h3>
            <p className="text-xs text-slate-500">
              Deterministic comparison between institution-submitted values and synthetic commercial bank ledger.
            </p>
          </div>

          {/* Verdict */}
          <div>
            {summaryScorecard?.verificationVerdict === 'CONSISTENT_WITH_SIMULATION' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-4 h-4" />
                Consistent with Simulation
              </span>
            ) : summaryScorecard?.verificationVerdict === 'DISCREPANCIES_DETECTED' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                <AlertTriangle className="w-4 h-4" />
                Discrepancies Detected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                <Clock className="w-4 h-4" />
                Indeterminate
              </span>
            )}
          </div>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] border-b border-slate-200 text-slate-600 font-bold uppercase text-[0.625rem] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Field</th>
                <th className="py-2.5 px-3">Submitted Value (Inst.)</th>
                <th className="py-2.5 px-3">Synthetic Bank Ledger Value</th>
                <th className="py-2.5 px-3">Outcome</th>
                <th className="py-2.5 px-3">Audit Explanation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* FDR Number */}
              <tr>
                <td className="py-2.5 px-3 font-bold text-[#0B1F54]">FDR Instrument #</td>
                <td className="py-2.5 px-3 font-mono">{request.fdrNumber}</td>
                <td className="py-2.5 px-3 font-mono font-bold text-[#174EA6]">
                  {simulationResponse?.bankReportedFdrNumber || '—'}
                </td>
                <td className="py-2.5 px-3">
                  {summaryScorecard?.fieldSummary?.fdrNumber?.outcome === 'MATCH' ? (
                    <Badge variant="success">MATCH</Badge>
                  ) : (
                    <Badge variant="danger">MISMATCH</Badge>
                  )}
                </td>
                <td className="py-2.5 px-3 text-slate-500">
                  {summaryScorecard?.fieldSummary?.fdrNumber?.explanation || '—'}
                </td>
              </tr>

              {/* Amount */}
              <tr>
                <td className="py-2.5 px-3 font-bold text-[#0B1F54]">Principal Amount</td>
                <td className="py-2.5 px-3 font-bold text-[#13805E]">
                  {formatINR(request.declaredAmountPaise, true)}
                </td>
                <td className="py-2.5 px-3 font-bold text-[#13805E]">
                  {simulationResponse?.bankReportedAmountPaise !== null && simulationResponse?.bankReportedAmountPaise !== undefined
                    ? formatINR(simulationResponse.bankReportedAmountPaise, true)
                    : '—'}
                </td>
                <td className="py-2.5 px-3">
                  {summaryScorecard?.fieldSummary?.amount?.outcome === 'MATCH' ? (
                    <Badge variant="success">MATCH</Badge>
                  ) : (
                    <Badge variant="danger">MISMATCH</Badge>
                  )}
                </td>
                <td className="py-2.5 px-3 text-slate-500">
                  {summaryScorecard?.fieldSummary?.amount?.explanation || '—'}
                </td>
              </tr>

              {/* Deposit Date */}
              <tr>
                <td className="py-2.5 px-3 font-bold text-[#0B1F54]">Deposit Date</td>
                <td className="py-2.5 px-3">{request.depositDate}</td>
                <td className="py-2.5 px-3 font-medium text-slate-800">
                  {simulationResponse?.bankReportedDepositDate || '—'}
                </td>
                <td className="py-2.5 px-3">
                  {summaryScorecard?.fieldSummary?.depositDate?.outcome === 'MATCH' ? (
                    <Badge variant="success">MATCH</Badge>
                  ) : (
                    <Badge variant="danger">MISMATCH</Badge>
                  )}
                </td>
                <td className="py-2.5 px-3 text-slate-500">
                  {summaryScorecard?.fieldSummary?.depositDate?.explanation || '—'}
                </td>
              </tr>

              {/* Maturity Date */}
              <tr>
                <td className="py-2.5 px-3 font-bold text-[#0B1F54]">Maturity Date</td>
                <td className="py-2.5 px-3 font-bold">{request.maturityDate}</td>
                <td className="py-2.5 px-3 font-bold text-[#0B1F54]">
                  {simulationResponse?.bankReportedMaturityDate || '—'}
                </td>
                <td className="py-2.5 px-3">
                  {summaryScorecard?.fieldSummary?.maturityDate?.outcome === 'MATCH' ? (
                    <Badge variant="success">MATCH</Badge>
                  ) : (
                    <Badge variant="danger">MISMATCH</Badge>
                  )}
                </td>
                <td className="py-2.5 px-3 text-slate-500">
                  {summaryScorecard?.fieldSummary?.maturityDate?.explanation || '—'}
                </td>
              </tr>

              {/* Account Holder */}
              <tr>
                <td className="py-2.5 px-3 font-bold text-[#0B1F54]">Account Holder Title</td>
                <td className="py-2.5 px-3">{request.accountHolderName}</td>
                <td className="py-2.5 px-3 font-semibold text-slate-800">
                  {simulationResponse?.bankReportedAccountHolder || '—'}
                </td>
                <td className="py-2.5 px-3">
                  {summaryScorecard?.fieldSummary?.accountHolder?.outcome === 'MATCH' ? (
                    <Badge variant="success">MATCH</Badge>
                  ) : (
                    <Badge variant="danger">MISMATCH</Badge>
                  )}
                </td>
                <td className="py-2.5 px-3 text-slate-500">
                  {summaryScorecard?.fieldSummary?.accountHolder?.explanation || '—'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* SECTION F: Lien Confirmation Simulation */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <ShieldAlert className="w-5 h-5 text-amber-600" />
          <h3 className="text-base font-bold text-[#0B1F54]">F. Regulatory Lien & Encumbrance Verification</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <span className="font-bold text-[#0B1F54] block">Lien Status & Beneficiary</span>
            <div className="flex justify-between">
              <span className="text-slate-500">Reported Lien Status:</span>
              <span className="font-bold text-slate-800">
                {simulationResponse?.lienStatus || 'UNKNOWN'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Reported Beneficiary:</span>
              <span className="font-semibold text-slate-800">
                {simulationResponse?.lienBeneficiary || 'None'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Bank Lien Reference:</span>
              <span className="font-mono text-[#174EA6]">
                {simulationResponse?.lienReference || 'N/A'}
              </span>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <span className="font-bold text-[#0B1F54] block">Regulatory Compliance Evaluation</span>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Expected Beneficiary:</span>
              <span className="font-semibold text-[#0B1F54]">
                {summaryScorecard?.lienEvaluation?.expectedBeneficiary || 'AICTE / Regulatory Authority'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Lien Evaluation Result:</span>
              <span>
                {summaryScorecard?.lienEvaluation?.isLienValid ? (
                  <Badge variant="success">LIEN CONFIRMED</Badge>
                ) : (
                  <Badge variant="danger">LIEN DEFECT</Badge>
                )}
              </span>
            </div>
            <p className="text-[0.6875rem] text-slate-600 pt-1 border-t border-slate-200">
              {summaryScorecard?.lienEvaluation?.explanation}
            </p>
          </div>
        </div>
      </Card>

      {/* SECTION G: Structured Mock Financial Message History */}
      <Card className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-[#0B1F54] flex items-center gap-2">
              <Code2 className="w-5 h-5 text-[#174EA6]" />
              G. Structured Financial Message History (Mock SFMS)
            </h3>
            <p className="text-xs text-slate-500">
              Client-side synthetic financial messages exchanged with the simulated banking node.
            </p>
          </div>

          {/* Copy Message Action */}
          {activeMessage && (
            <Button
              variant="outline"
              size="sm"
              icon={copiedMsgId === activeMessage.messageId ? Check : Copy}
              onClick={() => handleCopyJson(JSON.stringify(activeMessage, null, 2), activeMessage.messageId)}
            >
              {copiedMsgId === activeMessage.messageId ? 'Copied JSON!' : 'Copy Message JSON'}
            </Button>
          )}
        </div>

        {/* Message Selector Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
          {messages.map((m) => (
            <button
              key={m.messageId}
              type="button"
              onClick={() => setActiveMessageId(m.messageId)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeMessage?.messageId === m.messageId
                  ? 'bg-[#0B1F54] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {m.messageType === 'MOCK_FDR_VERIFY_REQUEST' ? 'REQ (Inquiry)' : 'RESP (Confirmation)'} —{' '}
              <span className="font-mono text-[0.625rem]">{m.messageId}</span>
            </button>
          ))}
        </div>

        {/* Selected Message Inspector */}
        {activeMessage ? (
          <div className="space-y-4">
            {/* Header info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block text-[0.625rem] uppercase font-bold">Message ID</span>
                <span className="font-mono font-bold text-[#174EA6]">{activeMessage.messageId}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[0.625rem] uppercase font-bold">Schema Version</span>
                <span className="font-mono text-slate-700">{activeMessage.schemaVersion}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[0.625rem] uppercase font-bold">Simulation Mode</span>
                <span className="font-bold text-amber-600">TRUE (Synthetic)</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[0.625rem] uppercase font-bold">Schema Validation</span>
                <span className="font-bold text-emerald-600">
                  {activeMessage.validationStatus || 'VALID'}
                </span>
              </div>
            </div>

            {/* JSON Code Viewer */}
            <div className="relative">
              <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl text-[0.6875rem] font-mono overflow-x-auto max-h-80 leading-relaxed">
                {JSON.stringify(activeMessage, null, 2)}
              </pre>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-slate-500">No mock messages recorded.</div>
        )}
      </Card>

      {/* SECTION H: Officer Review Actions & Disposition */}
      <Card className="p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-[#0B1F54] flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-[#174EA6]" />
              H. Scrutiny Officer Verification Review & Actions
            </h3>
            <p className="text-xs text-slate-500">
              Record official scrutiny outcomes, request institution clarifications, or conclude the simulation inquiry.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {request.reviewStatus === 'PENDING_REVIEW' && (
              <Button
                variant="primary"
                size="sm"
                icon={Play}
                onClick={() => openActionDialog(BANK_REVIEW_ACTIONS.START_REVIEW)}
              >
                Start Review
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              icon={MessageSquare}
              onClick={() => openActionDialog(BANK_REVIEW_ACTIONS.ADD_NOTE)}
            >
              Add Scrutiny Note
            </Button>

            {request.reviewStatus !== 'REVIEW_COMPLETED' && (
              <>
                <Button
                  variant="success"
                  size="sm"
                  icon={CheckCircle2}
                  onClick={() => openActionDialog(BANK_REVIEW_ACTIONS.MARK_CONSISTENT)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Mark Simulation Consistent
                </Button>

                <Button
                  variant="danger"
                  size="sm"
                  icon={AlertTriangle}
                  onClick={() => openActionDialog(BANK_REVIEW_ACTIONS.REQUEST_FOLLOW_UP)}
                  className="bg-rose-600 hover:bg-rose-700 text-white"
                >
                  Request Institution Follow-Up
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  icon={Check}
                  onClick={() => openActionDialog(BANK_REVIEW_ACTIONS.CLOSE_REVIEW)}
                >
                  Close Review
                </Button>
              </>
            )}

            {request.reviewStatus === 'REVIEW_COMPLETED' && (
              <Button
                variant="outline"
                size="sm"
                icon={RotateCcw}
                onClick={() => openActionDialog(BANK_REVIEW_ACTIONS.REOPEN_REVIEW)}
              >
                Reopen Scrutiny
              </Button>
            )}
          </div>
        </div>

        {/* Review Actions History Timeline */}
        <div className="space-y-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Officer Scrutiny Log ({reviews.length})
          </span>

          {reviews.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No scrutiny decisions or officer notes recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {reviews.map((rev) => (
                <div
                  key={rev.reviewId}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="font-bold text-[#0B1F54]">
                      Action:{' '}
                      <span className="text-[#174EA6] font-mono">{rev.reviewAction}</span>
                    </span>
                    <span className="text-[0.625rem] text-slate-400 font-mono">
                      {new Date(rev.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-[0.6875rem] text-slate-600">
                    Recorded by Officer: <strong>{rev.officerId}</strong>
                  </div>
                  {rev.reason && (
                    <div className="bg-white p-2 rounded border border-slate-200 text-slate-700">
                      <strong>Substantive Rationale:</strong> {rev.reason}
                    </div>
                  )}
                  {rev.notes && (
                    <div className="text-slate-600 italic">
                      Notes: {rev.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* SECTION I: Complete Audit Trail */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Clock className="w-5 h-5 text-[#174EA6]" />
          <h3 className="text-base font-bold text-[#0B1F54]">I. Verification Lifecycle Event History</h3>
        </div>

        <div className="space-y-3">
          {request.statusHistory?.map((item, idx) => (
            <div key={idx} className="flex items-start gap-3 text-xs">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-[#174EA6] flex items-center justify-center font-bold text-[0.625rem] shrink-0 mt-0.5">
                {idx + 1}
              </div>
              <div className="flex-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#0B1F54]">{item.status}</span>
                  <span className="text-[0.625rem] font-mono text-slate-400">
                    {new Date(item.timestamp).toLocaleString()}
                  </span>
                </div>
                {item.notes && <p className="text-slate-600 mt-0.5">{item.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* REVIEW ACTION MODAL DIALOG */}
      {actionModalOpen && (
        <div className="app-modal fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#0B1F54]">
                  Confirm Scrutiny Action: {pendingAction}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Record official regulatory disposition and compliance justification.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActionModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReviewAction} className="p-5 space-y-4">
              {actionError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{actionError}</span>
                </div>
              )}

              {/* Justification Rationale (Mandatory for follow up and close) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#0B1F54]">
                  Justification / Regulatory Rationale{' '}
                  {(pendingAction === BANK_REVIEW_ACTIONS.REQUEST_FOLLOW_UP ||
                    pendingAction === BANK_REVIEW_ACTIONS.CLOSE_REVIEW) && (
                    <span className="text-rose-500">* (Min 5 chars)</span>
                  )}
                </label>
                <textarea
                  rows={3}
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Provide substantive explanation for this regulatory review decision..."
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#174EA6]/20 focus:border-[#174EA6]"
                />
              </div>

              {/* Additional Notes */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#0B1F54]">
                  Internal Officer Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Additional observations or institutional reminders..."
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#174EA6]/20 focus:border-[#174EA6]"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActionModalOpen(false)}
                  disabled={actionSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  icon={Check}
                  disabled={actionSubmitting}
                >
                  {actionSubmitting ? 'Recording Action...' : 'Confirm Decision'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
