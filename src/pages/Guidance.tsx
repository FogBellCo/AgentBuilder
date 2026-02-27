import { useParams, useNavigate } from 'react-router-dom';
import { GuidancePage } from '@/components/guidance/GuidancePage';

import p1Content from '@/data/guidance/p1-public.md?raw';
import p2Content from '@/data/guidance/p2-sso-setup.md?raw';
import p3Content from '@/data/guidance/p3-api-key.md?raw';
import p4Content from '@/data/guidance/p4-restricted.md?raw';

const guidanceMap: Record<string, string> = {
  p1: p1Content,
  p2: p2Content,
  p3: p3Content,
  p4: p4Content,
};

export function Guidance() {
  const { guidanceId } = useParams<{ guidanceId: string }>();
  const navigate = useNavigate();
  const content = guidanceMap[guidanceId ?? ''] ?? '# Not Found\n\nThis guidance page does not exist.';

  return (
    <div className="mx-auto max-w-5xl px-6">
      <GuidancePage content={content} onBack={() => navigate(-1)} />
    </div>
  );
}
