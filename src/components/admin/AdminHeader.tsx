import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clearAdminToken } from '@/lib/admin-api-client';

export function AdminHeader() {
  const navigate = useNavigate();

  function handleLogout() {
    clearAdminToken();
    navigate('/admin/login');
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-navy px-6">
      <div className="flex items-center gap-3">
        <span className="text-sm font-bold text-white">UC San Diego</span>
        <span className="text-xs text-gray-400">|</span>
        <span className="text-sm font-medium text-yellow">OSI Admin</span>
      </div>
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 rounded px-3 py-1.5 text-sm text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
      >
        <LogOut className="h-4 w-4" />
        Logout
      </button>
    </header>
  );
}
