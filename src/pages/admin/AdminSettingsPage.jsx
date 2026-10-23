import { useState } from 'react';
import { resetDemoState } from '../../storage/migrations';
import { auditRepository } from '../../storage/auditRepository';
import { useAuth } from '../../context/useAuth';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { RotateCcw, AlertTriangle, CheckCircle2, HardDrive, Shield } from 'lucide-react';

export default function AdminSettingsPage() {
  const { currentUser } = useAuth();
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleResetDemo = async () => {
    resetDemoState();
    await auditRepository.logEvent({
      eventType: 'DEMO_DATA_RESET',
      actorId: currentUser?.id || 'admin',
      actorRole: 'admin',
      targetEntityId: 'storage',
      summary: 'Administrator initiated reset of demo localStorage records to initial synthetic baseline',
    });

    setResetConfirmOpen(false);
    setSuccessMsg('Demo data has been successfully reset to baseline synthetic values.');
    setTimeout(() => {
      window.location.reload();
    }, 1200);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-[#0B1F54]">
          System Governance & Demo Data Management
        </h1>
        <p className="text-xs sm:text-sm text-[#505F79] mt-0.5">
          Manage local storage parameters, inspect prototype versioning, and reset demo datasets.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-[#E6F4EA] border border-[#13805E]/30 rounded-xl text-xs flex items-center gap-3 text-[#13805E]">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Storage Diagnostics */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <HardDrive className="w-5 h-5 text-[#174EA6]" />
          <h2 className="text-sm font-bold text-[#0B1F54] uppercase tracking-wider">
            Browser Storage Diagnostics
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-[#F5F7FB] rounded-lg">
            <span className="text-slate-500 block">Schema Version:</span>
            <span className="font-mono font-bold text-[#0B1F54]">1.0.0-PROTOTYPE</span>
          </div>
          <div className="p-3 bg-[#F5F7FB] rounded-lg">
            <span className="text-slate-500 block">Persistence Engine:</span>
            <span className="font-semibold text-[#174EA6]">browser localStorage</span>
          </div>
          <div className="p-3 bg-[#F5F7FB] rounded-lg">
            <span className="text-slate-500 block">Storage Quota Status:</span>
            <span className="font-bold text-[#13805E]">Normal (&lt; 0.5 MB Used)</span>
          </div>
        </div>
      </Card>

      {/* Reset Demo Data Card */}
      <Card className="p-6 space-y-4 border-rose-200 bg-rose-50/30">
        <div className="flex items-center gap-2 border-b border-rose-100 pb-3">
          <AlertTriangle className="w-5 h-5 text-rose-600" />
          <h2 className="text-sm font-bold text-rose-800 uppercase tracking-wider">
            Reset Demo Prototype Dataset
          </h2>
        </div>

        <p className="text-xs text-[#505F79] leading-relaxed">
          Resetting demo data restores all synthetic institutions, demo users, notifications, and initial audit events back to default factory settings. Any custom institutions registered during your browser testing session will be replaced with standard seed data.
        </p>

        <div className="pt-2">
          <Button
            onClick={() => setResetConfirmOpen(true)}
            variant="outline"
            size="md"
            icon={RotateCcw}
            className="text-rose-700 border-rose-300 hover:bg-rose-100 font-bold"
          >
            Reset Demo Records to Baseline
          </Button>
        </div>
      </Card>

      {/* Reset Confirmation Modal */}
      {resetConfirmOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-xl border border-[#D3DDEB] max-w-md w-full p-6 gov-shadow-lg space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#0B1F54]">
                Confirm Demo Data Reset
              </h3>
            </div>

            <p className="text-xs sm:text-sm text-[#505F79] leading-relaxed">
              Are you sure you want to reset all prototype localStorage records to default seed values? This action cannot be undone.
            </p>

            <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
              <Button
                onClick={() => setResetConfirmOpen(false)}
                variant="outline"
                size="sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleResetDemo}
                variant="primary"
                size="sm"
                className="bg-rose-700 hover:bg-rose-800 border-rose-700 font-bold text-white"
              >
                Yes, Reset Data
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
