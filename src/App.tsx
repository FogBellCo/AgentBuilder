import { HashRouter, Routes, Route } from 'react-router-dom';
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
import { useAutoSave } from '@/hooks/use-auto-save';

function App() {
  useAutoSave();

  return (
    <HashRouter>
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
    </HashRouter>
  );
}

export default App;
