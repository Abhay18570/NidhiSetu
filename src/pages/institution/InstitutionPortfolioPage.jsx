import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import {
  Building2,
  FileText,
  FileCheck2,
  RotateCcw,
  ShieldCheck,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  PlusCircle,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';
import {
  aggregateInstitutionPortfolio,
  COMMAND_CENTER_PROTOTYPE_DISCLAIMER,
} from '../../commandCenter';

export default function InstitutionPortfolioPage() {
  const { currentUser, currentInstitution } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [portfolio, setPortfolio] = useState(null);

  const institutionId = currentInstitution?.id || currentUser?.institutionId || 'inst-001';

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await aggregateInstitutionPortfolio(institutionId);
      setPortfolio(data);
    } catch (err) {
      console.error('[NidhiSetu Institution Portfolio] Load failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [institutionId]);

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw className="w-8 h-8 text-[#0B1F54] animate-spin" />
        <p className="text-sm font-medium text-slate-600">
          Loading institutional security deposit portfolio...
        </p>
      </div>
    );
  }

  const declaredRupees = ((portfolio?.declaredDepositAmountPaise || 0) / 100).toLocaleString('en-IN');
  const eligibleRupees = ((portfolio?.eligibleDepositAmountPaise || 0) / 100).toLocaleString('en-IN');
  const shortfallRupees = ((portfolio?.shortfallPaise || 0) / 100).toLocaleString('en-IN');

  return (
    <div className="space-y-6 pb-12">
      {/* Institution Banner */}
      <div className="bg-[#0B1F54] text-white rounded-xl p-6 shadow-md border border-[#162E73] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[0.6875rem] font-bold bg-[#13805E] text-white uppercase tracking-wider">
              Institutional Portfolio
            </span>
            <span className="text-xs text-slate-300 font-mono">
              ID: {institutionId}
            </span>
          </div>
          <h1 className="text-2xl font-bold mt-1 text-white">
            {portfolio?.institutionName || currentInstitution?.name || 'Institution Portfolio'}
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Single-pane view of your registered Fixed Deposit Receipts, active renewals, regulatory adequacy, and administrative releases.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/institution/applications')}
            className="bg-[#E89B24] hover:bg-[#d68a18] text-slate-900 font-semibold"
          >
            <PlusCircle className="w-4 h-4 mr-1.5" />
            Submit New FDR
          </Button>
        </div>
      </div>

      {/* Disclaimers Banner */}
      <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-lg text-xs text-amber-900 flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Notice: </span>
          {COMMAND_CENTER_PROTOTYPE_DISCLAIMER} Deposit adequacy is computed against declared norm requirements. Private regulatory review notes are isolated and not exposed to institutional users.
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase">Total FDR Records</span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{portfolio?.totalFdrs || 0}</div>
          <div className="text-[0.6875rem] text-slate-500 mt-1">
            {portfolio?.activeFdrs || 0} currently active & approved
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase">Declared Deposit Principal</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">₹{declaredRupees}</div>
          <div className="text-[0.6875rem] text-slate-500 mt-1">
            Eligible Coverage: ₹{eligibleRupees}
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase">Regulatory Adequacy</span>
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold">
            {portfolio?.shortfallPaise > 0 ? (
              <span className="text-red-600">Deficit: ₹{shortfallRupees}</span>
            ) : (
              <span className="text-emerald-600">Compliant</span>
            )}
          </div>
          <div className="text-[0.6875rem] text-slate-500 mt-1">
            {portfolio?.shortfallPaise > 0 ? 'Supplementary deposit required' : 'Meets AICTE norm criteria'}
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase">Active Renewals</span>
            <RotateCcw className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{portfolio?.activeRenewalCount || 0}</div>
          <div className="text-[0.6875rem] text-slate-500 mt-1">
            {portfolio?.maturedFdrs || 0} deposit(s) currently matured
          </div>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => navigate('/institution/applications')}
          className="p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-500 hover:shadow-md transition cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-50 text-blue-700">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">Submit New FDR</div>
              <div className="text-[0.6875rem] text-slate-500">Upload certificate & initiate review</div>
            </div>
          </div>
        </div>

        <div
          onClick={() => navigate('/institution/fdr-records')}
          className="p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-500 hover:shadow-md transition cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">View FDR Records</div>
              <div className="text-[0.6875rem] text-slate-500">Repository of all physical & e-FDRs</div>
            </div>
          </div>
        </div>

        <div
          onClick={() => navigate('/institution/renewals')}
          className="p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-500 hover:shadow-md transition cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-50 text-amber-700">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">Plan Renewal</div>
              <div className="text-[0.6875rem] text-slate-500">Manage maturity continuity</div>
            </div>
          </div>
        </div>

        <div
          onClick={() => navigate('/institution/compliance')}
          className="p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-500 hover:shadow-md transition cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-50 text-purple-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">View Compliance</div>
              <div className="text-[0.6875rem] text-slate-500">Check adequacy against norms</div>
            </div>
          </div>
        </div>
      </div>

      {/* Institutional FDR Records Summary Table */}
      <Card className="p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Registered Security Deposit Certificates</h2>
            <p className="text-[0.6875rem] text-slate-500">Strictly isolated institutional portfolio</p>
          </div>
          <Link
            to="/institution/fdr-records"
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
          >
            All Certificates <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Certificate Number</th>
                <th className="py-2.5 px-3">Bank Name</th>
                <th className="py-2.5 px-3">Principal Amount</th>
                <th className="py-2.5 px-3">Maturity Date</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {!portfolio?.rawEntities?.fdrs || portfolio.rawEntities.fdrs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-slate-400">
                    No FDR records submitted yet. Click "Submit New FDR" above to start.
                  </td>
                </tr>
              ) : (
                portfolio.rawEntities.fdrs.map((fdr) => (
                  <tr key={fdr.id || fdr.fdrId} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {fdr.fdrNumber}
                    </td>
                    <td className="py-2.5 px-3">{fdr.bankName}</td>
                    <td className="py-2.5 px-3 font-semibold">
                      ₹{((fdr.depositAmountPaise || fdr.amountPaise || 0) / 100).toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3">{fdr.maturityDate || 'N/A'}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[0.625rem] font-bold bg-slate-100 text-slate-800">
                        {fdr.status || fdr.lifecycleStatus}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Link
                        to={`/institution/fdr-records`}
                        className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
