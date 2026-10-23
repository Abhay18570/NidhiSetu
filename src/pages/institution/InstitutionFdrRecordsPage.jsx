import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import {
  fdrRepository,
  formatINR,
  getMaturityBadgeConfig,
  FDR_STATUS
} from '../../storage';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import DocumentPreviewModal from '../../components/common/DocumentPreviewModal';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Eye,
  AlertCircle,
  Clock,
  RotateCcw,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Calendar
} from 'lucide-react';

export default function InstitutionFdrRecordsPage() {
  const { currentInstitution } = useAuth();
  const [fdrs, setFdrs] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [stats, setStats] = useState({
    totalRecords: 0,
    accepted: 0,
    underReview: 0,
    clarification: 0,
    upcomingMaturities: 0,
    totalDepositPaise: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('recent'); // recent, maturity, amount

  // Document preview state
  const [previewDoc, setPreviewDoc] = useState(null);

  const loadData = async () => {
    if (!currentInstitution?.id) return;
    setLoading(true);
    try {
      const records = await fdrRepository.getFDRsByInstitution(currentInstitution.id, {
        status: statusFilter,
        query: searchQuery,
        sortBy,
      });
      setFdrs(records);

      const draftList = await fdrRepository.getDrafts(currentInstitution.id);
      setDrafts(draftList);

      const statData = await fdrRepository.getInstitutionFdrStats(currentInstitution.id);
      setStats(statData);
    } catch (err) {
      console.error('Failed to load FDR records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentInstitution, statusFilter, searchQuery, sortBy]);

  const handleDeleteDraft = async (draftId) => {
    if (!confirm('Are you sure you want to discard this saved draft?')) return;
    await fdrRepository.deleteDraft(draftId, currentInstitution?.id);
    loadData();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case FDR_STATUS.REVIEW_ACCEPTED:
        return <Badge variant="green" size="sm">Accepted</Badge>;
      case FDR_STATUS.REVIEW_REJECTED:
        return <Badge variant="red" size="sm">Rejected</Badge>;
      case FDR_STATUS.CLARIFICATION_REQUIRED:
        return <Badge variant="saffron" size="sm">Needs Clarification</Badge>;
      case FDR_STATUS.UNDER_REVIEW:
        return <Badge variant="blue" size="sm">Under Review</Badge>;
      case FDR_STATUS.RESUBMITTED:
        return <Badge variant="navy" size="sm">Resubmitted</Badge>;
      case FDR_STATUS.SUBMITTED:
        return <Badge variant="blue" size="sm">Submitted</Badge>;
      case FDR_STATUS.DRAFT:
      default:
        return <Badge variant="gray" size="sm">Draft</Badge>;
    }
  };

  // Mask FDR number e.g. "SBI-FDR-9812401" -> "SBI-***-2401"
  const maskFdrNumber = (fdrNo) => {
    if (!fdrNo) return '—';
    if (fdrNo.length <= 6) return fdrNo;
    const prefix = fdrNo.slice(0, 4);
    const suffix = fdrNo.slice(-4);
    return `${prefix}***${suffix}`;
  };

  return (
    <div className="space-y-6 max-w-7xl pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#174EA6]">
              Repository & Ledger
            </span>
            <Badge variant="blue" size="sm">
              Module 03 Active
            </Badge>
          </div>
          <h1 className="text-2xl font-black text-[#0B1F54]">
            Fixed Deposit Receipt (FDR) Repository
          </h1>
          <p className="text-xs sm:text-sm text-[#505F79] mt-0.5">
            Archival ledger of institutional security deposits, scrutiny decisions, and renewal covenants.
          </p>
        </div>

        <Button
          to="/institution/fdr/new"
          variant="primary"
          size="md"
          icon={Plus}
          className="font-bold shrink-0 shadow-md"
        >
          Submit New FDR
        </Button>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-[#505F79] font-semibold uppercase">Total FDR Records</div>
            <div className="text-2xl font-black text-[#0B1F54] mt-0.5">{stats.totalRecords}</div>
            <div className="text-[11px] text-slate-400">Registered Files</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#E8F0FE] text-[#174EA6] flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-[#505F79] font-semibold uppercase">Accepted Deposit Value</div>
            <div className="text-xl sm:text-2xl font-black text-[#13805E] mt-0.5">
              {formatINR(stats.totalDepositPaise, true)}
            </div>
            <div className="text-[11px] text-slate-400">Self-Declared Value</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#13805E] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-[#505F79] font-semibold uppercase">In Scrutiny / Review</div>
            <div className="text-2xl font-black text-[#174EA6] mt-0.5">
              {stats.underReview + stats.submitted}
            </div>
            <div className="text-[11px] text-slate-400">With AICTE Officers</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#174EA6] flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-[#505F79] font-semibold uppercase">Upcoming Renewals</div>
            <div className="text-2xl font-black text-[#C67C11] mt-0.5">
              {stats.upcomingMaturities}
            </div>
            <div className="text-[11px] text-slate-400">Matures in &le; 90 Days</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#C67C11] flex items-center justify-center shrink-0">
            <RotateCcw className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Search */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reference, FDR #, bank..."
              className="w-full pl-9 pr-3 py-1.5 bg-[#F5F7FB] border border-[#D3DDEB] rounded-lg text-xs text-[#0B1F54] focus:outline-none focus:ring-2 focus:ring-[#174EA6]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-[#F5F7FB] border border-[#D3DDEB] rounded-lg text-xs text-[#0B1F54] focus:outline-none focus:ring-1 focus:ring-[#174EA6]"
              >
                <option value="ALL">All Statuses</option>
                <option value={FDR_STATUS.SUBMITTED}>Submitted</option>
                <option value={FDR_STATUS.UNDER_REVIEW}>Under Review</option>
                <option value={FDR_STATUS.CLARIFICATION_REQUIRED}>Clarification Required</option>
                <option value={FDR_STATUS.REVIEW_ACCEPTED}>Accepted</option>
                <option value={FDR_STATUS.REVIEW_REJECTED}>Rejected</option>
              </select>
            </div>

            {/* Sort by */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-2.5 py-1.5 bg-[#F5F7FB] border border-[#D3DDEB] rounded-lg text-xs text-[#0B1F54] focus:outline-none focus:ring-1 focus:ring-[#174EA6]"
            >
              <option value="recent">Sort: Most Recent</option>
              <option value="maturity">Sort: Maturity Date</option>
              <option value="amount">Sort: Amount High-to-Low</option>
            </select>
          </div>
        </div>
      </Card>

      {/* In-Progress Drafts Notice Banner if any */}
      {drafts.length > 0 && statusFilter === 'ALL' && (
        <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-[#174EA6] shrink-0" />
            <span className="text-[#0B1F54]">
              You have <strong>{drafts.length}</strong> saved draft in progress.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/institution/fdr/new"
              className="px-3 py-1 bg-[#174EA6] text-white rounded-lg font-bold hover:bg-[#0B1F54] transition-colors"
            >
              Resume Draft
            </Link>
            <button
              onClick={() => handleDeleteDraft(drafts[0].id)}
              className="text-slate-500 hover:text-rose-600 px-2 py-1 font-semibold"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {/* Main FDR Records Table */}
      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            Loading institutional FDR records...
          </div>
        ) : fdrs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileText className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-bold text-base text-[#0B1F54]">No Fixed Deposit Receipts Found</h3>
            <p className="text-xs text-[#505F79] max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'ALL'
                ? 'No deposit records match your search criteria. Try resetting the filters.'
                : 'Your institution has not submitted any Fixed Deposit Receipts yet. Click below to begin your first submission.'}
            </p>
            {!searchQuery && statusFilter === 'ALL' && (
              <div className="pt-2">
                <Button to="/institution/fdr/new" variant="primary" size="sm" icon={Plus}>
                  Submit First FDR
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0B1F54] text-white uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Reference #</th>
                  <th className="px-3 py-3.5">Bank & Branch</th>
                  <th className="px-3 py-3.5">FDR Number</th>
                  <th className="px-3 py-3.5">Deposit Amount</th>
                  <th className="px-3 py-3.5">Tenure Dates</th>
                  <th className="px-3 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[#0B1F54]">
                {fdrs.map((fdr) => {
                  const maturityBadge = getMaturityBadgeConfig(fdr.maturityDate);
                  const isClarification = fdr.status === FDR_STATUS.CLARIFICATION_REQUIRED;

                  return (
                    <tr
                      key={fdr.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isClarification ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      <td className="px-4 py-3.5 font-mono font-bold text-[#174EA6]">
                        <Link to={`/institution/fdr/${fdr.id}`} className="hover:underline flex items-center gap-1">
                          <span>{fdr.referenceNumber}</span>
                          <ChevronRight className="w-3 h-3 text-slate-400" />
                        </Link>
                      </td>
                      <td className="px-3 py-3.5">
                        <div className="font-bold text-[#0B1F54]">{fdr.bankName}</div>
                        <div className="text-[11px] text-[#505F79]">{fdr.branchName || 'Main Branch'}</div>
                      </td>
                      <td className="px-3 py-3.5 font-mono text-slate-600">
                        {maskFdrNumber(fdr.fdrNumber)}
                      </td>
                      <td className="px-3 py-3.5">
                        <div className="font-bold text-sm text-[#13805E]">
                          {formatINR(fdr.depositAmountPaise, true)}
                        </div>
                        <div className="text-[10px] text-slate-400">@ {fdr.interestRate || '7.1'}% p.a.</div>
                      </td>
                      <td className="px-3 py-3.5">
                        <div className="font-medium text-slate-600">
                          {fdr.depositDate} &rarr; {fdr.maturityDate}
                        </div>
                        <div className="mt-1">
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${maturityBadge.colorClass}`}
                          >
                            {maturityBadge.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3.5">
                        {getStatusBadge(fdr.status)}
                      </td>
                      <td className="px-4 py-3.5 text-right space-x-1 shrink-0">
                        <Button
                          to={`/institution/fdr/${fdr.id}`}
                          variant="outline"
                          size="sm"
                          icon={Eye}
                          className="text-xs px-2.5 py-1"
                        >
                          View
                        </Button>

                        {isClarification && (
                          <Button
                            to={`/institution/fdr/${fdr.id}?action=clarify`}
                            variant="primary"
                            size="sm"
                            className="text-xs px-2.5 py-1 bg-[#E89B24] hover:bg-[#c67c11] border-[#E89B24] font-bold"
                          >
                            Resolve
                          </Button>
                        )}

                        {fdr.status === FDR_STATUS.REVIEW_ACCEPTED && maturityBadge.days <= 90 && (
                          <Button
                            to={`/institution/fdr/new?renewalRef=${fdr.referenceNumber}`}
                            variant="secondary"
                            size="sm"
                            className="text-xs px-2.5 py-1 font-semibold"
                          >
                            Renew
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Document Preview Modal */}
      {previewDoc && (
        <DocumentPreviewModal
          isOpen={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
          documentId={previewDoc.documentId}
          fileName={previewDoc.fileName}
          fileType={previewDoc.fileType}
          fileSize={previewDoc.fileSize}
          sha256Hash={previewDoc.sha256Hash}
        />
      )}
    </div>
  );
}
