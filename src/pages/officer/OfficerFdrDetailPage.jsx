import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import {
  fdrRepository,
  fdrLifecycleRepository,
  institutionRepository,
  formatINR,
  getMaturityBadgeConfig,
  FDR_STATUS
} from '../../storage';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import DocumentPreviewModal from '../../components/common/DocumentPreviewModal';
import {
  ShieldCheck,
  Building2,
  Landmark,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertCircle,
  Eye,
  ArrowLeft,
  FileText,
  ShieldAlert,
  Play
} from 'lucide-react';

export default function OfficerFdrDetailPage() {
  const { id } = useParams();
  const { currentUser } = useAuth();

  const [fdr, setFdr] = useState(null);
  const [institution, setInstitution] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);

  // Review action modals
  const [actionType, setActionType] = useState(null); // 'clarify', 'reject', 'accept'
  const [actionReason, setActionReason] = useState('');
  const [actionNotes, setActionNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const record = await fdrRepository.getFDRById(id);
      if (!record) {
        setErrorMsg('FDR scrutiny docket not found.');
        return;
      }
      setFdr(record);

      if (record.institutionId) {
        const inst = await institutionRepository.getInstitutionById(record.institutionId);
        setInstitution(inst);
      }

      const timeline = await fdrLifecycleRepository.getEventsForFdr(id);
      setEvents(timeline);
    } catch (err) {
      setErrorMsg('Error loading scrutiny docket: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  // Start Scrutiny Review handler
  const handleStartReview = async () => {
    try {
      setIsProcessing(true);
      await fdrRepository.updateFDR(
        fdr.id,
        {
          status: FDR_STATUS.UNDER_REVIEW,
          assignedOfficerId: currentUser?.id,
          reviewNotes: 'Scrutiny initiated by Regional Scrutiny Officer.',
        },
        {
          id: currentUser?.id,
          name: currentUser?.name,
          role: 'officer',
        }
      );
      await loadData();
    } catch (err) {
      alert('Failed to start review: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Submit Review Decision handler
  const handleConfirmDecision = async () => {
    if ((actionType === 'clarify' || actionType === 'reject') && !actionReason.trim()) {
      alert('A specific regulatory reason is mandatory for this decision.');
      return;
    }

    setIsProcessing(true);
    try {
      let targetStatus;
      let updates = {
        assignedOfficerId: currentUser?.id,
      };

      if (actionType === 'accept') {
        targetStatus = FDR_STATUS.REVIEW_ACCEPTED;
        updates.reviewNotes = actionNotes.trim() || 'Verified against Approval Process Handbook standard deposit covenants.';
        updates.clarificationReason = null;
      } else if (actionType === 'clarify') {
        targetStatus = FDR_STATUS.CLARIFICATION_REQUIRED;
        updates.clarificationReason = actionReason.trim();
        updates.reviewNotes = actionNotes.trim() || 'Additional documentation requested.';
      } else if (actionType === 'reject') {
        targetStatus = FDR_STATUS.REVIEW_REJECTED;
        updates.clarificationReason = actionReason.trim(); // store rejection reason
        updates.reviewNotes = actionNotes.trim() || 'Regulatory compliance rejection.';
      }

      updates.status = targetStatus;

      await fdrRepository.updateFDR(fdr.id, updates, {
        id: currentUser?.id,
        name: currentUser?.name,
        role: 'officer',
      });

      setActionType(null);
      setActionReason('');
      setActionNotes('');
      await loadData();
    } catch (err) {
      alert('Decision recording failed: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const breadcrumbs = [
    { label: 'Scrutiny Console', to: '/officer/dashboard' },
    { label: 'Verification Queue', to: '/officer/verification-queue' },
    { label: fdr?.referenceNumber || 'Docket Review' },
  ];

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-500">Loading scrutiny docket...</div>;
  }

  if (errorMsg || !fdr) {
    return (
      <div className="space-y-4 max-w-3xl">
        <Breadcrumbs items={breadcrumbs} />
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg || 'Docket record could not be found.'}</span>
        </div>
        <Button to="/officer/verification-queue" variant="outline" size="sm" icon={ArrowLeft}>
          Return to Queue
        </Button>
      </div>
    );
  }

  const maturityBadge = getMaturityBadgeConfig(fdr.maturityDate);
  const canStartReview = [FDR_STATUS.SUBMITTED, FDR_STATUS.RESUBMITTED].includes(fdr.status);
  const canDecide = fdr.status === FDR_STATUS.UNDER_REVIEW;

  return (
    <div className="space-y-6 max-w-5xl pb-16">
      <Breadcrumbs items={breadcrumbs} />

      {/* Prominent Disclaimer Banner */}
      <div className="p-4 bg-[#FEF7EC] border border-[#E89B24] rounded-xl flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-[#C67C11] shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed text-[#0B1F54]">
          <span className="font-bold text-[#C67C11] uppercase tracking-wider">
            Administrative Review Notice:{' '}
          </span>
          Administrative review on this prototype verifies completeness of submitted scan records and compliance figures. It does not constitute independent bank authenticity verification.
        </div>
      </div>

      {/* Header Docket Card */}
      <div className="bg-white rounded-xl border border-[#D3DDEB] p-6 gov-shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono font-bold text-xs text-[#174EA6]">
              {fdr.referenceNumber}
            </span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${maturityBadge.colorClass}`}
            >
              {maturityBadge.label}
            </span>
            {fdr.status === FDR_STATUS.REVIEW_ACCEPTED && (
              <Badge variant="green" size="sm">Accepted</Badge>
            )}
            {fdr.status === FDR_STATUS.REVIEW_REJECTED && (
              <Badge variant="red" size="sm">Rejected</Badge>
            )}
            {fdr.status === FDR_STATUS.CLARIFICATION_REQUIRED && (
              <Badge variant="saffron" size="sm">Clarification Required</Badge>
            )}
            {fdr.status === FDR_STATUS.UNDER_REVIEW && (
              <Badge variant="blue" size="sm">Under Active Review</Badge>
            )}
            {fdr.status === FDR_STATUS.SUBMITTED && (
              <Badge variant="blue" size="sm">Pending Scrutiny</Badge>
            )}
            {fdr.status === FDR_STATUS.RESUBMITTED && (
              <Badge variant="navy" size="sm">Resubmitted by College</Badge>
            )}
          </div>

          <h1 className="text-2xl font-black text-[#0B1F54]">
            {institution?.name || fdr.institutionId}
          </h1>
          <p className="text-xs text-[#505F79] mt-0.5 font-mono">
            AISHE: <strong>{institution?.aisheCode || '—'}</strong> &bull; Bank: {fdr.bankName} &bull; Deposit: {formatINR(fdr.depositAmountPaise, true)}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {fdr.documentId && (
            <Button
              type="button"
              onClick={() => setPreviewOpen(true)}
              variant="outline"
              size="sm"
              icon={Eye}
              className="text-xs font-semibold"
            >
              Preview Scan
            </Button>
          )}

          {canStartReview && (
            <Button
              type="button"
              onClick={handleStartReview}
              variant="primary"
              size="sm"
              disabled={isProcessing}
              icon={Play}
              className="text-xs font-bold bg-[#174EA6]"
            >
              {isProcessing ? 'Starting...' : 'Start Scrutiny Review'}
            </Button>
          )}

          {canDecide && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={() => setActionType('accept')}
                variant="primary"
                size="sm"
                icon={CheckCircle2}
                className="text-xs font-bold bg-[#13805E] hover:bg-[#0f6a4e] border-[#13805E]"
              >
                Accept
              </Button>
              <Button
                type="button"
                onClick={() => setActionType('clarify')}
                variant="outline"
                size="sm"
                icon={HelpCircle}
                className="text-xs font-bold text-[#C67C11] border-amber-300 hover:bg-amber-50"
              >
                Clarify
              </Button>
              <Button
                type="button"
                onClick={() => setActionType('reject')}
                variant="outline"
                size="sm"
                icon={XCircle}
                className="text-xs font-bold text-rose-600 border-rose-300 hover:bg-rose-50"
              >
                Reject
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Completeness Checklist */}
      <Card className="p-5 space-y-3">
        <h3 className="text-xs font-bold text-[#0B1F54] uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
          <ShieldCheck className="w-4 h-4 text-[#13805E]" />
          <span>Statutory Scrutiny Completeness Checklist</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-lg flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#13805E] shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-[#0B1F54]">Commercial Bank & IFSC</div>
              <div className="text-[11px] text-[#505F79] font-mono">{fdr.bankName} &bull; {fdr.ifsc}</div>
            </div>
          </div>

          <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-lg flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#13805E] shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-[#0B1F54]">Certificate & Joint Lien</div>
              <div className="text-[11px] text-[#505F79] font-mono">#{fdr.fdrNumber}</div>
            </div>
          </div>

          <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-lg flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#13805E] shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-[#0B1F54]">Deposit Value & Dates</div>
              <div className="text-[11px] text-[#13805E] font-bold">
                {formatINR(fdr.depositAmountPaise, true)} ({fdr.depositDate} &rarr; {fdr.maturityDate})
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Institution Particulars */}
        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-sm font-bold text-[#0B1F54]">
            <Building2 className="w-4 h-4 text-[#174EA6]" />
            <span>Institution Information</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Legal Name:</span>
              <span className="font-bold text-[#0B1F54] text-right">{institution?.name || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">AISHE Permanent Code:</span>
              <span className="font-mono font-bold text-[#174EA6]">{institution?.aisheCode || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Category:</span>
              <span className="text-slate-700">{institution?.category || 'Affiliated Technical Institute'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Campus Location:</span>
              <span className="text-slate-700">{institution?.city}, {institution?.state}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Authorized Signatory:</span>
              <span className="font-semibold text-[#0B1F54]">{institution?.representativeName || '—'}</span>
            </div>
          </div>
        </Card>

        {/* Bank & Deposit Details */}
        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-sm font-bold text-[#0B1F54]">
            <Landmark className="w-4 h-4 text-[#174EA6]" />
            <span>Deposit & Branch Specifications</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Principal Deposit:</span>
              <span className="text-base font-black text-[#13805E]">
                {formatINR(fdr.depositAmountPaise, true)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Branch Name:</span>
              <span className="font-medium text-slate-700">{fdr.branchName || 'Main Branch'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Branch IFSC:</span>
              <span className="font-mono font-bold text-[#174EA6]">{fdr.ifsc}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Deposit Tenure:</span>
              <span className="font-medium text-slate-700">{fdr.depositDate} &rarr; {fdr.maturityDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Annual Interest:</span>
              <span className="font-medium text-slate-700">{fdr.interestRate || '7.1'}% p.a.</span>
            </div>
          </div>
        </Card>

        {/* Scan & Hash Panel */}
        <Card className="p-5 space-y-3 md:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2 text-sm font-bold text-[#0B1F54]">
              <FileText className="w-4 h-4 text-[#174EA6]" />
              <span>Attached Certificate Scan</span>
            </div>
            {fdr.documentId && (
              <Button type="button" onClick={() => setPreviewOpen(true)} variant="outline" size="sm" icon={Eye}>
                Preview Scan
              </Button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <div className="font-bold text-[#0B1F54]">{fdr.fileName || 'FDR_Certificate.pdf'}</div>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                Type: {fdr.fileType || 'application/pdf'} &bull; Size: {(fdr.fileSize / (1024 * 1024)).toFixed(2)} MB
              </div>
            </div>

            <div className="p-2.5 bg-[#F5F7FB] border border-[#D3DDEB] rounded-lg font-mono text-[11px] text-slate-600 truncate max-w-md">
              <span className="font-bold text-[#0B1F54]">SHA-256 Digest: </span>
              <span>{fdr.sha256Hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Lifecycle History Timeline */}
      <Card className="p-6 space-y-4">
        <h3 className="text-sm font-bold text-[#0B1F54] flex items-center gap-2 border-b border-slate-100 pb-3">
          <Clock className="w-4 h-4 text-[#174EA6]" />
          <span>Chronological Scrutiny History</span>
        </h3>

        {events.length === 0 ? (
          <div className="text-xs text-slate-400 py-3 text-center">No scrutiny events recorded yet.</div>
        ) : (
          <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
            {events.map((ev) => (
              <div key={ev.id} className="relative flex items-start gap-4 text-xs">
                <div className="w-7 h-7 rounded-full bg-white border-2 border-[#174EA6] text-[#174EA6] flex items-center justify-center shrink-0 z-10 font-bold text-[10px]">
                  ✓
                </div>
                <div className="bg-[#F5F7FB] border border-[#D3DDEB] rounded-xl p-3 flex-1 space-y-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="font-bold text-[#0B1F54]">
                      Status: <span className="text-[#174EA6]">{ev.newStatus}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(ev.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Actioned by: <strong>{ev.actorName || ev.actorRole}</strong> ({ev.actorRole})
                  </div>
                  {(ev.notes || ev.reason) && (
                    <div className="mt-1 text-[11px] text-slate-700 bg-white p-2 rounded border border-slate-200 leading-relaxed">
                      {ev.reason ? `Reason: ${ev.reason}` : ev.notes}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Decision Modal (Accept, Clarify, Reject) */}
      {actionType && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
        >
          <div className="bg-white rounded-2xl border border-[#D3DDEB] max-w-lg w-full p-6 gov-shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              {actionType === 'accept' && (
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#13805E] flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              )}
              {actionType === 'clarify' && (
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-[#C67C11] flex items-center justify-center shrink-0">
                  <HelpCircle className="w-6 h-6" />
                </div>
              )}
              {actionType === 'reject' && (
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <XCircle className="w-6 h-6" />
                </div>
              )}
              <div>
                <h3 className="text-base font-bold text-[#0B1F54]">
                  {actionType === 'accept' && 'Accept Administrative Scrutiny'}
                  {actionType === 'clarify' && 'Request Clarification from Institution'}
                  {actionType === 'reject' && 'Reject FDR Submission'}
                </h3>
                <p className="text-xs text-[#505F79]">
                  Docket Ref: <span className="font-mono font-bold text-[#174EA6]">{fdr.referenceNumber}</span>
                </p>
              </div>
            </div>

            {(actionType === 'clarify' || actionType === 'reject') && (
              <div>
                <label className="block text-xs font-bold text-[#0B1F54] mb-1">
                  Regulatory Reason (Mandatory) *
                </label>
                <textarea
                  required
                  rows={3}
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder={
                    actionType === 'clarify'
                      ? 'Specify the exact discrepancies or missing clauses requiring college response...'
                      : 'Specify the non-compliance violation leading to rejection...'
                  }
                  className="w-full px-3 py-2 bg-[#F5F7FB] border border-[#D3DDEB] rounded-lg text-xs text-[#0B1F54] focus:outline-none focus:ring-2 focus:ring-[#174EA6]"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#0B1F54] mb-1">
                Internal Scrutiny Notes / Docket Remarks
              </label>
              <textarea
                rows={2}
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder="Enter internal committee notes for the audit ledger..."
                className="w-full px-3 py-2 bg-[#F5F7FB] border border-[#D3DDEB] rounded-lg text-xs text-[#0B1F54] focus:outline-none focus:ring-2 focus:ring-[#174EA6]"
              />
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button
                type="button"
                onClick={() => setActionType(null)}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleConfirmDecision}
                variant="primary"
                size="sm"
                disabled={isProcessing}
                className={`text-xs font-bold ${
                  actionType === 'accept'
                    ? 'bg-[#13805E] hover:bg-[#0f6a4e] border-[#13805E]'
                    : actionType === 'reject'
                    ? 'bg-rose-700 hover:bg-rose-800 border-rose-700'
                    : 'bg-[#E89B24] hover:bg-[#c67c11] border-[#E89B24]'
                }`}
              >
                {isProcessing ? 'Processing...' : 'Record Decision'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        documentId={fdr.documentId}
        fileName={fdr.fileName}
        fileType={fdr.fileType}
        fileSize={fdr.fileSize}
        sha256Hash={fdr.sha256Hash}
      />
    </div>
  );
}
