import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import {
  Sliders,
  Play,
  CheckCircle2,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Sparkles,
  Info,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import {
  demoScenarioOrchestrator,
  COMMAND_CENTER_PROTOTYPE_DISCLAIMER,
  BANK_SIMULATION_DISCLAIMER,
} from '../../commandCenter';

export default function AdminDemoCenterPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [scenarios, setScenarios] = useState([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState('SIH-SCN-01');
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await demoScenarioOrchestrator.getScenarios();
      setScenarios(list || []);
      if (list && list.length > 0 && !selectedScenarioId) {
        setSelectedScenarioId(list[0].id || list[0].scenarioId);
      }
    } catch (err) {
      console.error('[NidhiSetu Demo Center] Load failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedScenario =
    scenarios.find((s) => (s.id || s.scenarioId) === selectedScenarioId) || scenarios[0];

  const handleAdvanceStep = async () => {
    if (!selectedScenario) return;
    const current = selectedScenario.currentStep || 0;
    const updated = await demoScenarioOrchestrator.advanceScenarioStep(
      selectedScenario.id || selectedScenario.scenarioId,
      current
    );
    if (updated) {
      setScenarios((prev) =>
        prev.map((s) => ((s.id || s.scenarioId) === (updated.id || updated.scenarioId) ? updated : s))
      );
    }
  };

  const handleResetCurrentScenario = async () => {
    if (!selectedScenario) return;
    const updated = await demoScenarioOrchestrator.resetScenario(
      selectedScenario.id || selectedScenario.scenarioId
    );
    if (updated) {
      setScenarios((prev) =>
        prev.map((s) => ((s.id || s.scenarioId) === (updated.id || updated.scenarioId) ? updated : s))
      );
    }
  };

  const handleResetAll = async () => {
    await demoScenarioOrchestrator.resetAllScenarios();
    setResetConfirmOpen(false);
    await loadData();
  };

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw className="w-8 h-8 text-[#0B1F54] animate-spin" />
        <p className="text-sm font-medium text-slate-600">
          Initializing Smart India Hackathon demonstration environment...
        </p>
      </div>
    );
  }

  const currentStep = selectedScenario?.currentStep || 0;
  const totalSteps = selectedScenario?.guidedSteps?.length || 0;

  return (
    <div className="space-y-6 pb-16">
      {/* SIH Demo Header */}
      <div className="bg-[#0B1F54] text-white rounded-xl p-6 shadow-md border border-[#162E73] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#E89B24] text-slate-900 uppercase tracking-wider">
              Smart India Hackathon
            </span>
            <span className="text-xs text-slate-300 font-mono">
              10 EVALUATOR DEMO SCENARIOS
            </span>
          </div>
          <h1 className="text-2xl font-bold mt-1 text-white">
            SIH Demonstration & Evaluator Center
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Interactive walkthrough workspace designed for Hackathon Jury review. Demonstrates end-to-end integration across all 8 modules using safe synthetic fixtures.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setResetConfirmOpen(true)}
            className="text-white border-white/20 hover:bg-white/10"
          >
            <RotateCcw className="w-4 h-4 mr-1.5" />
            Reset All Scenarios
          </Button>
        </div>
      </div>

      {/* Disclaimers Banner */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg text-xs text-amber-900 space-y-1">
        <div className="font-semibold flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span>Non-Destructive Simulation Guarantee</span>
        </div>
        <p>• {COMMAND_CENTER_PROTOTYPE_DISCLAIMER}</p>
        <p>• {BANK_SIMULATION_DISCLAIMER}</p>
        <p>• Advancing or resetting demo scenarios never modifies real user-created dockets.</p>
      </div>

      {/* Two Column Layout: Scenarios List + Active Walkthrough */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: 10 Scenarios Selector */}
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
            Guided Scenarios (1 to 10)
          </div>
          <div className="space-y-1.5">
            {scenarios.map((scn, index) => {
              const scnId = scn.id || scn.scenarioId;
              const isSelected = scnId === (selectedScenario?.id || selectedScenario?.scenarioId);
              const isCompleted = scn.isCompleted;

              return (
                <div
                  key={scnId}
                  onClick={() => setSelectedScenarioId(scnId)}
                  className={`p-3 rounded-xl border transition cursor-pointer text-left ${isSelected ? 'bg-blue-50 border-blue-600 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      {scn.title}
                    </span>
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono shrink-0">
                        {scn.sourceModule?.replace('MODULE_', 'M')}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                    {scn.category}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Scenario Execution Dossier */}
        <div className="lg:col-span-2 space-y-5">
          {selectedScenario ? (
            <Card className="p-6 space-y-6">
              {/* Scenario Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-900 uppercase">
                    {selectedScenario.category}
                  </span>
                  <h2 className="text-xl font-bold text-slate-900 mt-1">
                    {selectedScenario.title}
                  </h2>
                  <p className="text-xs text-slate-600 mt-1">
                    {selectedScenario.description}
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleResetCurrentScenario}
                    className="text-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset Steps
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => navigate(selectedScenario.targetRoute)}
                    className="bg-[#0B1F54] text-white text-xs"
                  >
                    Open Workflow <ExternalLink className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </div>

              {/* Guided Step Walkthrough */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Guided Evaluator Steps:</span>
                  <span className="font-mono text-blue-700">
                    Step {Math.min(currentStep, totalSteps)} of {totalSteps}
                  </span>
                </div>

                <div className="space-y-2">
                  {selectedScenario.guidedSteps?.map((stepText, idx) => {
                    const stepNum = idx + 1;
                    const isDone = currentStep >= stepNum;
                    const isCurrent = currentStep === idx;

                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border text-xs flex items-start gap-3 transition ${isDone ? 'bg-emerald-50/50 border-emerald-200 text-slate-800' : isCurrent ? 'bg-blue-50/70 border-blue-400 font-medium text-slate-900 shadow-xs' : 'bg-slate-50 border-slate-200 text-slate-500'}`}
                      >
                        <div className="shrink-0 mt-0.5">
                          {isDone ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${isCurrent ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                              {stepNum}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">{stepText}</div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={handleAdvanceStep}
                    className="bg-[#13805E] hover:bg-[#0f6a4e] text-white text-xs"
                  >
                    Advance Step <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>

              {/* Expected Observable Outcome Box */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Expected Observable Outcome for Evaluators:</span>
                </div>
                <p className="text-xs text-slate-700 font-medium">
                  {selectedScenario.expectedOutcome}
                </p>
                <div className="text-[10px] text-slate-400 font-mono mt-1">
                  Destination Target Route: {selectedScenario.targetRoute}
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-8 text-center text-slate-400 text-xs">
              Select a demonstration scenario from the left to begin walkthrough.
            </Card>
          )}
        </div>
      </div>

      {/* Confirmation Modal for Reset All */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Reset All Demonstration Scenarios?
            </h3>
            <p className="text-xs text-slate-600">
              This will restore all 10 scenario progress trackers to step 0. Underlying user-created records in localStorage remain untouched.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button size="sm" variant="outline" onClick={() => setResetConfirmOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" variant="primary" onClick={handleResetAll} className="bg-red-700 text-white">
                Confirm Reset
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
