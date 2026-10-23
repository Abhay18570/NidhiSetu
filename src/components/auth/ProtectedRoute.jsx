import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB]">
        <div className="flex flex-col items-center gap-3 p-6 bg-white border border-[#D3DDEB] rounded-xl gov-shadow-sm">
          <div className="w-8 h-8 border-3 border-[#0B1F54] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-[#0B1F54]">Verifying NidhiSetu Session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
