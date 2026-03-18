import { Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AdminHeader } from './AdminHeader';
import { AdminSidebar } from './AdminSidebar';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export function AdminLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" richColors />
      <div className="flex h-screen flex-col overflow-hidden">
        <AdminHeader />
        <div className="flex flex-1 overflow-hidden">
          <AdminSidebar />
          <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </QueryClientProvider>
  );
}
