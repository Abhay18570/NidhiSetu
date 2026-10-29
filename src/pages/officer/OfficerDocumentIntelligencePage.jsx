/**
 * NidhiSetu Officer Workspace — Document Intelligence Scrutiny Console
 * Central investigation console for regulatory officers to monitor OCR extractions,
 * track cross-field discrepancies, prioritize potential anomalies, and trigger human reviews.
 */

import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FileSearch,
  AlertTriangle,
  AlertOctagon,
  Clock,
  Search,
  FileText,
  ExternalLink,
  Sparkles,
  Database,
  Trash2,
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import {
  documentAnalysisRepository,
  intelligenceReviewRepository,
  fdrRepository,
  institutionRepository,
} from '../../storage';
import {
  loadDemoAnalyses,
  clearDemoAnalyses,
  FINDING_SEVERITY,
  REVIEW_STATUS,
} from '../../intelligence';

export default function OfficerDocumentIntelligencePage() {
  const [analyses, setAnalyses] = useState([]);
  const [fdrs, setFdrs] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [institutions, setInstitutions] = useState([]);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInstitution, setSelectedInstitution] = useState('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');
  const [selectedReviewStatus, setSelectedReviewStatus] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [demoActionMsg, setDemoActionMsg] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [allAnalyses, allFdrs, allReviews, allInsts] = await Promise.all([
        documentAnalysisRepository.getAllAnalyses(),
        fdrRepository.getAllFDRs(),
        intelligenceReviewRepository.getAllReviews(),
        institutionRepository.getAllInstitutions(),
      ]);

      setAnalyses(allAnalyses || []);
      setFdrs(allFdrs || []);
      setReviews(allReviews || []);
      setInstitutions(allInsts || []);
    } catch (err) {
      console.error('Failed to load document intelligence data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handler for loading synthetic demo fixtures
  const handleLoadDemo = async () => {
    setLoading(true);
    try {
      const res = await loadDemoAnalyses();
      setDemoActionMsg(res.message);
      await loadData();
    } catch (err) {
      setDemoActionMsg('Failed to load demo fixtures: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClearDemo = async () => {
    setLoading(true);
    try {
      await clearDemoAnalyses();
      setDemoActionMsg('Synthetic demo analysis fixtures cleared.');
      await loadData();
    } catch (err) {
      setDemoActionMsg('Failed to clear demo fixtures: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Group latest analysis per FDR
  const latestAnalysesByFdr = useMemo(() => {
    const map = new Map();
    // Sort all newest first
    const sorted = [...analyses].sort((a, b) => new Date(b.analyzedAt || 0) - new Date(a.analyzedAt || 0));
    for (const a of sorted) {
      if (!map.has(a.fdrId)) {
        map.set(a.fdrId, a);
      }
    }
    return Array.from(map.values());
  }, [analyses]);

  // Aggregate stats for summary cards
  const summaryStats = useMemo(() => {
    const totalAnalyzed = latestAnalysesByFdr.length;

    let withDiscrepancies = 0;
    let highPriorityCount = 0;
    let pendingReviews = 0;

    for (const item of latestAnalysesByFdr) {
      const findings = item.findings || [];
      const hasMismatch = item.scorecard?.consistency?.mismatchedCount > 0;
      const hasHighSev = findings.some((f) => f.severity === FINDING_SEVERITY.HIGH);

      if (hasMismatch || findings.length > 0) withDiscrepancies++;
      if (hasHighSev) highPriorityCount++;

      // Check review status of findings
      for (const f of findings) {
        const rev = reviews.find((r) => r.findingId === f.findingId);
        if (!rev || rev.status === REVIEW_STATUS.OPEN || rev.status === REVIEW_STATUS.UNDER_REVIEW) {
          pendingReviews++;
          break; // Count once per FDR
        }
      }
    }

    return {
      totalAnalyzed,
      withDiscrepancies,
      highPriorityCount,
      pendingReviews,
    };
  }, [latestAnalysesByFdr, reviews]);

  // Filtered & Sorted Table Rows
  const filteredRecords = useMemo(() => {
    return latestAnalysesByFdr.filter((item) => {
      const fdr = fdrs.find((f) => f.id === item.fdrId) || {};
      const findings = item.findings || [];

      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const refMatch = (item.referenceNumber || fdr.referenceNumber || '').toLowerCase().includes(q);
        const instMatch = (item.institutionName || fdr.institutionName || '').toLowerCase().includes(q);
        const bankMatch = (fdr.bankName || '').toLowerCase().includes(q);
        const fdrNoMatch = (fdr.fdrNumber || '').toLowerCase().includes(q);
        if (!refMatch && !instMatch && !bankMatch && !fdrNoMatch) return false;
      }

      // 2. Institution Filter
      if (selectedInstitution !== 'ALL' && item.institutionId !== selectedInstitution) {
        return false;
      }

      // 3. Severity Filter
      if (selectedSeverity !== 'ALL') {
        const hasMatchingSev = findings.some((f) => f.severity === selectedSeverity);
        if (!hasMatchingSev) return false;
      }

      // 4. Review Status Filter
      if (selectedReviewStatus !== 'ALL') {
        const fdrReviews = reviews.filter((r) => r.fdrId === item.fdrId);
        if (selectedReviewStatus === 'OPEN' && !fdrReviews.some((r) => r.status === REVIEW_STATUS.OPEN)) {
          return false;
        }
        if (selectedReviewStatus === 'RESOLVED' && !fdrReviews.every((r) => r.status === REVIEW_STATUS.RESOLVED || r.status === REVIEW_STATUS.DISMISSED)) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'oldest') {
        return new Date(a.analyzedAt || 0) - new Date(b.analyzedAt || 0);
      }
      return new Date(b.analyzedAt || 0) - new Date(a.analyzedAt || 0);
    });
  }, [latestAnalysesByFdr, fdrs, reviews, searchQuery, selectedInstitution, selectedSeverity, selectedReviewStatus, sortBy]);

  const breadcrumbs = [
    { label: 'Scrutiny Console', to: '/officer/dashboard' },
    { label: 'Document Intelligence Workspace' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <Breadcrumbs items={breadcrumbs} />

      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-[#D3DDEB] p-6 gov-shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-[#174EA6]/10 text-[#174EA6]">
              <Sparkles className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-[#0B1F54]">
              Document Intelligence & Anomaly Console
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Automated OCR entity extraction, deterministic cross-field validation, duplicate fingerprint detection, and regulatory scrutiny review workspace.
          </p>
        </div>

        {/* Demo Data Controls */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={Database}
            onClick={handleLoadDemo}
            title="Load predefined synthetic OCR analysis samples"
          >
            Load Demo Fixtures
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={Trash2}
            onClick={handleClearDemo}
            className="text-rose-600 border-rose-200 hover:bg-rose-50"
            title="Clear only synthetic demo analysis records"
          >
            Clear Demo
          </Button>
        </div>
      </div>

      {demoActionMsg && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-[#174EA6] flex items-center justify-between">
          <span>{demoActionMsg}</span>
          <button type="button" onClick={() => setDemoActionMsg('')} className="font-bold underline ml-2">Dismiss</button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Analyzed */}
        <Card className="p-5 border-l-4 border-l-[#174EA6]">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Total Analyzed FDRs</span>
            <FileSearch className="w-4 h-4 text-[#174EA6]" />
          </div>
          <div className="text-2xl font-bold text-slate-800 mt-2">
            {summaryStats.totalAnalyzed}
          </div>
          <p className="text-[0.6875rem] text-slate-400 mt-1">Processed with OCR extraction</p>
        </Card>

        {/* Records with Discrepancies */}
        <Card className="p-5 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Records with Discrepancies</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-800 mt-2">
            {summaryStats.withDiscrepancies}
          </div>
          <p className="text-[0.6875rem] text-slate-400 mt-1">Field variance or missing data</p>
        </Card>

        {/* High-Priority Findings */}
        <Card className="p-5 border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>High-Priority Discrepancies</span>
            <AlertOctagon className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-slate-800 mt-2">
            {summaryStats.highPriorityCount}
          </div>
          <p className="text-[0.6875rem] text-slate-400 mt-1">Amount / date / collision alarms</p>
        </Card>

        {/* Pending Human Reviews */}
        <Card className="p-5 border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Pending Officer Reviews</span>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-slate-800 mt-2">
            {summaryStats.pendingReviews}
          </div>
          <p className="text-[0.6875rem] text-slate-400 mt-1">Requiring adjudication</p>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reference, institution, bank, FDR no..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#174EA6]"
            />
          </div>

          {/* Filter: Institution */}
          <div>
            <select
              value={selectedInstitution}
              onChange={(e) => setSelectedInstitution(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#174EA6]"
            >
              <option value="ALL">All Institutions</option>
              {institutions.map((inst) => (
                <option key={inst.id} value={inst.id}>{inst.name}</option>
              ))}
            </select>
          </div>

          {/* Filter: Severity */}
          <div>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#174EA6]"
            >
              <option value="ALL">All Severities</option>
              <option value={FINDING_SEVERITY.HIGH}>High Priority</option>
              <option value={FINDING_SEVERITY.MEDIUM}>Medium Priority</option>
              <option value={FINDING_SEVERITY.LOW}>Low Priority</option>
              <option value={FINDING_SEVERITY.INFO}>Info / None</option>
            </select>
          </div>

          {/* Filter: Review Status */}
          <div>
            <select
              value={selectedReviewStatus}
              onChange={(e) => setSelectedReviewStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#174EA6]"
            >
              <option value="ALL">All Review States</option>
              <option value="OPEN">Open for Review</option>
              <option value="RESOLVED">Resolved / Dismissed</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#174EA6]"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Analysis Table */}
      <Card className="overflow-hidden border border-[#D3DDEB]">
        <div className="p-4 bg-slate-50/70 border-b border-[#D3DDEB] flex items-center justify-between">
          <span className="font-semibold text-xs text-slate-700">
            Analyzed FDR Submissions ({filteredRecords.length})
          </span>
          <span className="text-[0.6875rem] text-slate-500">
            Click &ldquo;View Investigation Dossier&rdquo; to review evidence & adjudicate
          </span>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileSearch className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-xs font-semibold text-slate-700">No matching document intelligence records found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {analyses.length === 0
                ? 'Click "Load Demo Fixtures" above or run an analysis from an individual FDR detail page.'
                : 'Adjust your search filters to view records.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold text-left">
                <tr>
                  <th className="py-3 px-4">FDR Reference</th>
                  <th className="py-3 px-4">Institution</th>
                  <th className="py-3 px-4">Document</th>
                  <th className="py-3 px-4">Completeness</th>
                  <th className="py-3 px-4">Match Summary</th>
                  <th className="py-3 px-4">Findings</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredRecords.map((item) => {
                  const fdr = fdrs.find((f) => f.id === item.fdrId) || {};
                  const findings = item.findings || [];
                  const highestSev = findings.some((f) => f.severity === FINDING_SEVERITY.HIGH)
                    ? FINDING_SEVERITY.HIGH
                    : findings.some((f) => f.severity === FINDING_SEVERITY.MEDIUM)
                    ? FINDING_SEVERITY.MEDIUM
                    : findings.some((f) => f.severity === FINDING_SEVERITY.LOW)
                    ? FINDING_SEVERITY.LOW
                    : 'INFO';

                  return (
                    <tr key={item.analysisId} className="hover:bg-slate-50/70 transition-colors">
                      {/* FDR Reference */}
                      <td className="py-3 px-4 font-mono font-bold text-[#174EA6]">
                        {item.referenceNumber || fdr.referenceNumber || item.fdrId}
                      </td>

                      {/* Institution */}
                      <td className="py-3 px-4 text-slate-800 font-medium max-w-[12.5rem] truncate" title={item.institutionName || fdr.institutionName}>
                        {item.institutionName || fdr.institutionName || 'Unknown Institution'}
                      </td>

                      {/* Document */}
                      <td className="py-3 px-4 text-slate-600 truncate max-w-[11.25rem]" title={item.documentFileName || fdr.fileName}>
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{item.documentFileName || fdr.fileName || 'document.pdf'}</span>
                        </div>
                      </td>

                      {/* Completeness */}
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-700">
                          {item.scorecard?.completeness?.percentage || 0}%
                        </span>
                        <span className="text-[0.625rem] text-slate-400 block font-mono">
                          {item.scorecard?.completeness?.extractedCount}/{item.scorecard?.completeness?.totalFields} fields
                        </span>
                      </td>

                      {/* Match Summary */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-emerald-700 font-semibold">
                            {item.scorecard?.consistency?.matchedCount || 0} match
                          </span>
                          {item.scorecard?.consistency?.mismatchedCount > 0 && (
                            <span className="text-rose-600 font-bold">
                              &bull; {item.scorecard?.consistency?.mismatchedCount} diff
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Findings */}
                      <td className="py-3 px-4">
                        {findings.length === 0 ? (
                          <span className="text-emerald-700 font-medium">None</span>
                        ) : (
                          <span className="font-semibold text-slate-800">
                            {findings.length} finding{findings.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </td>

                      {/* Priority */}
                      <td className="py-3 px-4">
                        {highestSev === FINDING_SEVERITY.HIGH && (
                          <span className="px-2 py-0.5 rounded text-[0.625rem] font-bold bg-rose-100 text-rose-700 border border-rose-300">
                            HIGH
                          </span>
                        )}
                        {highestSev === FINDING_SEVERITY.MEDIUM && (
                          <span className="px-2 py-0.5 rounded text-[0.625rem] font-bold bg-amber-100 text-amber-700 border border-amber-300">
                            MEDIUM
                          </span>
                        )}
                        {highestSev === FINDING_SEVERITY.LOW && (
                          <span className="px-2 py-0.5 rounded text-[0.625rem] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                            LOW
                          </span>
                        )}
                        {highestSev === 'INFO' && (
                          <span className="px-2 py-0.5 rounded text-[0.625rem] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            CLEAR
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/officer/document-intelligence/${item.fdrId}`}
                          className="inline-flex items-center gap-1 text-[0.6875rem] font-semibold text-[#174EA6] bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded transition-colors"
                        >
                          <span>Review Dossier</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
