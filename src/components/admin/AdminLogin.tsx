import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { cn } from '@/lib/utils';

export function AdminLogin() {
  const [token, setToken] = useState('');
  const { login, isLoading, error } = useAdminAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token.trim()) return;
    try {
      await login(token.trim());
      navigate('/admin/submissions');
    } catch {
      // Error state handled by hook
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-navy/10">
            <Lock className="h-6 w-6 text-navy" />
          </div>
          <h1 className="text-xl font-bold text-navy">OSI Admin Dashboard</h1>
          <p className="text-center text-sm text-gray-500">
            Enter the admin access token to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="admin-token" className="mb-1 block text-sm font-medium text-gray-700">
              Access Token
            </label>
            <input
              id="admin-token"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste your admin token..."
              className={cn(
                'w-full rounded-md border px-3 py-2 text-sm outline-none transition-colors',
                'focus:border-blue focus:ring-1 focus:ring-blue',
                error ? 'border-red-400' : 'border-gray-300',
              )}
              autoFocus
            />
            {error && (
              <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !token.trim()}
            className={cn(
              'rounded-md bg-navy px-4 py-2 text-sm font-medium text-white transition-colors',
              'hover:bg-navy/90 disabled:cursor-not-allowed disabled:opacity-50',
            )}
          >
            {isLoading ? 'Verifying...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
