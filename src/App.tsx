import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { Header } from '@/components/layout/Header';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { ProgressBar } from '@/components/layout/ProgressBar';
import { StagesSidebar } from '@/components/layout/StagesSidebar';
import { Footer } from '@/components/layout/Footer';
import { Landing } from '@/pages/Landing';
import { Describe } from '@/pages/Describe';
import { Pipeline } from '@/pages/Pipeline';
import { Stage } from '@/pages/Stage';
import { Guidance } from '@/pages/Guidance';
import { Summary } from '@/pages/Summary';
import { GapAnalysis } from '@/pages/GapAnalysis';
import { AutoSaveProvider } from '@/components/auth/AutoSaveProvider';

// Admin imports
import { AdminLogin } from '@/components/admin/AdminLogin';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { SubmissionQueue } from '@/components/admin/queue/SubmissionQueue';
import { SubmissionDetail } from '@/components/admin/detail/SubmissionDetail';
import { AnalyticsOverview } from '@/components/admin/analytics/AnalyticsOverview';
import { PrioritizationMatrix } from '@/components/admin/prioritization/PrioritizationMatrix';
import { AdminSettings } from '@/components/admin/settings/AdminSettings';

function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          {/* Admin routes — completely separate layout */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin/*"
            element={
              <AdminGuard>
                <AdminLayout />
              </AdminGuard>
            }
          >
            <Route index element={<Navigate to="submissions" replace />} />
            <Route path="submissions" element={<SubmissionQueue />} />
            <Route path="submissions/:id" element={<SubmissionDetail />} />
            <Route path="analytics" element={<AnalyticsOverview />} />
            <Route path="prioritization" element={<PrioritizationMatrix />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* User-facing routes — original layout */}
          <Route
            path="/*"
            element={
              <>
                <AutoSaveProvider />
                <div className="flex min-h-screen flex-col">
                  <Header />
                  <Breadcrumbs />
                  <ProgressBar />
                  <div className="flex flex-1">
                    <StagesSidebar />
                    <main className="flex-1">
                      <Routes>
                        <Route path="/" element={<Landing />} />
                        <Route path="/describe" element={<Describe />} />
                        <Route path="/pipeline" element={<Pipeline />} />
                        <Route path="/stage/:stageId" element={<Stage />} />
                        <Route path="/guidance/:guidanceId" element={<Guidance />} />
                        <Route path="/gap-analysis" element={<GapAnalysis />} />
                        <Route path="/summary" element={<Summary />} />
                      </Routes>
                    </main>
                  </div>
                  <Footer />
                </div>
              </>
            }
          />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}

export default App;
