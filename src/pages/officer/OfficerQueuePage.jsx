import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import {
  fdrRepository,
  formatINR,
  getMaturityBadgeConfig,
  FDR_STATUS,
  institutionRepository
} from '../../storage';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import {
  Layers,
  Search,
  Filter,
  Clock,
  Eye,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Building2,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export default function OfficerQueuePage() {
  const { currentUser } = useAuth();
  const [queue, setQueue] = useState([]);
  const [institutionsMap, setInstitutionsMap] = useState({});
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('pending'); // pending, recent

  const loadQueue = async () => {
    setLoading(true);
    try {
      const items = await fdrRepository.getOfficerQueue({
        status: statusFilter,
        search: searchQuery,
        sortBy,
      });
      setQueue(items);

      // Load all institutions to map institution IDs to names & AISHE
      const insts = await institutionRepository.getAllInstitutions();
      const map = {};
      for (const inst of insts) {
        map[inst.id] = inst;
      }
      setInstitutionsMap(map);
    } catch (err) {
      console.error('Failed to load scrutiny queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, [statusFilter, searchQuery, sortBy]);

  // Status counts
  const pendingCount = queue.filter((f) => f.status === FDR_STATUS.SUBMITTED).length;
  const inReviewCount = queue.filter((f) => [FDR_STATUS.UNDER_REVIEW, FDR_STATUS.RESUBMITTED].includes(f.status)).length;
  const clarifyCount = queue.filter((f) => f.status === FDR_STATUS.CLARIFICATION_REQUIRED).length;
  const decidedCount = queue.filter((f) => [FDR_STATUS.REVIEW_ACCEPTED, FDR_STATUS.REVIEW_REJECTED].includes(f.status)).length;

  const getStatusBadge = (status) => {
    switch (status) {
      case FDR_STATUS.REVIEW_ACCEPTED:
        return <Badge variant="green" size="sm">Accepted</Badge>;
      case FDR_STATUS.REVIEW_REJECTED:
        return <Badge variant="red" size="sm">Rejected</Badge>;
      case FDR_STATUS.CLARIFICATION_REQUIRED:
        return <Badge variant="saffron" size="sm">Clarification Requested</Badge>;
      case FDR_STATUS.UNDER_REVIEW:
        return <Badge variant="blue" size="sm">Under Review</Badge>;
      case FDR_STATUS.RESUBMITTED:
        return <Badge variant="navy" size="sm">Resubmitted</Badge>;
      case FDR_STATUS.SUBMITTED:
      default:
        return <Badge variant="blue" size="sm">Pending Review</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl pb-16">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[#174EA6]">
            AICTE Regulatory Oversight Bureau
          </span>
          <Badge variant="blue" size="sm">
            Western Regional Bureau
          </Badge>
        </div>
        <h1 className="text-2xl font-black text-[#0B1F54]">
          Regulatory Scrutiny Verification Queue
        </h1>
        <p className="text-xs sm:text-sm text-[#505F79] mt-0.5">
          Evaluate institutional Fixed Deposit Receipt certificates, verify bank joint lien clauses, and record administrative scrutiny decisions.
        </p>
      </div>

      {/* Advisory Notice */}
      <div className="p-4 bg-[#FEF7EC] border border-[#E89B24] rounded-xl flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-[#C67C11] shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed text-[#0B1F54]">
          <span className="font-bold text-[#C67C11] uppercase tracking-wider">
            Prototype Scrutiny Engine (Module 03):{' '}
          </span>
          Administrative acceptance records the compliance review decision for the platform demonstration. It does not represent live electronic bank branch reconciliation.
        </div>
      </div>

      {/* KPI Status Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card
          onClick={() => setStatusFilter(FDR_STATUS.SUBMITTED)}
          className={`p-4 cursor-pointer transition-all ${
            statusFilter === FDR_STATUS.SUBMITTED ? 'ring-2 ring-[#174EA6] bg-blue-50/20' : 'hover:bg-slate-50'
          }`}
        >
          <div className="text-[11px] text-[#505F79] font-semibold uppercase">Pending Scrutiny</div>
          <div className="text-2xl font-black text-[#174EA6] mt-0.5">{pendingCount}</div>
          <div className="text-[11px] text-slate-400">Awaiting Initial Review</div>
        </Card>

        <Card
          onClick={() => setStatusFilter(FDR_STATUS.UNDER_REVIEW)}
          className={`p-4 cursor-pointer transition-all ${
            statusFilter === FDR_STATUS.UNDER_REVIEW ? 'ring-2 ring-[#174EA6] bg-blue-50/20' : 'hover:bg-slate-50'
          }`}
        >
          <div className="text-[11px] text-[#505F79] font-semibold uppercase">In Active Review</div>
          <div className="text-2xl font-black text-[#0B1F54] mt-0.5">{inReviewCount}</div>
          <div className="text-[11px] text-slate-400">Assigned / In Progress</div>
        </Card>

        <Card
          onClick={() => setStatusFilter(FDR_STATUS.CLARIFICATION_REQUIRED)}
          className={`p-4 cursor-pointer transition-all ${
            statusFilter === FDR_STATUS.CLARIFICATION_REQUIRED ? 'ring-2 ring-[#E89B24] bg-amber-50/20' : 'hover:bg-slate-50'
          }`}
        >
          <div className="text-[11px] text-[#505F79] font-semibold uppercase">Clarification Required</div>
          <div className="text-2xl font-black text-[#C67C11] mt-0.5">{clarifyCount}</div>
          <div className="text-[11px] text-slate-400">Awaiting College Response</div>
        </Card>

        <Card
          onClick={() => setStatusFilter(FDR_STATUS.REVIEW_ACCEPTED)}
          className={`p-4 cursor-pointer transition-all ${
            statusFilter === FDR_STATUS.REVIEW_ACCEPTED ? 'ring-2 ring-[#13805E] bg-emerald-50/20' : 'hover:bg-slate-50'
          }`}
        >
          <div className="text-[11px] text-[#505F79] font-semibold uppercase">Accepted / Decided</div>
          <div className="text-2xl font-black text-[#13805E] mt-0.5">{decidedCount}</div>
          <div className="text-[11px] text-slate-400">Completed Reviews</div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reference, bank, FDR #..."
              className="w-full pl-9 pr-3 py-1.5 bg-[#F5F7FB] border border-[#D3DDEB] rounded-lg text-xs text-[#0B1F54] focus:outline-none focus:ring-2 focus:ring-[#174EA6]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <div className="flex items-center gap-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-[#F5F7FB] border border-[#D3DDEB] rounded-lg text-xs text-[#0B1F54] focus:outline-none focus:ring-1 focus:ring-[#174EA6]"
              >
                <option value="ALL">All Queue Dockets</option>
                <option value={FDR_STATUS.SUBMITTED}>Pending Scrutiny</option>
                <option value={FDR_STATUS.UNDER_REVIEW}>Under Active Review</option>
                <option value={FDR_STATUS.RESUBMITTED}>Resubmitted by College</option>
                <option value={FDR_STATUS.CLARIFICATION_REQUIRED}>Clarification Required</option>
                <option value={FDR_STATUS.REVIEW_ACCEPTED}>Accepted Records</option>
                <option value={FDR_STATUS.REVIEW_REJECTED}>Rejected Records</option>
              </select>
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-2.5 py-1.5 bg-[#F5F7FB] border border-[#D3DDEB] rounded-lg text-xs text-[#0B1F54] focus:outline-none focus:ring-1 focus:ring-[#174EA6]"
            >
              <option value="pending">Sort: Oldest Pending First</option>
              <option value="recent">Sort: Most Recently Submitted</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Main Queue Table */}
      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">Loading scrutiny queue...</div>
        ) : queue.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-bold text-base text-[#0B1F54]">No Queue Records Found</h3>
            <p className="text-xs text-[#505F79] max-w-sm mx-auto">
              There are currently no institutional FDR submissions matching the selected queue filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0B1F54] text-white uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Docket Ref</th>
                  <th className="px-3 py-3.5">Institution & AISHE</th>
                  <th className="px-3 py-3.5">Issuing Bank</th>
                  <th className="px-3 py-3.5">Deposit Amount</th>
                  <th className="px-3 py-3.5">Submitted On</th>
                  <th className="px-3 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[#0B1F54]">
                {queue.map((item) => {
                  const inst = institutionsMap[item.institutionId];
                  const isPending = item.status === FDR_STATUS.SUBMITTED;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isPending ? 'bg-blue-50/20' : ''
                      }`}
                    >
                      <td className="px-4 py-3.5 font-mono font-bold text-[#174EA6]">
                        <Link to={`/officer/fdr/${item.id}`} className="hover:underline flex items-center gap-1">
                          <span>{item.referenceNumber}</span>
                          <ChevronRight className="w-3 h-3 text-slate-400" />
                        </Link>
                      </td>
                      <td className="px-3 py-3.5 max-w-xs">
                        <div className="font-bold text-[#0B1F54] truncate">
                          {inst?.name || item.institutionId}
                        </div>
                        <div className="text-[11px] text-[#505F79] font-mono">
                          AISHE: {inst?.aisheCode || '—'} &bull; {inst?.city || ''}
                        </div>
                      </td>
                      <td className="px-3 py-3.5">
                        <div className="font-bold text-[#0B1F54]">{item.bankName}</div>
                        <div className="text-[11px] text-[#505F79] font-mono">
                          IFSC: {item.ifsc}
                        </div>
                      </td>
                      <td className="px-3 py-3.5">
                        <div className="font-bold text-sm text-[#13805E]">
                          {formatINR(item.depositAmountPaise, true)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Matures: {item.maturityDate}
                        </div>
                      </td>
                      <td className="px-3 py-3.5 font-mono text-slate-600">
                        {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-3 py-3.5">
                        {getStatusBadge(item.status)}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Button
                          to={`/officer/fdr/${item.id}`}
                          variant={isPending ? 'primary' : 'outline'}
                          size="sm"
                          icon={Eye}
                          className="text-xs px-3 py-1 font-semibold"
                        >
                          {isPending ? 'Scrutinize' : 'Inspect'}
                        </Button>
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
