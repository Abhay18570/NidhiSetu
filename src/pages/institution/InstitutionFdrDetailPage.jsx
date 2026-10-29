import { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import {
  fdrRepository,
  fdrLifecycleRepository,
  fdrDocumentRepository,
  formatINR,
  getMaturityBadgeConfig,
  FDR_STATUS,
  validateDocumentFile,
  documentAnalysisRepository,
  bankVerificationRepository,
} from '../../storage';
import { SIMULATION_DISCLAIMER } from '../../banking/bankMessageSchema';
import DocumentIntelligenceSection from '../../components/intelligence/DocumentIntelligenceSection';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import DocumentPreviewModal from '../../components/common/DocumentPreviewModal';
import {
  FileText,
  Building2,
  Landmark,
  BadgeIndianRupee,
  Clock,
  ShieldCheck,
  AlertCircle,
  Eye,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  UploadCloud,
  Send
} from 'lucide-react';

export default function InstitutionFdrDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { currentUser, currentInstitution } = useAuth();

  const [fdr, setFdr] = useState(null);
  const [events, setEvents] = useState([]);
  const [bankVerification, setBankVerification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);

  // Clarification form state
  const [showClarificationForm, setShowClarificationForm] = useState(
    searchParams.get('action') === 'clarify'
  );
  const [clarificationResponse, setClarificationResponse] = useState('');
  const [newDocument, setNewDocument] = useState(null);
  const [isResubmitting, setIsResubmitting] = useState(false);

  const loadFdrData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const record = await fdrRepository.getFDRById(id);
      if (!record) {
        setErrorMsg('FDR record not found.');
        return;
      }

      // Institution ownership check
      if (currentInstitution && record.institutionId !== currentInstitution.id) {
        setErrorMsg('Access restricted: This FDR record belongs to another educational institution.');
        return;
      }

      setFdr(record);
      const [timeline, bvr] = await Promise.all([
        fdrLifecycleRepository.getEventsForFdr(id),
        bankVerificationRepository.getLatestRequestForFdr(id),
      ]);
      setEvents(timeline);
      setBankVerification(bvr);
    } catch (err) {
      setErrorMsg('Error loading record: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFdrData();
  }, [id, currentInstitution]);

  // Handle Clarification Resubmission
  const handleResubmitClarification = async (e) => {
    e.preventDefault();
    if (!clarificationResponse.trim()) {
      alert('Please provide explanation notes detailing the updates made.');
      return;
    }

    setIsResubmitting(true);
    try {
      const updates = {
        status: FDR_STATUS.RESUBMITTED,
        reviewNotes: clarificationResponse.trim(),
      };

      // Upload replacement file if provided
      if (newDocument) {
        const saved = await fdrDocumentRepository.saveDocument({
          file: newDocument,
          institutionId: currentInstitution.id,
          fdrReference: fdr.fdrNumber,
        });
        updates.documentId = saved.documentId;
        updates.fileName = saved.fileName;
        updates.fileType = saved.fileType;
        updates.fileSize = saved.fileSize;
        updates.sha256Hash = saved.sha256Hash;
        await documentAnalysisRepository.markStale(fdr.id, 'Document was replaced during clarification resubmission');
      }

      await fdrRepository.updateFDR(fdr.id, updates, {
        id: currentUser?.id,
        name: currentUser?.name,
        role: 'institution',
      });

      setShowClarificationForm(false);
      setNewDocument(null);
      setClarificationResponse('');
      await loadFdrData();
    } catch (err) {
      alert('Resubmission failed: ' + err.message);
    } finally {
      setIsResubmitting(false);
    }
  };

  const breadcrumbs = [
    { label: 'Institution Dashboard', to: '/institution/dashboard' },
    { label: 'FDR Repository', to: '/institution/fdr-records' },
    { label: fdr?.referenceNumber || 'FDR Details' },
  ];

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-500">Loading FDR details...</div>;
  }

  if (errorMsg || !fdr) {
    return (
      <div className="space-y-4 max-w-3xl">
        <Breadcrumbs items={breadcrumbs} />
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg || 'FDR record could not be located.'}</span>
        </div>
        <Button to="/institution/fdr-records" variant="outline" size="sm" icon={ArrowLeft}>
          Back to FDR Repository
        </Button>
      </div>
    );
  }

  const maturityBadge = getMaturityBadgeConfig(fdr.maturityDate);
  const isClarificationRequired = fdr.status === FDR_STATUS.CLARIFICATION_REQUIRED;

  return (
    <div className="space-y-6 max-w-5xl pb-16">
      <Breadcrumbs items={breadcrumbs} />

      {/* Header Banner */}
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
            {fdr.status === FDR_STATUS.SUBMITTED && (
              <Badge variant="blue" size="sm">Submitted (Pending Review)</Badge>
            )}
            {fdr.status === FDR_STATUS.UNDER_REVIEW && (
              <Badge variant="blue" size="sm">Under Scrutiny</Badge>
            )}
            {fdr.status === FDR_STATUS.CLARIFICATION_REQUIRED && (
              <Badge variant="saffron" size="sm">Clarification Requested</Badge>
            )}
            {fdr.status === FDR_STATUS.RESUBMITTED && (
              <Badge variant="navy" size="sm">Resubmitted</Badge>
            )}
            {fdr.status === FDR_STATUS.REVIEW_REJECTED && (
              <Badge variant="red" size="sm">Rejected</Badge>
            )}
          </div>
          <h1 className="text-2xl font-black text-[#0B1F54]">
            {fdr.bankName} &bull; {formatINR(fdr.depositAmountPaise, true)}
          </h1>
          <p className="text-xs text-[#505F79] mt-0.5">
            Certificate #{fdr.fdrNumber} &bull; Inception: {fdr.depositDate} &bull; Maturity: {fdr.maturityDate}
          </p>
        </div>

        <div className="flex items-center gap-2">
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

          {fdr.status === FDR_STATUS.REVIEW_ACCEPTED && maturityBadge.days <= 90 && (
            <Button
              to={`/institution/fdr/new?renewalRef=${fdr.referenceNumber}`}
              variant="secondary"
              size="sm"
              icon={RotateCcw}
              className="text-xs font-bold"
            >
              Initiate Renewal
            </Button>
          )}
        </div>
      </div>

      {/* Clarification Alert Banner */}
      {isClarificationRequired && (
        <div className="p-5 bg-amber-50 border border-amber-300 rounded-xl space-y-3 animate-in fade-in">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#C67C11] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-[#0B1F54]">
                Clarification Required by Regulatory Scrutiny Officer
              </h3>
              <p className="text-xs text-[#505F79] leading-relaxed">
                The scrutiny officer has reviewed your deposit docket and flagged the following items requiring institutional response:
              </p>
              <div className="p-3 bg-white border border-amber-200 rounded-lg text-xs font-medium text-[#0B1F54] mt-2">
                &ldquo;{fdr.clarificationReason || 'Please provide updated bank endorsement letter.'}&rdquo;
              </div>
            </div>
          </div>

          {!showClarificationForm ? (
            <div className="pt-1 flex justify-end">
              <Button
                type="button"
                onClick={() => setShowClarificationForm(true)}
                variant="primary"
                size="sm"
                className="bg-[#E89B24] hover:bg-[#c67c11] border-[#E89B24] font-bold text-xs"
              >
                Provide Clarification & Resubmit
              </Button>
            </div>
          ) : (
            /* Clarification Resubmission Form */
            <form onSubmit={handleResubmitClarification} className="p-4 bg-white border border-amber-200 rounded-xl space-y-4 pt-4 mt-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#0B1F54]">
                Institutional Clarification Response
              </h4>
              <div>
                <label className="block text-xs font-semibold text-[#0B1F54] mb-1">
                  Explanation & Compliance Response Notes *
                </label>
                <textarea
                  required
                  rows={3}
                  value={clarificationResponse}
                  onChange={(e) => setClarificationResponse(e.target.value)}
                  placeholder="Detail how the discrepancy was rectified with the branch manager..."
                  className="w-full px-3 py-2 bg-[#F5F7FB] border border-[#D3DDEB] rounded-lg text-xs text-[#0B1F54] focus:outline-none focus:ring-2 focus:ring-[#174EA6]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0B1F54] mb-1">
                  Attach Revised Supporting Document (Optional if replacing scan)
                </label>
                <input
                  type="file"
                  accept=".pdf,image/jpeg,image/png,image/webp"
                  onChange={(e) => setNewDocument(e.target.files?.[0] || null)}
                  className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-[#E8F0FE] file:text-[#174EA6] hover:file:bg-blue-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  onClick={() => setShowClarificationForm(false)}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isResubmitting}
                  icon={Send}
                  className="text-xs font-bold bg-[#13805E] hover:bg-[#0f6a4e] border-[#13805E]"
                >
                  {isResubmitting ? 'Submitting...' : 'Transmit Resubmission'}
                </Button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Grid of Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Bank Particulars */}
        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-sm font-bold text-[#0B1F54]">
            <Landmark className="w-4 h-4 text-[#174EA6]" />
            <span>Issuing Commercial Bank</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Bank Name:</span>
              <span className="font-bold text-[#0B1F54]">{fdr.bankName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Branch Name:</span>
              <span className="font-semibold text-slate-700">{fdr.branchName || 'Main Branch'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">IFSC Code:</span>
              <span className="font-mono font-bold text-[#174EA6]">{fdr.ifsc}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Certificate / Receipt #:</span>
              <span className="font-mono font-bold text-[#0B1F54]">{fdr.fdrNumber}</span>
            </div>
            <div className="border-t border-slate-100 pt-2">
              <span className="text-slate-500 block text-[0.6875rem]">Joint Account Title:</span>
              <span className="font-semibold text-[#0B1F54] mt-0.5 block">{fdr.accountHolderName}</span>
            </div>
          </div>
        </Card>

        {/* Deposit Financials */}
        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-sm font-bold text-[#0B1F54]">
            <BadgeIndianRupee className="w-4 h-4 text-[#13805E]" />
            <span>Deposit Financial Particulars</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Principal Deposit:</span>
              <span className="text-lg font-black text-[#13805E]">
                {formatINR(fdr.depositAmountPaise, true)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Annual Interest:</span>
              <span className="font-semibold text-slate-700">{fdr.interestRate || '7.1'}% p.a.</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Deposit Inception Date:</span>
              <span className="font-medium text-slate-700">{fdr.depositDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Scheduled Maturity:</span>
              <span className="font-bold text-[#0B1F54]">{fdr.maturityDate}</span>
            </div>
            <div className="border-t border-slate-100 pt-2">
              <span className="text-slate-500 block text-[0.6875rem]">Regulatory Requirement:</span>
              <span className="font-semibold text-[#0B1F54] mt-0.5 block">
                {fdr.applicableSecurityRequirement || 'General Security Deposit'}
              </span>
            </div>
          </div>
        </Card>

        {/* Attached Document Scan & Hash */}
        <Card className="p-5 space-y-3 md:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2 text-sm font-bold text-[#0B1F54]">
              <FileText className="w-4 h-4 text-[#174EA6]" />
              <span>Supporting Certificate Scan & Cryptographic Fingerprint</span>
            </div>
            {fdr.documentId && (
              <Button type="button" onClick={() => setPreviewOpen(true)} variant="outline" size="sm" icon={Eye}>
                Preview Document
              </Button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <div className="font-bold text-[#0B1F54]">{fdr.fileName || 'Deposit_Scan.pdf'}</div>
              <div className="text-[0.6875rem] text-slate-500 font-mono mt-0.5">
                Type: {fdr.fileType || 'application/pdf'} &bull; Size: {(fdr.fileSize / (1024 * 1024)).toFixed(2)} MB
              </div>
            </div>

            <div className="p-2.5 bg-[#F5F7FB] border border-[#D3DDEB] rounded-lg font-mono text-[0.6875rem] text-slate-600 truncate max-w-md">
              <span className="font-bold text-[#0B1F54]">SHA-256: </span>
              <span>{fdr.sha256Hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Document Intelligence & OCR Extraction */}
      <DocumentIntelligenceSection fdr={fdr} onAnalysisUpdated={loadFdrData} />

      {/* Module 05: Bank Confirmation Status — Simulation (Institution View) */}
      <Card className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-[#0B1F54] flex items-center gap-2">
              <Landmark className="w-4 h-4 text-[#174EA6]" />
              <span>Bank Confirmation Status — Simulation</span>
            </h3>
            <p className="text-xs text-slate-500">
              Simulated commercial bank deposit confirmation and statutory lien verification status.
            </p>
          </div>
          <span className="text-[0.625rem] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full uppercase tracking-wider">
            {SIMULATION_DISCLAIMER}
          </span>
        </div>

        {bankVerification ? (
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[0.625rem] uppercase font-bold">Inquiry Ref</span>
                <span className="font-mono font-bold text-[#174EA6]">{bankVerification.requestReference}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[0.625rem] uppercase font-bold">Confirmation Status</span>
                <span className="font-bold text-slate-800">{bankVerification.requestStatus}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[0.625rem] uppercase font-bold">Last Simulated Response</span>
                <span className="font-mono text-slate-600">
                  {bankVerification.simulationResponse?.responseTimestamp
                    ? new Date(bankVerification.simulationResponse.responseTimestamp).toLocaleDateString()
                    : 'Awaiting Simulation'}
                </span>
              </div>
            </div>

            {/* General Verification Outcome */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white">
              <div>
                <span className="font-bold text-[#0B1F54] block">General Verification Outcome:</span>
                <span className="text-slate-600 text-[0.6875rem]">
                  {bankVerification.summaryScorecard?.verificationVerdict === 'CONSISTENT_WITH_SIMULATION'
                    ? 'Simulated bank records and lien endorsement are consistent with declared instrument parameters.'
                    : bankVerification.summaryScorecard?.verificationVerdict === 'DISCREPANCIES_DETECTED'
                    ? 'Discrepancies identified during simulated bank ledger comparison.'
                    : 'Bank confirmation inquiry is currently pending or indeterminate.'}
                </span>
              </div>
              <div>
                {bankVerification.summaryScorecard?.verificationVerdict === 'CONSISTENT_WITH_SIMULATION' ? (
                  <span className="px-3 py-1 rounded-full font-bold text-emerald-700 bg-emerald-50 border border-emerald-200">
                    Consistent with Simulation
                  </span>
                ) : bankVerification.summaryScorecard?.verificationVerdict === 'DISCREPANCIES_DETECTED' ? (
                  <span className="px-3 py-1 rounded-full font-bold text-rose-700 bg-rose-50 border border-rose-200">
                    Discrepancy Noted
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full font-bold text-amber-700 bg-amber-50 border border-amber-200">
                    In Progress
                  </span>
                )}
              </div>
            </div>

            {/* Follow-up Required Notice */}
            {bankVerification.reviewStatus === 'REQUIRES_FOLLOW_UP' && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Follow-Up Requested by Scrutiny Authority</span>
                  <p className="mt-0.5 text-[0.6875rem] leading-relaxed">
                    The regulatory scrutiny officer has requested clarification regarding bank confirmation details.
                    Please check for official communication or submit revised documents if requested.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
            No simulated bank confirmation inquiry has been initiated for this FDR record yet.
          </div>
        )}
      </Card>

      {/* Lifecycle History Timeline */}
      <Card className="p-6 space-y-4">
        <h3 className="text-sm font-bold text-[#0B1F54] flex items-center gap-2 border-b border-slate-100 pb-3">
          <Clock className="w-4 h-4 text-[#174EA6]" />
          <span>Lifecycle Audit Stream & Scrutiny Milestones</span>
        </h3>

        {events.length === 0 ? (
          <div className="text-xs text-slate-400 py-3 text-center">No lifecycle events recorded yet.</div>
        ) : (
          <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
            {events.map((ev) => (
              <div key={ev.id} className="relative flex items-start gap-4 text-xs">
                <div className="w-7 h-7 rounded-full bg-white border-2 border-[#174EA6] text-[#174EA6] flex items-center justify-center shrink-0 z-10 font-bold text-[0.625rem]">
                  ✓
                </div>
                <div className="bg-[#F5F7FB] border border-[#D3DDEB] rounded-xl p-3 flex-1 space-y-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="font-bold text-[#0B1F54]">
                      Status Transition: <span className="text-[#174EA6]">{ev.newStatus}</span>
                    </span>
                    <span className="text-[0.625rem] text-slate-400 font-mono">
                      {new Date(ev.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-[0.6875rem] text-slate-600">
                    Actioned by: <strong>{ev.actorName || ev.actorRole}</strong> ({ev.actorRole})
                  </div>
                  {(ev.notes || ev.reason) && (
                    <div className="mt-1 text-[0.6875rem] text-slate-700 bg-white p-2 rounded border border-slate-200 leading-relaxed">
                      {ev.reason ? `Reason: ${ev.reason}` : ev.notes}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

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
