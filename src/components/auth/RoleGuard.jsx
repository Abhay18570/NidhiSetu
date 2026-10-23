import { useAuth } from '../../context/useAuth';
import UnauthorizedPage from '../../pages/UnauthorizedPage';

export default function RoleGuard({ allowedRoles = [], children }) {
  const { currentRole, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!allowedRoles.includes(currentRole)) {
    return <UnauthorizedPage allowedRoles={allowedRoles} currentRole={currentRole} />;
  }

  return children;
}
