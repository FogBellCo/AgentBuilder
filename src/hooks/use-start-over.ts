import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '@/store/session-store';

export function useStartOver() {
  const navigate = useNavigate();
  const resetSession = useSessionStore((s) => s.resetSession);

  return useCallback(() => {
    resetSession();
    navigate('/');
  }, [resetSession, navigate]);
}
