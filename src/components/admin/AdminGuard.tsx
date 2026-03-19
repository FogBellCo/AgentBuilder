import { Navigate } from 'react-router-dom';
import { hasAdminToken } from '@/lib/admin-api-client';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  if (!hasAdminToken()) {
    return <Navigate to="/admin/login" replace />;
  }
  return <>{children}</>;
}
