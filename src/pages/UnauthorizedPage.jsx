import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import Button from '../components/common/Button';

export default function UnauthorizedPage({ allowedRoles = [], currentRole = 'guest' }) {
  const { logout } = useAuth();

  const getDashboardPath = (role) => {
    if (role === 'institution') return '/institution/dashboard';
    if (role === 'officer') return '/officer/dashboard';
    if (role === 'admin') return '/admin/dashboard';
    return '/login';
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F5F7FB]">
      <div className="max-w-md w-full bg-white rounded-xl border border-[#D3DDEB] p-8 text-center gov-shadow-md space-y-4">
        <div className="w-14 h-14 rounded-full bg-[#FEF7EC] text-[#E89B24] flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h1 className="text-xl font-extrabold text-[#0B1F54]">
          Restricted Workspace Access
        </h1>

        <p className="text-xs sm:text-sm text-[#505F79] leading-relaxed">
          You are currently logged in with the role <strong className="text-[#0B1F54] uppercase font-mono">{currentRole}</strong>. This workspace is strictly restricted to: <strong className="text-[#174EA6] uppercase font-mono">{allowedRoles.join(', ')}</strong>.
        </p>

        <div className="p-3 bg-[#F5F7FB] border border-[#D3DDEB] rounded text-left text-xs text-[#505F79] space-y-1">
          <div className="font-semibold text-[#0B1F54]">Simulated Access Control Notice:</div>
          <div>Role boundaries prevent cross-portal navigation in this demonstration prototype.</div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
          <Button
            to={getDashboardPath(currentRole)}
            variant="primary"
            size="md"
            icon={ArrowLeft}
            className="font-semibold justify-center"
          >
            Return to My Dashboard
          </Button>
          <Button
            onClick={() => logout()}
            variant="outline"
            size="md"
            icon={LogOut}
            className="font-semibold justify-center"
          >
            Switch Account
          </Button>
        </div>
      </div>
    </div>
  );
}
