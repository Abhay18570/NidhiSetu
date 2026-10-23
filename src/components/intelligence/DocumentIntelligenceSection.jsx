/**
 * NidhiSetu Document Intelligence — Institution FDR Analysis Section
 * Provides on-demand client-side OCR extraction, side-by-side comparison tables,
 * multi-dimensional scorecard summaries, and explainable finding cards.
 */

import { useState, useEffect, useRef } from 'react';
import {
  FileSearch,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  RotateCcw,
  Sparkles,
  Info,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import {
  documentAnalysisRepository,
  fdrDocumentRepository,
  fdrRepository,
} from '../../storage';
import {
  processDocumentForIntelligence,
  compareFields,
  detectDuplicateFingerprint,
  generateFindings,
  buildAnalysisReport,
  SCORECARD_LABEL,
  FINDING_SEVERITY,
  COMPARISON_RESULT,
  SYNTHETIC_OCR_FIXTURES,
} from '../../intelligence';

export default function DocumentIntelligenceSection({ fdr, onAnalysisUpdated }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressState, setProgressState] = useState({ percent: 0, message: '', phase: '' });
  const [errorMsg, setErrorMsg] = useState('');
  const abortControllerRef = useRef(null);

  // Load existing analysis for this FDR
  const loadAnalysis = async () => {
    if (!fdr?.id) return;
    setLoading(true);
    try {
      const latest = await documentAnalysisRepository.getLatestAnalysisByFdrId(fdr.id);
      setAnalysis(latest);
    } catch (err) {
      console.warn('Error loading document analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalysis();
  }, [fdr?.id, fdr?.sha256Hash]);

  // Run or re-run client-side analysis
  const handleRunAnalysis = async (e) => {
    if (e) e.preventDefault();
    if (!fdr) return;

    setIsProcessing(true);
    setErrorMsg('');
    setProgressState({ percent: 10, message: 'Initializing document processing...', phase: 'init' });

    abortControllerRef.current = new AbortController();
    const startTime = Date.now();

    try {
      let fileBlob = null;

      // 1. Retrieve document blob from IndexedDB if documentId is present
      if (fdr.documentId) {
        const docRecord = await fdrDocumentRepository.getDocument(fdr.documentId);
        if (docRecord?.blob) {
          fileBlob = docRecord.blob;
        }
      }

      // If no file blob in IndexedDB (e.g. synthetic demo record), use deterministic synthetic fixture
      let ocrResult;
      if (!fileBlob) {
        // Fallback to demo fixture matching FDR
        let fixtureText = SYNTHETIC_OCR_FIXTURES.PERFECT_MATCH;
        if (fdr.fdrNumber?.includes('BOB') || fdr.bankName?.toLowerCase().includes('baroda')) {
          fixtureText = SYNTHETIC_OCR_FIXTURES.MATURITY_DATE_MISMATCH;
        } else if (fdr.bankName?.toLowerCase().includes('punjab')) {
          fixtureText = SYNTHETIC_OCR_FIXTURES.MISSING_IFSC;
        }

        ocrResult = await processDocumentForIntelligence(null, {
          syntheticTextFixture: fixtureText,
          signal: abortControllerRef.current.signal,
          onProgress: (p) => setProgressState(p),
        });
      } else {
        ocrResult = await processDocumentForIntelligence(fileBlob, {
          signal: abortControllerRef.current.signal,
          onProgress: (p) => setProgressState(p),
          maxPages: 3,
        });
      }

      setProgressState({ percent: 85, message: 'Validating fields against FDR record...', phase: 'cross_field' });

      // 2. Cross-field comparison
      const comparisonOutput = compareFields(ocrResult.extractedFields, fdr);

      // 3. Exact duplicate detection
      const allFdrs = await fdrRepository.getAllFDRs();
      const duplicateReport = detectDuplicateFingerprint(fdr.sha256Hash, fdr, allFdrs, {
        viewerRole: 'institution',
        institutionId: fdr.institutionId,
      });

      // 4. Anomaly findings generation
      const findings = generateFindings(
        comparisonOutput,
        duplicateReport,
        ocrResult.extractionMetadata,
        fdr
      );

      // 5. Build full analysis report & scorecard
      const report = buildAnalysisReport({
        fdrRecord: fdr,
        extractedFields: ocrResult.extractedFields,
        comparisonOutput,
        duplicateReport,
        findings,
        extractionMetadata: ocrResult.extractionMetadata,
        processingDurationMs: Date.now() - startTime,
      });

      // 6. Persist report to repository
      await documentAnalysisRepository.saveAnalysis(report);
      setAnalysis(report);

      if (onAnalysisUpdated) {
        onAnalysisUpdated(report);
      }
    } catch (err) {
      if (err.name === 'AbortError' || err.message?.includes('cancelled')) {
        setErrorMsg('Document analysis cancelled by user.');
      } else {
        setErrorMsg('Analysis failed: ' + (err.message || 'Unknown processing error.'));
      }
    } finally {
      setIsProcessing(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancelAnalysis = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const isStale = analysis ? documentAnalysisRepository.isAnalysisStale(analysis, fdr) : false;

  return (
    <Card className="overflow-hidden border border-[#D3DDEB]">
      {/* Header */}
      <div className="p-6 bg-slate-50/70 border-b border-[#D3DDEB] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-[#174EA6]/10 text-[#174EA6] mt-0.5">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-800 text-sm">
                Document Intelligence & OCR Analysis
              </h3>
              {analysis && !isStale && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" /> Analysis Available
                </span>
              )}
              {isStale && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  <AlertTriangle className="w-3 h-3" /> Stale (Doc Updated)
                </span>
              )}
              {!analysis && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  Pending Scan
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Client-side optical character recognition, automated field extraction, and discrepancy checks.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isProcessing ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancelAnalysis}
              className="text-rose-600 border-rose-300 hover:bg-rose-50"
            >
              Cancel Scan
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              icon={analysis ? RotateCcw : Sparkles}
              onClick={handleRunAnalysis}
            >
              {analysis ? 'Re-run Intelligence Scan' : 'Run Document Intelligence'}
            </Button>
          )}
        </div>
      </div>

      {/* Processing Progress Bar */}
      {isProcessing && (
        <div className="p-6 bg-blue-50/50 border-b border-blue-100 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-[#174EA6] flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-[#174EA6] animate-ping" />
              {progressState.message || 'Processing document...'}
            </span>
            <span className="font-mono text-slate-600 font-bold">{progressState.percent}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-[#174EA6] h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressState.percent}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500">
            OCR processing is executing locally inside your browser sandbox. No document contents are sent to external cloud APIs.
          </p>
        </div>
      )}

      {/* Error / Abort message */}
      {errorMsg && (
        <div className="m-6 p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Empty State when never analyzed */}
      {!analysis && !isProcessing && !loading && (
        <div className="p-8 text-center space-y-3">
          <FileSearch className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="text-xs font-semibold text-slate-700">No Document Analysis Recorded Yet</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Click <strong>Run Document Intelligence</strong> to extract bank details from your uploaded receipt scan and verify them against your submitted FDR record.
          </p>
        </div>
      )}

      {/* Analysis Results View */}
      {analysis && !isProcessing && (
        <div className="p-6 space-y-6">
          {/* Transparent Scorecard */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Transparent Multi-Dimensional Scorecard
              </h4>
              <span className="text-[11px] text-slate-400">
                Analyzed on {new Date(analysis.analyzedAt).toLocaleString('en-IN')} (Duration: {analysis.processingDurationMs}ms)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Dim 1: Completeness */}
              <div className="p-3.5 rounded-lg border border-slate-200 bg-white">
                <span className="text-[11px] text-slate-500 font-medium">1. Extraction Completeness</span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-lg font-bold text-slate-800">
                    {analysis.scorecard?.completeness?.percentage || 0}%
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    ({analysis.scorecard?.completeness?.extractedCount}/{analysis.scorecard?.completeness?.totalFields} fields)
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 truncate">
                  {analysis.scorecard?.completeness?.formula}
                </p>
              </div>

              {/* Dim 2: Field Consistency */}
              <div className="p-3.5 rounded-lg border border-slate-200 bg-white">
                <span className="text-[11px] text-slate-500 font-medium">2. Field Consistency</span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-lg font-bold text-slate-800">
                    {analysis.scorecard?.consistency?.matchedCount || 0} Matched
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  {analysis.scorecard?.consistency?.mismatchedCount > 0 ? (
                    <span className="text-rose-600 font-semibold">
                      {analysis.scorecard?.consistency?.mismatchedCount} Discrepancy(ies)
                    </span>
                  ) : (
                    <span className="text-emerald-600 font-semibold">Fully Consistent</span>
                  )}
                </p>
              </div>

              {/* Dim 3: Duplicate Signals */}
              <div className="p-3.5 rounded-lg border border-slate-200 bg-white">
                <span className="text-[11px] text-slate-500 font-medium">3. Duplicate Signals</span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-sm font-bold text-slate-800">
                    {analysis.scorecard?.duplicateSignals?.isDuplicate ? 'Collision Signal' : 'Unique Fingerprint'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 truncate">
                  {analysis.scorecard?.duplicateSignals?.label}
                </p>
              </div>

              {/* Dim 4: Readability */}
              <div className="p-3.5 rounded-lg border border-slate-200 bg-white">
                <span className="text-[11px] text-slate-500 font-medium">4. Document Readability</span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-sm font-bold text-slate-800">
                    {analysis.scorecard?.readability?.label || 'Clear'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  {analysis.scorecard?.readability?.wordCount || 0} recognized text words
                </p>
              </div>
            </div>

            {/* Scorecard Label Banner */}
            <div className="mt-3">
              {analysis.scorecard?.overallScorecardLabel === SCORECARD_LABEL.NO_DISCREPANCY && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>No Discrepancy Detected:</strong> Extracted fields align with your entered submission metadata.</span>
                </div>
              )}
              {analysis.scorecard?.overallScorecardLabel === SCORECARD_LABEL.REVIEW_RECOMMENDED && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span><strong>Review Recommended:</strong> One or more fields or duplicate signals warrant verification by the review officer.</span>
                </div>
              )}
              {analysis.scorecard?.overallScorecardLabel === SCORECARD_LABEL.HIGH_PRIORITY_DISCREPANCY && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
                  <span><strong>High-Priority Discrepancy:</strong> Significant mismatch detected (such as principal deposit amount or maturity date).</span>
                </div>
              )}
              {analysis.scorecard?.overallScorecardLabel === SCORECARD_LABEL.INCOMPLETE_EXTRACTION && (
                <div className="p-3 rounded-lg bg-slate-100 border border-slate-300 text-slate-700 text-xs flex items-center gap-2">
                  <Info className="w-4 h-4 text-slate-500 shrink-0" />
                  <span><strong>Incomplete Extraction:</strong> Low scan resolution or incomplete OCR text. Please ensure high clarity when uploading.</span>
                </div>
              )}
            </div>
          </div>

          {/* Explainable Findings */}
          {analysis.findings && analysis.findings.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Explainable Documentary Findings ({analysis.findings.length})
              </h4>
              <div className="space-y-2">
                {analysis.findings.map((f) => (
                  <div
                    key={f.findingId}
                    className={`p-3.5 rounded-lg border text-xs flex flex-col md:flex-row md:items-start justify-between gap-3 ${
                      f.severity === FINDING_SEVERITY.HIGH
                        ? 'bg-rose-50/60 border-rose-200 text-rose-900'
                        : f.severity === FINDING_SEVERITY.MEDIUM
                        ? 'bg-amber-50/60 border-amber-200 text-amber-900'
                        : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            f.severity === FINDING_SEVERITY.HIGH
                              ? 'bg-rose-100 text-rose-700 border border-rose-300'
                              : f.severity === FINDING_SEVERITY.MEDIUM
                              ? 'bg-amber-100 text-amber-700 border border-amber-300'
                              : 'bg-slate-200 text-slate-700 border border-slate-300'
                          }`}
                        >
                          {f.severity} Priority
                        </span>
                        <span className="font-semibold">{f.explanation}</span>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        <strong>Recommended Action:</strong> {f.recommendedAction}
                      </p>
                      {f.evidenceSnippet && (
                        <div className="text-[11px] font-mono bg-white/80 p-1.5 rounded border border-slate-200 mt-1">
                          Evidence: &ldquo;{f.evidenceSnippet}&rdquo;
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cross-Field Comparison Table */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              Side-by-Side Field Comparison (Submitted vs. OCR Extracted)
            </h4>
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-50 font-semibold text-slate-700 text-left">
                  <tr>
                    <th className="py-2.5 px-3">Field</th>
                    <th className="py-2.5 px-3">Portal Submission</th>
                    <th className="py-2.5 px-3">Document OCR Extraction</th>
                    <th className="py-2.5 px-3">Outcome</th>
                    <th className="py-2.5 px-3">Confidence & Evidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.entries(analysis.comparisonResults || {}).map(([key, comp]) => {
                    const isMatch = comp.result === COMPARISON_RESULT.MATCH;
                    const isMismatch = comp.result === COMPARISON_RESULT.MISMATCH;
                    const isMissing = comp.result === COMPARISON_RESULT.MISSING_IN_DOCUMENT;
                    const isAmbiguous = comp.result === COMPARISON_RESULT.AMBIGUOUS;

                    return (
                      <tr key={key} className={isMismatch ? 'bg-rose-50/30' : 'hover:bg-slate-50/50'}>
                        <td className="py-2 px-3 font-medium text-slate-800">
                          {comp.label}
                          {comp.critical && <span className="text-rose-500 ml-1">*</span>}
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-700">
                          {comp.submittedRaw || '—'}
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-800 font-semibold">
                          {comp.extractedRaw || <span className="text-slate-400 italic font-normal">Not detected</span>}
                        </td>
                        <td className="py-2 px-3">
                          {isMatch && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" /> Match
                            </span>
                          )}
                          {isMismatch && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                              <XCircle className="w-3 h-3" /> Mismatch
                            </span>
                          )}
                          {isMissing && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              Missing in Doc
                            </span>
                          )}
                          {isAmbiguous && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              Ambiguous
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-[11px] text-slate-500">
                          <div>Confidence: <span className="font-semibold text-slate-700">{comp.confidenceIndicator}</span></div>
                          {comp.sourceSnippet && (
                            <span className="font-mono text-[10px] text-slate-500 block truncate max-w-xs">
                              &ldquo;{comp.sourceSnippet}&rdquo;
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Privacy & Methodology Disclaimer */}
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-500 space-y-1">
            <p className="font-semibold text-slate-700 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#174EA6]" />
              Local Client-Side Processing & Sandbox Architecture
            </p>
            <p>
              Document text extraction executes in-memory inside the client browser. No document images or extracted financial data are transmitted to third-party artificial intelligence services. Automated matching assists in administrative accuracy and does not replace statutory bank confirmation.
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}
