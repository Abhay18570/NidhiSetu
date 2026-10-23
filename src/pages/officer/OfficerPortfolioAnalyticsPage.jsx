import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import {
  BarChart2,
  PieChart,
  TrendingUp,
  Clock,
  Layers,
  ShieldCheck,
  RefreshCw,
  Filter,
  AlertTriangle,
  Landmark,
  FileCheck2,
} from 'lucide-react';
import {
  computePortfolioTrends,
  computePortfolioMetrics,
  aggregatePortfolio,
  COMMAND_CENTER_PROTOTYPE_DISCLAIMER,
  BANK_SIMULATION_DISCLAIMER,
} from '../../commandCenter';

export default function OfficerPortfolioAnalyticsPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30D');
  const [trendData, setTrendData] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [portfolio, setPortfolio] = useState([]);

  const loadData = async (range) => {
    setLoading(true);
    try {
      const [trends, met, port] = await Promise.all([
        computePortfolioTrends(range),
        computePortfolioMetrics(),
        aggregatePortfolio(),
      ]);
      setTrendData(trends);
      setMetrics(met);
      setPortfolio(port.institutions);
    } catch (err) {
      console.error('[NidhiSetu Portfolio Analytics] Load failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(dateRange);
  }, [dateRange]);

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw className="w-8 h-8 text-[#0B1F54] animate-spin" />
        <p className="text-sm font-medium text-slate-600">
          Calculating portfolio analytics distributions and timelines...
        </p>
      </div>
    );
  }

  // Simulated Bank Outcome Counts
  const bankOutcomes = trendData?.distributions?.simulatedBankOutcomes || {
    CONFIRMED_LIEN: 0,
    UNCONFIRMED_LIEN: 0,
    FAILED_RESPONSE: 0,
    PENDING_RESPONSE: 0,
  };

  // Maturity Schedule
  const matSchedule = metrics?.maturitySchedule || {};

  return (
    <div className="space-y-6 pb-12">
      {/* Analytics Banner */}
      <div className="bg-[#0B1F54] text-white rounded-xl p-6 shadow-md border border-[#162E73] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#13805E] text-white uppercase tracking-wider">
              Portfolio Intelligence
            </span>
            <span className="text-xs text-slate-300 font-mono">
              RANGE: {dateRange}
            </span>
          </div>
          <h1 className="text-2xl font-bold mt-1 text-white">
            Portfolio Analytics & Trends
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Derived statistical distributions across deposit coverage, maturity horizons, review backlogs, and simulated verification outcomes.
          </p>
        </div>

        {/* Date Filter Buttons */}
        <div className="flex items-center gap-1.5 bg-white/10 p-1 rounded-lg">
          {['7D', '30D', '90D', 'ALL'].map((r) => (
            <button
              key={r}
              onClick={() => setDateRange(r)}
              className={`px-3 py-1 rounded text-xs font-semibold transition ${dateRange === r ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-200 hover:text-white'}`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Disclaimers */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-3.5 rounded-r-lg text-xs text-amber-900 space-y-0.5">
        <div className="font-semibold flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span>Analytics Integrity Notification</span>
        </div>
        <p>• {COMMAND_CENTER_PROTOTYPE_DISCLAIMER}</p>
        <p>• {BANK_SIMULATION_DISCLAIMER}</p>
      </div>

      {/* Top Distribution Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-xs font-semibold text-slate-500 uppercase">Total Submissions</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {trendData?.totals?.submissions || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">In selected period ({dateRange})</div>
        </Card>

        <Card className="p-4">
          <div className="text-xs font-semibold text-slate-500 uppercase">Reviews Completed</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">
            {trendData?.totals?.reviewsCompleted || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Scrutiny determinations</div>
        </Card>

        <Card className="p-4">
          <div className="text-xs font-semibold text-slate-500 uppercase">Renewals Submitted</div>
          <div className="text-2xl font-bold text-blue-700 mt-1">
            {trendData?.totals?.renewalsSubmitted || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Continuity requests</div>
        </Card>

        <Card className="p-4">
          <div className="text-xs font-semibold text-slate-500 uppercase">Simulated Confirmations</div>
          <div className="text-2xl font-bold text-purple-700 mt-1">
            {trendData?.totals?.simulatedBankResponses || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">[SIMULATED] Responses</div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Maturity Exposure Distribution (Bar Chart) */}
        <Card className="p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Maturity Horizon Exposure</h2>
              <p className="text-[11px] text-slate-500">Upcoming deposit maturity buckets</p>
            </div>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>

          <div className="mt-4 space-y-3">
            {[
              { label: '0–7 Days (Urgent)', count: matSchedule['0-7_DAYS'] || 0, color: 'bg-red-500' },
              { label: '8–30 Days (Upcoming)', count: matSchedule['8-30_DAYS'] || 0, color: 'bg-orange-500' },
              { label: '31–60 Days (Planning)', count: matSchedule['31-60_DAYS'] || 0, color: 'bg-amber-500' },
              { label: '61–90 Days (Standard)', count: matSchedule['61-90_DAYS'] || 0, color: 'bg-blue-500' },
              { label: 'Already Matured', count: matSchedule['MATURED'] || 0, color: 'bg-rose-700' },
            ].map((bar) => {
              const maxVal = Math.max(1, metrics?.totalFdrsCount || 5);
              const pct = Math.min(100, Math.round((bar.count / maxVal) * 100));
              return (
                <div key={bar.label} className="space-y-1 text-xs">
                  <div className="flex justify-between font-medium text-slate-700">
                    <span>{bar.label}</span>
                    <span className="font-bold">{bar.count} FDRs</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-3 rounded-full ${bar.color} transition-all duration-300`}
                      style={{ width: `${Math.max(4, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Chart 2: Simulated Bank Verification Outcomes */}
        <Card className="p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Simulated Bank Verification Outcomes</h2>
              <p className="text-[11px] text-slate-500">[SIMULATED] Mock SFMS / CBS status distribution</p>
            </div>
            <Landmark className="w-4 h-4 text-slate-400" />
          </div>

          <div className="mt-4 space-y-3">
            {[
              { label: 'Confirmed Lien Jointly Held', count: bankOutcomes.CONFIRMED_LIEN, color: 'bg-emerald-500' },
              { label: 'Lien Not Marked (Discrepancy)', count: bankOutcomes.UNCONFIRMED_LIEN, color: 'bg-red-500' },
              { label: 'Simulation Transmission Failed', count: bankOutcomes.FAILED_RESPONSE, color: 'bg-amber-500' },
              { label: 'Pending Bank Confirmation', count: bankOutcomes.PENDING_RESPONSE, color: 'bg-slate-400' },
            ].map((outcome) => {
              const total = Math.max(1, Object.values(bankOutcomes).reduce((a, b) => a + b, 0));
              const pct = Math.round((outcome.count / total) * 100);
              return (
                <div key={outcome.label} className="space-y-1 text-xs">
                  <div className="flex justify-between font-medium text-slate-700">
                    <span>{outcome.label}</span>
                    <span className="font-bold">{outcome.count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-3 rounded-full ${outcome.color} transition-all duration-300`}
                      style={{ width: `${Math.max(outcome.count > 0 ? 5 : 0, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 p-2.5 rounded bg-slate-50 border text-[11px] text-slate-600">
            Note: All banking figures are synthetic demonstration records generated through NidhiSetu Bank Registry.
          </div>
        </Card>
      </div>

      {/* Historical Activity Curve (Timeline Bars) */}
      <Card className="p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Daily Submission & Review Activity</h2>
            <p className="text-[11px] text-slate-500">Based on authentic record timestamps</p>
          </div>
          <BarChart2 className="w-4 h-4 text-slate-400" />
        </div>

        {!trendData?.isDataAvailable ? (
          <div className="text-center py-12 text-xs text-slate-400">
            {trendData?.dataNotice || 'Historical data unavailable for this date range.'}
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <div className="flex items-end gap-2 h-40 pt-6 px-2 min-w-[500px]">
              {trendData.timeline.slice(-14).map((bucket) => {
                const height = Math.min(100, (bucket.submissions + bucket.reviewsCompleted) * 20);
                return (
                  <div key={bucket.date} className="flex-1 flex flex-col items-center gap-1 group">
                    <div className="text-[9px] font-bold text-slate-600 group-hover:text-blue-700">
                      {bucket.submissions + bucket.reviewsCompleted}
                    </div>
                    <div className="w-full bg-slate-100 rounded-t h-28 flex items-end justify-center">
                      <div
                        className="w-full bg-blue-600 rounded-t transition-all duration-200 group-hover:bg-blue-700"
                        style={{ height: `${Math.max(4, height)}%` }}
                      />
                    </div>
                    <div className="text-[9px] text-slate-400 rotate-45 mt-2 origin-left">
                      {bucket.date.slice(5)}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 flex items-center justify-center gap-4 text-xs text-slate-600">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-blue-600 inline-block" /> Daily Activity Events
              </span>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
