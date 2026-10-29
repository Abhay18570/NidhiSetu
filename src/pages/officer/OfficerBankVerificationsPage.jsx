import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import {
  bankVerificationRepository,
  fdrRepository,
  formatINR,
} from '../../storage';
import { bankRegistry } from '../../banking/bankRegistry';
import { SIMULATION_SCENARIOS } from '../../banking/bankScenarioFixtures';
import { SIMULATION_DISCLAIMER } from '../../banking/bankMessageSchema';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import {
  Landmark,
  ShieldAlert,
  Search,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ChevronRight,
  Info,
  X,
  Play,
} from 'lucide-react';

export default function OfficerBankVerificationsPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [banks, setBanks] = useState([]);
  const [allFdrs, setAllFdrs] = useState([]);
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    responsesReceived: 0,
    requiresFollowUp: 0,
    completedReviews: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [reviewFilter, setReviewFilter] = useState('ALL');
  const [bankFilter, setBankFilter] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFdrId, setSelectedFdrId] = useState('');
  const [selectedBankId, setSelectedBankId] = useState('');
  const [selectedScenarioId, setSelectedScenarioId] = useState('SCENARIO_A_EXACT_MATCH');
  const [officerReason, setOfficerReason] = useState('Mandatory regulatory FDR existence and lien verification.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [allReqs, bankList, fdrs, kpis] = await Promise.all([
        bankVerificationRepository.getAllRequests(),
        bankRegistry.getAllBanks(),
        fdrRepository.getAllFDRs(),
        bankVerificationRepository.getOfficerDashboardStats(),
      ]);

      setRequests(allReqs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      setBanks(bankList);
      setAllFdrs(fdrs.filter((f) => f.status !== 'DRAFT'));
      setStats(kpis);

      if (bankList.length > 0 && !selectedBankId) {
        setSelectedBankId(bankList[0].bankId);
      }
      if (fdrs.length > 0 && !selectedFdrId) {
        setSelectedFdrId(fdrs[0].id);
      }
    } catch (err) {
      console.error('Error loading bank verification data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered list
  const filteredRequests = requests.filter((r) => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      r.requestReference?.toLowerCase().includes(q) ||
      r.fdrNumber?.toLowerCase().includes(q) ||
      r.fdrReference?.toLowerCase().includes(q) ||
      r.institutionName?.toLowerCase().includes(q) ||
      r.bankName?.toLowerCase().includes(q);

    const matchStatus = statusFilter === 'ALL' || r.requestStatus === statusFilter;
    const matchReview = reviewFilter === 'ALL' || r.reviewStatus === reviewFilter;
    const matchBank = bankFilter === 'ALL' || r.simulatorBankId === bankFilter;

    return matchSearch && matchStatus && matchReview && matchBank;
  });

  // Handle Form Submit
  const handleCreateVerification = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!selectedFdrId) {
      setModalError('Please select a valid FDR instrument to verify.');
      return;
    }
    if (!selectedBankId) {
      setModalError('Please select a target synthetic bank simulator.');
      return;
    }
    if (!officerReason.trim()) {
      setModalError('Please specify an official reason or audit reference for this inquiry.');
      return;
    }

    const fdr = allFdrs.find((f) => f.id === selectedFdrId);
    if (!fdr) {
      setModalError('Selected FDR could not be found.');
      return;
    }

    const bank = banks.find((b) => b.bankId === selectedBankId);

    setIsSubmitting(true);
    try {
      // 1. Create request record
      const newReq = await bankVerificationRepository.createVerificationRequest({
        fdrId: fdr.id,
        fdrReference: fdr.referenceNumber,
        institutionId: fdr.institutionId,
        institutionName: fdr.institutionName || 'Affiliated Technical Institution',
        simulatorBankId: bank.bankId,
        bankName: bank.displayName,
        fdrNumber: fdr.fdrNumber,
        declaredAmountPaise: fdr.depositAmountPaise,
        depositDate: fdr.depositDate,
        maturityDate: fdr.maturityDate,
        accountHolderName: fdr.accountHolderName,
        requestedVerificationTypes: bank.supportedVerificationTypes,
        officerReason: officerReason.trim(),
        officerId: currentUser?.id || 'usr-demo-officer-01',
        scenarioId: selectedScenarioId,
      });

      // 2. Automatically trigger simulation processing
      await bankVerificationRepository.processVerificationRequest(newReq.requestId, {
        scenarioId: selectedScenarioId,
      });

      setIsModalOpen(false);
      await loadData();
      navigate(`/officer/bank-verifications/${newReq.requestId}`);
    } catch (err) {
      setModalError(err.message || 'Failed to initialize verification inquiry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getVerdictBadge = (scorecard) => {
    if (!scorecard) return <Badge variant="neutral">Pending Evaluation</Badge>;
    if (scorecard.verificationVerdict === 'CONSISTENT_WITH_SIMULATION') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Consistent with Simulation
        </span>
      );
    }
    if (scorecard.verificationVerdict === 'DISCREPANCIES_DETECTED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <AlertTriangle className="w-3.5 h-3.5" />
          Discrepancies Detected
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
        <Clock className="w-3.5 h-3.5" />
        Indeterminate
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* SIMULATION MANDATORY DISCLAIMER BANNER */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl shadow-xs">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <span className="font-bold uppercase tracking-wider block text-amber-800 text-[0.6875rem]">
              {SIMULATION_DISCLAIMER}
            </span>
            This workspace provides a client-side synthetic simulation of institutional commercial bank deposit
            confirmations and regulatory lien inquiries. No actual SFMS interbank messages or CBS integrations are
            performed.
          </div>
        </div>
      </div>

      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0B1F54] flex items-center gap-2">
            <Landmark className="w-6 h-6 text-[#174EA6]" />
            Bank Confirmation & Lien Simulation
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Simulate SFMS-modeled bank deposit confirmation inquiries and verify institutional encumbrance clauses.
          </p>
        </div>
        <div>
          <Button
            variant="primary"
            icon={PlusCircle}
            onClick={() => {
              setModalError('');
              setIsModalOpen(true);
            }}
            className="shadow-sm"
          >
            New Verification Request
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-[#174EA6] space-y-1">
          <div className="text-[0.6875rem] font-bold text-slate-400 uppercase tracking-wider">
            Total Inquiries
          </div>
          <div className="text-2xl font-black text-[#0B1F54]">{stats.totalRequests}</div>
          <div className="text-[0.6875rem] text-slate-500">Initiated simulation records</div>
        </Card>

        <Card className="p-4 border-l-4 border-l-amber-500 space-y-1">
          <div className="text-[0.6875rem] font-bold text-slate-400 uppercase tracking-wider">
            Pending / In Flight
          </div>
          <div className="text-2xl font-black text-amber-600">{stats.pendingRequests}</div>
          <div className="text-[0.6875rem] text-slate-500">Awaiting simulator turnaround</div>
        </Card>

        <Card className="p-4 border-l-4 border-l-emerald-600 space-y-1">
          <div className="text-[0.6875rem] font-bold text-slate-400 uppercase tracking-wider">
            Responses Received
          </div>
          <div className="text-2xl font-black text-emerald-600">{stats.responsesReceived}</div>
          <div className="text-[0.6875rem] text-slate-500">Available for officer review</div>
        </Card>

        <Card className="p-4 border-l-4 border-l-rose-500 space-y-1">
          <div className="text-[0.6875rem] font-bold text-slate-400 uppercase tracking-wider">
            Requires Follow-Up
          </div>
          <div className="text-2xl font-black text-rose-600">{stats.requiresFollowUp}</div>
          <div className="text-[0.6875rem] text-slate-500">Flagged with discrepancies</div>
        </Card>
      </div>

      {/* Search & Filter Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by BVR ref, FDR #, bank..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#174EA6]/20 focus:border-[#174EA6]"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#174EA6]/20 focus:border-[#174EA6]"
            >
              <option value="ALL">All Request Statuses</option>
              <option value="REQUESTED">Requested (Queued)</option>
              <option value="PROCESSING">Processing</option>
              <option value="RESPONSE_RECEIVED">Response Received</option>
              <option value="RESPONSE_FAILED">Response Failed</option>
            </select>
          </div>

          <div>
            <select
              value={reviewFilter}
              onChange={(e) => setReviewFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#174EA6]/20 focus:border-[#174EA6]"
            >
              <option value="ALL">All Review Statuses</option>
              <option value="PENDING_REVIEW">Pending Review</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="REVIEW_COMPLETED">Review Completed</option>
              <option value="REQUIRES_FOLLOW_UP">Requires Follow-Up</option>
            </select>
          </div>

          <div>
            <select
              value={bankFilter}
              onChange={(e) => setBankFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#174EA6]/20 focus:border-[#174EA6]"
            >
              <option value="ALL">All Synthetic Banks</option>
              {banks.map((b) => (
                <option key={b.bankId} value={b.bankId}>
                  {b.displayName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Requests Table */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="text-xs font-bold text-[#0B1F54] uppercase tracking-wider">
            Verification Inquiries ({filteredRequests.length})
          </div>
          <button
            onClick={loadData}
            className="text-xs text-[#174EA6] hover:underline flex items-center gap-1 font-semibold"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Refresh List
          </button>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Landmark className="w-10 h-10 text-slate-300 mx-auto" />
            <div className="text-sm font-bold text-slate-700">No bank confirmation requests found</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No verification records match your active search filters, or none have been initiated yet.
            </p>
            <Button
              variant="outline"
              size="sm"
              icon={PlusCircle}
              onClick={() => setIsModalOpen(true)}
            >
              Create First Verification Inquiry
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-slate-200 text-slate-600 font-bold uppercase text-[0.625rem] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Request Ref</th>
                  <th className="py-3 px-4">FDR Instrument</th>
                  <th className="py-3 px-4">Synthetic Bank</th>
                  <th className="py-3 px-4">Scenario</th>
                  <th className="py-3 px-4">Request Status</th>
                  <th className="py-3 px-4">Review Status</th>
                  <th className="py-3 px-4">Simulation Verdict</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.map((req) => (
                  <tr key={req.requestId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-[#174EA6]">{req.requestReference}</div>
                      <div className="text-[0.625rem] text-slate-400">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-[#0B1F54]">{req.fdrNumber}</div>
                      <div className="text-[0.6875rem] text-slate-500 truncate max-w-[11.25rem]">
                        {req.institutionName}
                      </div>
                      <div className="text-[0.625rem] text-emerald-700 font-semibold">
                        {formatINR(req.declaredAmountPaise, true)}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{req.bankName}</div>
                      <span className="inline-block text-[0.625rem] font-mono text-slate-400">
                        {req.simulatorBankId}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[0.6875rem] font-semibold bg-slate-100 text-slate-700">
                        {req.scenarioId ? req.scenarioId.replace('SCENARIO_', '') : 'EXACT_MATCH'}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      {req.requestStatus === 'RESPONSE_RECEIVED' ? (
                        <span className="px-2 py-0.5 rounded-full text-[0.625rem] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          RESPONSE RECEIVED
                        </span>
                      ) : req.requestStatus === 'RESPONSE_FAILED' ? (
                        <span className="px-2 py-0.5 rounded-full text-[0.625rem] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          RESPONSE FAILED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[0.625rem] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          {req.requestStatus}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {req.reviewStatus === 'REVIEW_COMPLETED' ? (
                        <span className="px-2 py-0.5 rounded-full text-[0.625rem] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          REVIEW COMPLETED
                        </span>
                      ) : req.reviewStatus === 'REQUIRES_FOLLOW_UP' ? (
                        <span className="px-2 py-0.5 rounded-full text-[0.625rem] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          REQUIRES FOLLOW-UP
                        </span>
                      ) : req.reviewStatus === 'UNDER_REVIEW' ? (
                        <span className="px-2 py-0.5 rounded-full text-[0.625rem] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          UNDER REVIEW
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[0.625rem] font-bold bg-slate-100 text-slate-600">
                          PENDING REVIEW
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">{getVerdictBadge(req.summaryScorecard)}</td>

                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/officer/bank-verifications/${req.requestId}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-[#174EA6] bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
                      >
                        <span>Open Dossier</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* NEW VERIFICATION INQUIRY MODAL WIZARD */}
      {isModalOpen && (
        <div className="app-modal fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#0B1F54] flex items-center gap-2">
                  <Landmark className="w-5 h-5 text-[#174EA6]" />
                  Initiate Simulated Bank Confirmation Inquiry
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select an active institution FDR, target simulator profile, and demonstration scenario.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateVerification} className="p-5 space-y-4">
              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Simulation Notice */}
              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-[#174EA6] shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  <strong>Simulation Boundary:</strong> This action dispatches a mock confirmation request into
                  NidhiSetu's browser-local simulation engine. No real banking endpoints are contacted.
                </span>
              </div>

              {/* Step 1: Select FDR */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#0B1F54]">
                  Target FDR Instrument <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedFdrId}
                  onChange={(e) => setSelectedFdrId(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#174EA6]/20 focus:border-[#174EA6]"
                >
                  {allFdrs.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.referenceNumber} — {f.fdrNumber} ({f.bankName}) — {formatINR(f.depositAmountPaise, true)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2: Target Synthetic Bank */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#0B1F54]">
                  Issuing Bank Simulator Profile <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedBankId}
                  onChange={(e) => setSelectedBankId(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#174EA6]/20 focus:border-[#174EA6]"
                >
                  {banks.map((b) => (
                    <option key={b.bankId} value={b.bankId}>
                      {b.displayName} [{b.bankCode}] — Delay: {b.mockResponseDelay}ms
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 3: Simulation Scenario */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#0B1F54]">
                  Deterministic Demonstration Scenario <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedScenarioId}
                  onChange={(e) => setSelectedScenarioId(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#174EA6]/20 focus:border-[#174EA6]"
                >
                  {Object.values(SIMULATION_SCENARIOS).map((sc) => (
                    <option key={sc.id} value={sc.id}>
                      {sc.title} ({sc.expectedOutcome})
                    </option>
                  ))}
                </select>
                <p className="text-[0.6875rem] text-slate-500 italic">
                  {SIMULATION_SCENARIOS[selectedScenarioId]?.description}
                </p>
              </div>

              {/* Step 4: Official Reason */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#0B1F54]">
                  Official Scrutiny Reason / Audit Justification <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={officerReason}
                  onChange={(e) => setOfficerReason(e.target.value)}
                  placeholder="Enter statutory justification for triggering verification..."
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#174EA6]/20 focus:border-[#174EA6]"
                />
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  icon={Play}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Transmitting to Simulator...' : 'Send to Bank Simulator'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
