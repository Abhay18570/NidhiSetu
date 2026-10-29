/**
 * NidhiSetu Officer Workspace — Document Intelligence Detailed Dossier
 * Deep scrutiny view showing side-by-side OCR comparison, evidence snippets,
 * duplicate collision graphs, and the human adjudication workflow (confirm, dismiss, resolve, note).
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  ArrowLeft,
  FileSearch,
  Eye,
  CheckCircle2,
  XCircle,
  Sparkles,
  MessageSquare,
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import DocumentPreviewModal from '../../components/common/DocumentPreviewModal';
import { useAuth } from '../../context/useAuth';
import {
  documentAnalysisRepository,
  intelligenceReviewRepository,
  fdrRepository,
} from '../../storage';
import {
  FINDING_SEVERITY,
  REVIEW_STATUS,
  COMPARISON_RESULT,
} from '../../intelligence';

export default function OfficerIntelligenceDetailPage() {
  const { fdrId } = useParams();
  const { currentUser } = useAuth();

  const [fdr, setFdr] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [reviews, setReviews] = useState({});
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);

  // Review modal state
  const [activeModal, setActiveModal] = useState(null); // { type: 'DISMISS'|'RESOLVE'|'NOTE', findingId: '...' }
  const [modalInputText, setModalInputText] = useState('');
  const [actionError, setActionError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    if (!fdrId) return;
    setLoading(true);
    try {
      const record = await fdrRepository.getFDRById(fdrId);
      if (!record) {
        setErrorMsg('FDR record could not be found.');
        return;
      }
      setFdr(record);

      const latestAnalysis = await documentAnalysisRepository.getLatestAnalysisByFdrId(fdrId);
      setAnalysis(latestAnalysis);

      // Load reviews for findings
      if (latestAnalysis?.findings) {
        const revMap = {};
        for (const f of latestAnalysis.findings) {
          const rev = await intelligenceReviewRepository.getOrCreateReview(
            f.findingId,
            latestAnalysis.analysisId,
            fdrId
          );
          revMap[f.findingId] = rev;
        }
        setReviews(revMap);
      }
    } catch (err) {
      setErrorMsg('Failed to load dossier: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [fdrId]);

  // Review actions
  const handleStartReview = async (findingId) => {
    try {
      const updated = await intelligenceReviewRepository.startReview(
        findingId,
        analysis?.analysisId,
        fdrId,
        { id: currentUser?.id, name: currentUser?.name }
      );
      setReviews((prev) => ({ ...prev, [findingId]: updated }));
    } catch (err) {
      alert('Error updating status: ' + err.message);
    }
  };

  const handleConfirmDiscrepancy = async (findingId) => {
    try {
      const updated = await intelligenceReviewRepository.confirmDiscrepancy(
        findingId,
        'Officer confirmed discrepancy against document evidence.',
        { id: currentUser?.id, name: currentUser?.name }
      );
      setReviews((prev) => ({ ...prev, [findingId]: updated }));
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleReopen = async (findingId) => {
    try {
      const updated = await intelligenceReviewRepository.reopenFinding(
        findingId,
        'Reopened by officer for re-investigation.',
        { id: currentUser?.id, name: currentUser?.name }
      );
      setReviews((prev) => ({ ...prev, [findingId]: updated }));
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  // Submit Modal Action (Dismiss, Resolve, Note)
  const handleModalSubmit = async (e) => {
    e.preventDefault();
    setActionError('');
    if (!activeModal) return;

    if (!modalInputText.trim() || modalInputText.trim().length < 5) {
      setActionError('A detailed reason (at least 5 characters) is mandatory.');
      return;
    }

    setSubmitting(true);
    try {
      const actor = { id: currentUser?.id, name: currentUser?.name };
      let updated;

      if (activeModal.type === 'DISMISS') {
        updated = await intelligenceReviewRepository.dismissFinding(activeModal.findingId, modalInputText, actor);
      } else if (activeModal.type === 'RESOLVE') {
        updated = await intelligenceReviewRepository.resolveFinding(activeModal.findingId, modalInputText, actor);
      } else if (activeModal.type === 'NOTE') {
        updated = await intelligenceReviewRepository.addNote(activeModal.findingId, modalInputText, actor);
      }

      setReviews((prev) => ({ ...prev, [activeModal.findingId]: updated }));
      setActiveModal(null);
      setModalInputText('');
    } catch (err) {
      setActionError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const breadcrumbs = [
    { label: 'Scrutiny Console', to: '/officer/dashboard' },
    { label: 'Document Intelligence', to: '/officer/document-intelligence' },
    { label: fdr?.referenceNumber ? `Dossier: ${fdr.referenceNumber}` : 'Dossier' },
  ];

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-500">Loading intelligence dossier...</div>;
  }

  if (errorMsg || !fdr) {
    return (
      <div className="space-y-4 max-w-3xl">
        <Breadcrumbs items={breadcrumbs} />
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
          {errorMsg || 'FDR record could not be found.'}
        </div>
        <Button to="/officer/document-intelligence" variant="outline" size="sm" icon={ArrowLeft}>
          Back to Document Intelligence
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      <Breadcrumbs items={breadcrumbs} />

      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-[#D3DDEB] p-6 gov-shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono font-bold text-xs text-[#174EA6]">
              {fdr.referenceNumber}
            </span>
            <span className="text-slate-300">&bull;</span>
            <span className="text-xs font-semibold text-slate-700">
              {fdr.institutionName}
            </span>
            {analysis?.isSyntheticDemo && (
              <span className="px-2 py-0.5 rounded text-[0.625rem] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                SYNTHETIC DEMO FIXTURE
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-[#0B1F54]">
            Investigation Dossier & OCR Audit Report
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Issuing Bank: <strong>{fdr.bankName}</strong> &bull; Certificate No: <strong>{fdr.fdrNumber}</strong> &bull; Amount: <strong>₹ {(Number(fdr.depositAmountPaise || 0) / 100).toLocaleString('en-IN')}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {fdr.documentId && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={Eye}
              onClick={() => setPreviewOpen(true)}
            >
              Preview Document
            </Button>
          )}
          <Button
            to="/officer/document-intelligence"
            variant="outline"
            size="sm"
            icon={ArrowLeft}
          >
            Back to Registry
          </Button>
        </div>
      </div>

      {/* Transparent Scorecard & Readability */}
      {analysis && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 border-l-4 border-l-[#174EA6]">
            <span className="text-[0.6875rem] font-semibold text-slate-500 uppercase">1. Extraction Completeness</span>
            <div className="mt-1 text-xl font-bold text-slate-800">
              {analysis.scorecard?.completeness?.percentage}%
            </div>
            <div className="text-[0.6875rem] text-slate-500 mt-0.5 font-mono">
              {analysis.scorecard?.completeness?.formula}
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-l-emerald-500">
            <span className="text-[0.6875rem] font-semibold text-slate-500 uppercase">2. Field Consistency</span>
            <div className="mt-1 text-xl font-bold text-slate-800">
              {analysis.scorecard?.consistency?.matchedCount} Matches
            </div>
            <div className="text-[0.6875rem] text-slate-500 mt-0.5">
              {analysis.scorecard?.consistency?.mismatchedCount > 0 ? (
                <span className="text-rose-600 font-bold">{analysis.scorecard?.consistency?.mismatchedCount} Discrepancies</span>
              ) : (
                <span className="text-emerald-600 font-medium">No discrepancies</span>
              )}
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-l-amber-500">
            <span className="text-[0.6875rem] font-semibold text-slate-500 uppercase">3. Duplicate Signals</span>
            <div className="mt-1 text-base font-bold text-slate-800 truncate">
              {analysis.scorecard?.duplicateSignals?.isDuplicate ? 'Duplicate Collision' : 'Unique Fingerprint'}
            </div>
            <div className="text-[0.625rem] text-slate-500 mt-0.5 truncate">
              {analysis.scorecard?.duplicateSignals?.label}
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-l-slate-400">
            <span className="text-[0.6875rem] font-semibold text-slate-500 uppercase">4. OCR Readability</span>
            <div className="mt-1 text-base font-bold text-slate-800">
              {analysis.scorecard?.readability?.label}
            </div>
            <div className="text-[0.6875rem] text-slate-500 mt-0.5 font-mono">
              {analysis.scorecard?.readability?.wordCount || 0} recognized words
            </div>
          </Card>
        </div>
      )}

      {/* Side-by-Side Comparison Table */}
      {analysis && (
        <Card className="overflow-hidden border border-[#D3DDEB]">
          <div className="p-4 bg-slate-50/70 border-b border-[#D3DDEB] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSearch className="w-4 h-4 text-[#174EA6]" />
              <h3 className="font-semibold text-xs text-slate-800">
                Side-by-Side Verification: Institution Submission vs. Machine OCR Extraction
              </h3>
            </div>
            <span className="text-[0.6875rem] text-slate-500 font-mono">
              Document SHA-256: {(analysis.documentSha256 || '').slice(0, 16)}...
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold text-left">
                <tr>
                  <th className="py-2.5 px-4">Field Attribute</th>
                  <th className="py-2.5 px-4 bg-blue-50/40">Portal Submitted Value</th>
                  <th className="py-2.5 px-4 bg-indigo-50/40">OCR Extracted Value</th>
                  <th className="py-2.5 px-4">Verification Outcome</th>
                  <th className="py-2.5 px-4">Evidence & Source Text</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {Object.entries(analysis.comparisonResults || {}).map(([key, comp]) => {
                  const isMatch = comp.result === COMPARISON_RESULT.MATCH;
                  const isMismatch = comp.result === COMPARISON_RESULT.MISMATCH;
                  const isMissing = comp.result === COMPARISON_RESULT.MISSING_IN_DOCUMENT;
                  const isAmbiguous = comp.result === COMPARISON_RESULT.AMBIGUOUS;

                  return (
                    <tr key={key} className={isMismatch ? 'bg-rose-50/30' : 'hover:bg-slate-50/50'}>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {comp.label}
                        {comp.critical && <span className="text-rose-500 ml-1 font-bold">*</span>}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-700 bg-blue-50/20">
                        {comp.submittedRaw || '—'}
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-slate-900 bg-indigo-50/20">
                        {comp.extractedRaw || <span className="text-slate-400 font-normal italic">Not detected</span>}
                      </td>

                      <td className="py-3 px-4">
                        {isMatch && (
                          <span className="inline-flex items-center gap-1 text-[0.6875rem] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Exact Match
                          </span>
                        )}
                        {isMismatch && (
                          <span className="inline-flex items-center gap-1 text-[0.6875rem] font-semibold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded border border-rose-200">
                            <XCircle className="w-3 h-3" /> Discrepancy
                          </span>
                        )}
                        {isMissing && (
                          <span className="inline-flex items-center gap-1 text-[0.6875rem] font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                            Missing in Scan
                          </span>
                        )}
                        {isAmbiguous && (
                          <span className="inline-flex items-center gap-1 text-[0.6875rem] font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
                            Ambiguous Text
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-600 text-[0.6875rem]">
                        <div>Confidence: <span className="font-semibold text-slate-700">{comp.confidenceIndicator}</span></div>
                        {comp.sourceSnippet && (
                          <div className="font-mono text-[0.625rem] text-slate-500 bg-slate-50 p-1 rounded border border-slate-200 mt-1 max-w-sm truncate">
                            &ldquo;{comp.sourceSnippet}&rdquo;
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Explainable Findings & Officer Human Review Adjudication */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#0B1F54] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#174EA6]" />
            <span>Documentary Findings & Officer Adjudication Workflow ({analysis?.findings?.length || 0})</span>
          </h3>
          <span className="text-[0.6875rem] text-slate-500">
            Adjudicate discrepancies with mandatory explanatory audit notes
          </span>
        </div>

        {(!analysis?.findings || analysis.findings.length === 0) ? (
          <Card className="p-8 text-center text-xs text-slate-500">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <h4 className="font-semibold text-slate-700">No Discrepancy Findings Registered</h4>
            <p className="mt-1">All extracted document fields match submitted portal records within allowable tolerances.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {analysis.findings.map((f) => {
              const review = reviews[f.findingId] || { status: REVIEW_STATUS.OPEN, notes: [], history: [] };

              return (
                <Card key={f.findingId} className="p-5 space-y-4 border border-[#D3DDEB]">
                  {/* Finding Card Top */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[0.625rem] font-bold uppercase tracking-wider ${
                            f.severity === FINDING_SEVERITY.HIGH
                              ? 'bg-rose-100 text-rose-700 border border-rose-300'
                              : f.severity === FINDING_SEVERITY.MEDIUM
                              ? 'bg-amber-100 text-amber-700 border border-amber-300'
                              : 'bg-slate-100 text-slate-700 border border-slate-300'
                          }`}
                        >
                          {f.severity} Priority
                        </span>
                        <h4 className="font-bold text-slate-800 text-xs">{f.findingType}</h4>
                      </div>
                      <p className="text-xs text-slate-700 font-medium">{f.explanation}</p>
                      <p className="text-[0.6875rem] text-slate-500">
                        <strong>Recommended Action:</strong> {f.recommendedAction}
                      </p>
                      {f.evidenceSnippet && (
                        <div className="font-mono text-[0.6875rem] text-slate-600 bg-slate-50 p-2 rounded border border-slate-200 mt-1">
                          Evidence: &ldquo;{f.evidenceSnippet}&rdquo;
                        </div>
                      )}
                    </div>

                    {/* Current Review Status Badge */}
                    <div className="text-right shrink-0">
                      <span className="text-[0.625rem] uppercase font-bold text-slate-400 block mb-1">Scrutiny State</span>
                      {review.status === REVIEW_STATUS.OPEN && (
                        <span className="px-2.5 py-1 rounded text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          OPEN
                        </span>
                      )}
                      {review.status === REVIEW_STATUS.UNDER_REVIEW && (
                        <span className="px-2.5 py-1 rounded text-xs font-bold bg-blue-100 text-[#174EA6] border border-blue-200">
                          UNDER REVIEW
                        </span>
                      )}
                      {review.status === REVIEW_STATUS.CONFIRMED_DISCREPANCY && (
                        <span className="px-2.5 py-1 rounded text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          CONFIRMED DISCREPANCY
                        </span>
                      )}
                      {review.status === REVIEW_STATUS.DISMISSED && (
                        <span className="px-2.5 py-1 rounded text-xs font-bold bg-slate-200 text-slate-600 border border-slate-300">
                          DISMISSED
                        </span>
                      )}
                      {review.status === REVIEW_STATUS.RESOLVED && (
                        <span className="px-2.5 py-1 rounded text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          RESOLVED
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Officer Action Toolbar */}
                  <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 text-xs">
                    {review.status === REVIEW_STATUS.OPEN && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleStartReview(f.findingId)}
                      >
                        Start Scrutiny
                      </Button>
                    )}

                    {review.status !== REVIEW_STATUS.CONFIRMED_DISCREPANCY && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleConfirmDiscrepancy(f.findingId)}
                        className="text-rose-700 border-rose-200 hover:bg-rose-50"
                      >
                        Confirm Discrepancy
                      </Button>
                    )}

                    {review.status !== REVIEW_STATUS.DISMISSED && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setActiveModal({ type: 'DISMISS', findingId: f.findingId });
                          setModalInputText('');
                          setActionError('');
                        }}
                      >
                        Dismiss Finding
                      </Button>
                    )}

                    {review.status !== REVIEW_STATUS.RESOLVED && (
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setActiveModal({ type: 'RESOLVE', findingId: f.findingId });
                          setModalInputText('');
                          setActionError('');
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        Mark Resolved
                      </Button>
                    )}

                    {(review.status === REVIEW_STATUS.DISMISSED || review.status === REVIEW_STATUS.RESOLVED) && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleReopen(f.findingId)}
                      >
                        Reopen
                      </Button>
                    )}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      icon={MessageSquare}
                      onClick={() => {
                        setActiveModal({ type: 'NOTE', findingId: f.findingId });
                        setModalInputText('');
                        setActionError('');
                      }}
                    >
                      Add Note
                    </Button>
                  </div>

                  {/* Review Notes & Decision Audit Stream */}
                  {(review.notes?.length > 0 || review.history?.length > 0 || review.reason) && (
                    <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-200 text-xs space-y-2">
                      <div className="font-semibold text-slate-700 text-[0.6875rem] uppercase tracking-wider">
                        Scrutiny Audit Stream & Officer Notes
                      </div>

                      {review.reason && (
                        <div className="p-2 bg-white rounded border border-slate-200 text-slate-800">
                          <strong>Active Rationale:</strong> {review.reason}
                        </div>
                      )}

                      {review.notes?.map((n) => (
                        <div key={n.noteId} className="p-2 bg-white rounded border border-slate-200 space-y-0.5">
                          <div className="flex items-center justify-between text-[0.625rem] text-slate-400">
                            <span>{n.actorName} ({n.actorRole})</span>
                            <span>{new Date(n.createdAt).toLocaleString('en-IN')}</span>
                          </div>
                          <p className="text-slate-800 text-[0.6875rem]">{n.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Action Modal (Dismiss, Resolve, Add Note) */}
      {activeModal && (
        <div className="app-modal fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-sm font-bold text-slate-800">
              {activeModal.type === 'DISMISS' && 'Dismiss Finding with Justification'}
              {activeModal.type === 'RESOLVE' && 'Mark Finding as Resolved'}
              {activeModal.type === 'NOTE' && 'Add Scrutiny Case Note'}
            </h3>

            <p className="text-xs text-slate-500">
              {activeModal.type === 'DISMISS' && 'A mandatory explanation is required detailing why this discrepancy is dismissed.'}
              {activeModal.type === 'RESOLVE' && 'Detail the corrective action or bank clarification that resolved this discrepancy.'}
              {activeModal.type === 'NOTE' && 'Enter investigation notes for the officer audit trail.'}
            </p>

            <form onSubmit={handleModalSubmit} className="space-y-3">
              <div>
                <textarea
                  required
                  rows={4}
                  value={modalInputText}
                  onChange={(e) => setModalInputText(e.target.value)}
                  placeholder="Provide comprehensive rationale (at least 5 characters)..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#174EA6]"
                />
              </div>

              {actionError && (
                <div className="p-2 bg-rose-50 text-rose-700 text-xs rounded border border-rose-200">
                  {actionError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setActiveModal(null);
                    setModalInputText('');
                    setActionError('');
                  }}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={submitting}
                >
                  {submitting ? 'Recording...' : 'Submit Action'}
                </Button>
              </div>
            </form>
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
