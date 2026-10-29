import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import {
  Building2,
  FileCheck2,
  TrendingUp,
  Clock,
  ScrollText,
  Landmark,
  ShieldCheck,
  RotateCcw,
  AlertTriangle,
  ArrowLeft,
  ExternalLink,
  Download,
  FileText,
  Calendar,
  Layers,
  RefreshCw,
  HelpCircle,
} from 'lucide-react';
import {
  buildInstitutionIntelligenceDossier,
  buildExecutiveReport,
  exportReportToCSV,
  exportReportToJSON,
  REPORT_TYPES,
  COMMAND_CENTER_PROTOTYPE_DISCLAIMER,
  BANK_SIMULATION_DISCLAIMER,
} from '../../commandCenter';

export default function OfficerInstitutionIntelligencePage() {
  const { institutionId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [dossier, setDossier] = useState(null);
  const [officerNote, setOfficerNote] = useState('');
  const [savedNotes, setSavedNotes] = useState([
    {
      id: 'NOTE-1',
      author: 'Scrutiny Officer West',
      text: 'Verified declared FDR parameters against current approval norms. No structural encumbrance observed.',
      date: '2026-03-01T11:00:00.000Z',
    },
  ]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await buildInstitutionIntelligenceDossier(institutionId);
      setDossier(data);
    } catch (err) {
      console.error('[NidhiSetu Dossier] Load failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [institutionId]);

  const handleAddNote = () => {
    if (!officerNote.trim()) return;
    setSavedNotes([
      {
        id: `NOTE-${Date.now()}`,
        author: currentUser?.fullName || currentUser?.email || 'Officer',
        text: officerNote,
        date: new Date().toISOString(),
      },
      ...savedNotes,
    ]);
    setOfficerNote('');
  };

  const handleExportJSON = async () => {
    const report = await buildExecutiveReport(REPORT_TYPES.INSTITUTION_INTELLIGENCE, {
      institutionId,
    });
    const blob = new Blob([exportReportToJSON(report)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Institution_Intelligence_${institutionId}.json`;
    a.click();
  };

  const handleExportCSV = async () => {
    const report = await buildExecutiveReport(REPORT_TYPES.INSTITUTION_INTELLIGENCE, {
      institutionId,
    });
    const blob = new Blob([exportReportToCSV(report)], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Institution_Intelligence_${institutionId}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw className="w-8 h-8 text-[#0B1F54] animate-spin" />
        <p className="text-sm font-medium text-slate-600">
          Synthesizing 360-degree regulatory intelligence dossier...
        </p>
      </div>
    );
  }

  if (!dossier) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Institution Dossier Not Found</h2>
        <p className="text-sm text-slate-500">
          No records matching institution ID: {institutionId}
        </p>
        <Button variant="outline" onClick={() => navigate('/officer/command-center')}>
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Return to Command Center
        </Button>
      </div>
    );
  }

  const { institution, portfolioSummary, riskPriority, evidenceTimeline } = dossier;

  return (
    <div className="space-y-6 pb-16">
      {/* Back Button & Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/officer/command-center')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Command Center
        </button>

        {/* Section L: Report Export */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCSV}
            className="text-xs"
          >
            <Download className="w-3.5 h-3.5 mr-1" /> Export CSV
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportJSON}
            className="text-xs"
          >
            <Download className="w-3.5 h-3.5 mr-1" /> Export JSON
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.print()}
            className="text-xs"
          >
            <FileText className="w-3.5 h-3.5 mr-1" /> Print Dossier
          </Button>
        </div>
      </div>

      {/* SECTION A: Institution Profile Banner */}
      <div className="bg-[#0B1F54] text-white rounded-xl p-6 shadow-md border border-[#162E73]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[0.6875rem] font-bold bg-[#E89B24] text-slate-900 uppercase tracking-wider">
                Regulatory Dossier
              </span>
              <span className="text-xs text-slate-300 font-mono">
                {institution.registrationNumber}
              </span>
            </div>
            <h1 className="text-2xl font-bold mt-1 text-white">{institution.name}</h1>
            <p className="text-xs text-slate-300 mt-1">
              Category: {institution.category} • {institution.district}, {institution.state} • Contact: {institution.contactEmail}
            </p>
          </div>
          <div className="p-3 bg-white/10 rounded-xl border border-white/20 text-center shrink-0">
            <div className="text-[0.625rem] uppercase font-bold text-slate-300">
              Explainable Risk Priority
            </div>
            <div className="text-xl font-bold mt-0.5 text-amber-300">
              {riskPriority?.priority}
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimers Banner */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg text-xs text-amber-900 space-y-1">
        <div className="font-semibold flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span>Statutory Safeguard & Prototype Notification</span>
        </div>
        <p>• {COMMAND_CENTER_PROTOTYPE_DISCLAIMER}</p>
        <p>• {BANK_SIMULATION_DISCLAIMER}</p>
      </div>

      {/* SECTION B & C: FDR Portfolio & Declared Deposit Coverage */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-xs text-slate-500 uppercase font-semibold">Total Declared Principal</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            ₹{((portfolioSummary.declaredDepositAmountPaise || 0) / 100).toLocaleString('en-IN')}
          </div>
          <div className="text-[0.6875rem] text-slate-500 mt-1">
            Across {portfolioSummary.totalFdrs} registered certificate(s)
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-xs text-slate-500 uppercase font-semibold">Eligible Coverage</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">
            ₹{((portfolioSummary.eligibleDepositAmountPaise || 0) / 100).toLocaleString('en-IN')}
          </div>
          <div className="text-[0.6875rem] text-slate-500 mt-1">
            Excludes {portfolioSummary.supersededCount} superseded FDR(s)
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-xs text-slate-500 uppercase font-semibold">Adequacy Shortfall</div>
          <div className="text-2xl font-bold mt-1">
            {portfolioSummary.hasShortfall ? (
              <span className="text-red-600">
                -₹{((portfolioSummary.shortfallPaise || 0) / 100).toLocaleString('en-IN')}
              </span>
            ) : (
              <span className="text-emerald-600">Adequate</span>
            )}
          </div>
          <div className="text-[0.6875rem] text-slate-500 mt-1">
            Evaluation under active norm rules
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-xs text-slate-500 uppercase font-semibold">Matured Deposits</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {portfolioSummary.maturedFdrs}
          </div>
          <div className="text-[0.6875rem] text-slate-500 mt-1">
            {portfolioSummary.activeFdrs} certificates active
          </div>
        </Card>
      </div>

      {/* Risk Priority Rationale Card */}
      <Card className="p-5 border-l-4 border-l-blue-600">
        <h3 className="text-sm font-bold text-slate-900">
          Deterministic Risk Priority Explanation
        </h3>
        <p className="text-xs text-slate-700 mt-1">{riskPriority?.explanation}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {riskPriority?.triggeringSignals.map((sig, idx) => (
            <span key={idx} className="px-2 py-0.5 rounded text-[0.625rem] font-semibold bg-slate-100 text-slate-800 border">
              {sig}
            </span>
          ))}
        </div>
        <div className="mt-3 p-2.5 rounded bg-blue-50 text-blue-900 text-xs">
          <span className="font-semibold">Recommended Regulatory Action: </span>
          {riskPriority?.recommendedNextAction}
        </div>
      </Card>

      {/* SECTION D: FDR Records Dossier */}
      <Card className="p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">Registered FDR Portfolio</h3>
          <span className="text-xs text-slate-500 font-mono">
            {dossier.fdrs.length} Records
          </span>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold">
              <tr>
                <th className="py-2 px-3">FDR Number</th>
                <th className="py-2 px-3">Bank Name</th>
                <th className="py-2 px-3">Principal Amount</th>
                <th className="py-2 px-3">Maturity Date</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dossier.fdrs.map((fdr) => (
                <tr key={fdr.id || fdr.fdrId}>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">
                    {fdr.fdrNumber}
                    {fdr.isSuperseded && (
                      <span className="ml-2 text-[0.625rem] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">
                        Superseded
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">{fdr.bankName}</td>
                  <td className="py-2.5 px-3 font-semibold">
                    ₹{((fdr.depositAmountPaise || fdr.amountPaise || 0) / 100).toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 px-3">{fdr.maturityDate}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[0.625rem] font-bold bg-slate-100 text-slate-700">
                      {fdr.status || fdr.lifecycleStatus}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <Link
                      to={fdr.destinationRoute}
                      className="text-blue-600 hover:underline font-semibold"
                    >
                      Inspect
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* SECTION E & F: Document Findings & Simulated Bank Verification History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Document Findings */}
        <Card className="p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Document Intelligence OCR Findings</h3>
              <p className="text-[0.6875rem] text-slate-500">Scanned receipt anomaly detection</p>
            </div>
            <ScrollText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-3 space-y-2">
            {dossier.documentFindings.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">
                No OCR anomalies flagged.
              </div>
            ) : (
              dossier.documentFindings.map((f, idx) => (
                <div key={idx} className="p-2.5 rounded bg-slate-50 border text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">{f.findingType || 'OCR Discrepancy'}</span>
                    <span className="text-[0.625rem] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                      {f.severity || 'MEDIUM'}
                    </span>
                  </div>
                  <p className="text-[0.6875rem] text-slate-600">{f.description || f.message}</p>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Simulated Bank Verification History */}
        <Card className="p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Simulated Bank Confirmations</h3>
              <p className="text-[0.6875rem] text-slate-500">Synthetic SFMS / CBS confirmation logs</p>
            </div>
            <Landmark className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-3 space-y-2">
            {dossier.bankVerifications.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">
                No bank confirmation requests logged.
              </div>
            ) : (
              dossier.bankVerifications.map((bv) => (
                <div key={bv.id || bv.requestId} className="p-2.5 rounded bg-slate-50 border text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">
                      {bv.bankName} [SIMULATED]
                    </span>
                    <span className={`text-[0.625rem] font-bold px-1.5 py-0.5 rounded ${bv.lienMarked ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                      {bv.lienMarked ? 'Lien Confirmed' : 'Lien Not Marked'}
                    </span>
                  </div>
                  <div className="text-[0.625rem] text-slate-500">Ref: {bv.cbsReferenceNumber || 'CBS-MOCK'}</div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* SECTION J: Unified Evidence Timeline */}
      <Card className="p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Unified Cross-Module Evidence Timeline</h3>
            <p className="text-[0.6875rem] text-slate-500">Chronological history from Modules 03 through 07</p>
          </div>
          <Calendar className="w-4 h-4 text-slate-400" />
        </div>
        <div className="mt-4 divide-y divide-slate-100">
          {evidenceTimeline.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              No historical timeline events recorded.
            </div>
          ) : (
            evidenceTimeline.slice(0, 10).map((evt) => (
              <div key={evt.eventId} className="py-2.5 flex items-start gap-3 text-xs">
                <span className="text-[0.625rem] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono shrink-0 mt-0.5">
                  {new Date(evt.timestamp).toISOString().split('T')[0]}
                </span>
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-800">{evt.summary}</div>
                  <div className="text-[0.625rem] text-slate-500">
                    Actor: {evt.actor} • Type: {evt.eventType} • Module: {evt.sourceModule}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* SECTION K: Officer Notes & Follow-ups */}
      <Card className="p-5">
        <h3 className="text-sm font-bold text-slate-900 mb-2">Officer Follow-Up Observations</h3>
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Record operational officer follow-up note..."
              value={officerNote}
              onChange={(e) => setOfficerNote(e.target.value)}
              className="flex-1 p-2 text-xs border border-slate-300 rounded-lg bg-white"
            />
            <Button size="sm" variant="primary" onClick={handleAddNote} className="bg-[#0B1F54] text-white">
              Save Note
            </Button>
          </div>

          <div className="space-y-2 mt-3">
            {savedNotes.map((note) => (
              <div key={note.id} className="p-2.5 rounded bg-slate-50 border text-xs">
                <div className="flex items-center justify-between font-semibold text-slate-800 text-[0.6875rem]">
                  <span>{note.author}</span>
                  <span className="text-slate-400">{new Date(note.date).toLocaleString()}</span>
                </div>
                <p className="text-slate-700 mt-1">{note.text}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
