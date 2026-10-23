import { useState } from 'react';
import { useAuth } from '../../context/useAuth';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { KeyRound, Shield, Save, CheckCircle2, AlertCircle } from 'lucide-react';

export default function InstitutionSettingsPage() {
  const { currentUser, session, updateUserProfile } = useAuth();
  const [newAccessCode, setNewAccessCode] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleUpdateCode = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!newAccessCode || newAccessCode.length < 6) {
      setErrorMsg('Access code must be at least 6 characters.');
      return;
    }
    if (newAccessCode !== confirmCode) {
      setErrorMsg('Access codes do not match.');
      return;
    }

    try {
      await updateUserProfile({ accessCode: newAccessCode });
      setSuccessMsg('Simulated demo access code updated successfully!');
      setNewAccessCode('');
      setConfirmCode('');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update access code.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-[#0B1F54]">
          Account Settings & Security
        </h1>
        <p className="text-xs sm:text-sm text-[#505F79] mt-0.5">
          Manage your institutional access credentials, notification preferences, and session diagnostics.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-[#E6F4EA] border border-[#13805E]/30 rounded-xl text-xs flex items-center gap-3 text-[#13805E]">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs flex items-center gap-3 text-rose-700">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Access Code Change */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <KeyRound className="w-5 h-5 text-[#174EA6]" />
          <h2 className="text-sm font-bold text-[#0B1F54] uppercase tracking-wider">
            Simulated Demo Access Code
          </h2>
        </div>

        <form onSubmit={handleUpdateCode} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-semibold text-[#0B1F54] mb-1">
              New Demo Access Code *
            </label>
            <input
              type="password"
              required
              value={newAccessCode}
              onChange={(e) => setNewAccessCode(e.target.value)}
              placeholder="Enter new 6+ char code"
              className="w-full px-3 py-2 bg-[#F5F7FB] border border-[#D3DDEB] rounded-md text-sm text-[#0B1F54] focus:outline-none focus:ring-2 focus:ring-[#174EA6]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0B1F54] mb-1">
              Confirm New Access Code *
            </label>
            <input
              type="password"
              required
              value={confirmCode}
              onChange={(e) => setConfirmCode(e.target.value)}
              placeholder="Re-enter access code"
              className="w-full px-3 py-2 bg-[#F5F7FB] border border-[#D3DDEB] rounded-md text-sm text-[#0B1F54] focus:outline-none focus:ring-2 focus:ring-[#174EA6]"
            />
          </div>

          <Button type="submit" variant="primary" size="sm" icon={Save}>
            Update Access Code
          </Button>
        </form>
      </Card>

      {/* Session Diagnostics */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Shield className="w-5 h-5 text-[#0B1F54]" />
          <h2 className="text-sm font-bold text-[#0B1F54] uppercase tracking-wider">
            Current Session Telemetry
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-[#505F79] block">Simulated Session Token:</span>
            <span className="font-mono text-slate-700 truncate block">{session?.token || 'N/A'}</span>
          </div>

          <div>
            <span className="text-[#505F79] block">Storage Medium:</span>
            <span className="font-semibold text-[#0B1F54]">
              {session?.rememberMe ? 'Remembered (localStorage)' : 'Single Tab (sessionStorage)'}
            </span>
          </div>

          <div>
            <span className="text-[#505F79] block">Session Expiration:</span>
            <span className="font-medium text-[#174EA6]">
              {session?.expiresAt ? new Date(session.expiresAt).toLocaleString() : 'N/A'}
            </span>
          </div>

          <div>
            <span className="text-[#505F79] block">Account Status:</span>
            <span className="font-bold text-[#13805E]">
              {currentUser?.status === 'active' ? 'Active & Verified' : 'Deactivated'}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
