import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { institutionRepository } from '../../storage/institutionRepository';
import { auditRepository } from '../../storage/auditRepository';
import { fdrRepository } from '../../storage/fdrRepository';
import { FDR_STATUS } from '../../storage/fdrLifecycleRepository';
import { formatINR } from '../../storage/fdrValidation';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import {
  Building2,
  FileCheck,
  Search,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Layers,
  Activity,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';

export default function OfficerDashboard() {
  const { currentUser } = useAuth();
  const [institutions, setInstitutions] = useState([]);
  const [recentAudits, setRecentAudits] = useState([]);
  const [queueItems, setQueueItems] = useState([]);
  const [stats, setStats] = useState({
    pending: 0,
    underReview: 0,
    clarification: 0,
    completed: 0,
  });

  useEffect(() => {
    async function loadData() {
      const instList = await institutionRepository.getAllInstitutions();
      setInstitutions(instList);
      const logs = await auditRepository.getAuditLogs();
      setRecentAudits(logs.slice(0, 6));

      const queue = await fdrRepository.getOfficerQueue({ sortBy: 'recent' });
      setQueueItems(queue);

      const pending = queue.filter(
        (f) => f.status === FDR_STATUS.SUBMITTED || f.status === FDR_STATUS.RESUBMITTED
      ).length;
      const underReview = queue.filter((f) => f.status === FDR_STATUS.UNDER_REVIEW).length;
      const clarification = queue.filter((f) => f.status === FDR_STATUS.CLARIFICATION_REQUIRED).length;
      const completed = queue.filter(
        (f) => f.status === FDR_STATUS.REVIEW_ACCEPTED || f.status === FDR_STATUS.REVIEW_REJECTED
      ).length;

      setStats({ pending, underReview, clarification, completed });
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Officer Header */}
      <div className="bg-white rounded-xl border border-[#D3DDEB] p-6 gov-shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#C67C11]">
              Regulatory Scrutiny Console
            </span>
            <Badge variant="saffron" size="sm">
              AICTE Western Regional Bureau
            </Badge>
          </div>
          <h1 className="text-2xl font-black text-[#0B1F54]">
            Welcome, {currentUser?.name}
          </h1>
          <p className="text-xs sm:text-sm text-[#505F79] mt-0.5">
            {currentUser?.designation || 'Regional Scrutiny Director'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            to="/officer/institutions"
            variant="primary"
            size="sm"
            icon={Building2}
            className="font-semibold"
          >
            Inspect Institutions
          </Button>
          <Button
            to="/officer/verification-queue"
            variant="outline"
            size="sm"
            icon={Layers}
            className="font-semibold"
          >
            Review Queue
          </Button>
        </div>
      </div>

      {/* Regulatory Prototype Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-[#E89B24] shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Administrative Review Protocol: </span>
          Decisions recorded here reflect regulatory document completeness checks on self-reported deposit records.
          In this prototype demonstration, administrative acceptance does not constitute independent verification with the issuing bank.
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex items-center justify-between border-l-4 border-l-[#E89B24]">
          <div>
            <div className="text-xs text-[#505F79] font-medium">Pending Scrutiny</div>
            <div className="text-2xl font-black text-[#E89B24] mt-1">{stats.pending}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Submitted / Resubmitted</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#FEF7EC] text-[#E89B24] flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between border-l-4 border-l-[#174EA6]">
          <div>
            <div className="text-xs text-[#505F79] font-medium">Under Review</div>
            <div className="text-2xl font-black text-[#174EA6] mt-1">{stats.underReview}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">In active scrutiny</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#E8F0FE] text-[#174EA6] flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between border-l-4 border-l-amber-500">
          <div>
            <div className="text-xs text-[#505F79] font-medium">Clarification Required</div>
            <div className="text-2xl font-black text-amber-700 mt-1">{stats.clarification}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Awaiting institution</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between border-l-4 border-l-[#13805E]">
          <div>
            <div className="text-xs text-[#505F79] font-medium">Completed Reviews</div>
            <div className="text-2xl font-black text-[#13805E] mt-1">{stats.completed}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Accepted or Rejected</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#E6F4EA] text-[#13805E] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </Card>
      </div>

      {/* Recent FDR Queue Table */}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-[#174EA6]" />
            <span className="font-bold text-xs text-[#0B1F54] uppercase tracking-wider">
              Recent Scrutiny Submissions ({queueItems.length})
            </span>
          </div>
          <Link
            to="/officer/verification-queue"
            className="text-xs font-bold text-[#174EA6] hover:underline flex items-center gap-1"
          >
            <span>Open Verification Queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F7FB] border-b border-slate-200 text-[#505F79] font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Reference / Bank</th>
                <th className="px-3 py-3">Deposit Amount</th>
                <th className="px-3 py-3">Maturity Date</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[#0B1F54]">
              {queueItems.slice(0, 5).map((fdr) => (
                <tr key={fdr.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-bold text-[#174EA6] font-mono">{fdr.referenceNumber}</div>
                    <div className="text-[11px] text-[#505F79]">{fdr.bankName}</div>
                  </td>
                  <td className="px-3 py-3 font-semibold">
                    {formatINR(fdr.depositAmountPaise)}
                  </td>
                  <td className="px-3 py-3 font-mono text-slate-600">
                    {fdr.maturityDate}
                  </td>
                  <td className="px-3 py-3">
                    <Badge
                      variant={
                        fdr.status === FDR_STATUS.REVIEW_ACCEPTED
                          ? 'green'
                          : fdr.status === FDR_STATUS.REVIEW_REJECTED
                          ? 'red'
                          : fdr.status === FDR_STATUS.UNDER_REVIEW
                          ? 'navy'
                          : fdr.status === FDR_STATUS.CLARIFICATION_REQUIRED
                          ? 'saffron'
                          : 'yellow'
                      }
                      size="sm"
                    >
                      {fdr.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      to={`/officer/fdr/${fdr.id}`}
                      variant="outline"
                      size="sm"
                      className="text-xs py-1 px-2.5"
                    >
                      Inspect Docket
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Institutions Registry Overview Table */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="p-0 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <span className="font-bold text-xs text-[#0B1F54] uppercase tracking-wider">
                Jurisdiction Institutions ({institutions.length})
              </span>
              <Link
                to="/officer/institutions"
                className="text-xs font-bold text-[#174EA6] hover:underline flex items-center gap-1"
              >
                <span>View Full Registry & Filter</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F5F7FB] border-b border-slate-200 text-[#505F79] font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Institution Name</th>
                    <th className="px-3 py-3">AISHE Code</th>
                    <th className="px-3 py-3">State</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[#0B1F54]">
                  {institutions.slice(0, 4).map((inst) => (
                    <tr key={inst.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-bold">{inst.name}</div>
                        <div className="text-[11px] text-[#505F79]">{inst.type}</div>
                      </td>
                      <td className="px-3 py-3 font-mono font-bold text-[#174EA6]">
                        {inst.aisheCode}
                      </td>
                      <td className="px-3 py-3">{inst.state}</td>
                      <td className="px-3 py-3">
                        <Badge variant={inst.status === 'active' ? 'green' : 'gray'} size="sm">
                          {inst.status === 'active' ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to={`/officer/institutions?inspect=${inst.id}`}
                          className="text-[#174EA6] font-semibold hover:underline"
                        >
                          Inspect Record
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Column: Scrutiny Audit Logs */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B1F54]">
                Scrutiny Audit Stream
              </h3>
              <Link to="/officer/activity" className="text-[11px] font-bold text-[#174EA6] hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-3">
              {recentAudits.map((log) => (
                <div key={log.id} className="text-xs border-b border-slate-50 pb-2 last:border-none">
                  <div className="font-semibold text-[#0B1F54]">{log.summary}</div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5 font-mono">
                    <span>{log.actorRole}</span>
                    <span>&bull;</span>
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
