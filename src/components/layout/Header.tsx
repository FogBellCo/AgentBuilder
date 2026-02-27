import { useNavigate } from 'react-router-dom';
import { useStartOver } from '@/hooks/use-start-over';

export function Header() {
  const navigate = useNavigate();
  const startOver = useStartOver();

  return (
    <header className="border-b border-gray-200 bg-navy text-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded bg-yellow">
            <span className="text-sm font-bold text-navy">UC</span>
          </div>
          <div>
            <div className="text-sm font-bold tracking-wide uppercase">
              UC San Diego
            </div>
            <div className="text-xs text-gray-300 tracking-wider uppercase">
              AI Workflow Guide
            </div>
          </div>
        </button>
        <button
          onClick={startOver}
          className="text-xs text-gray-400 hover:text-white transition-colors uppercase tracking-widest"
        >
          Start Over
        </button>
      </div>
    </header>
  );
}
