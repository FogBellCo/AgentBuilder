import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { ProgressBar } from '@/components/layout/ProgressBar';
import { Footer } from '@/components/layout/Footer';
import { Landing } from '@/pages/Landing';
import { Pipeline } from '@/pages/Pipeline';
import { Stage } from '@/pages/Stage';
import { Guidance } from '@/pages/Guidance';
import { Summary } from '@/pages/Summary';

function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col">
        <Header />
        <Breadcrumbs />
        <ProgressBar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/pipeline" element={<Pipeline />} />
            <Route path="/stage/:stageId" element={<Stage />} />
            <Route path="/guidance/:guidanceId" element={<Guidance />} />
            <Route path="/summary" element={<Summary />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
