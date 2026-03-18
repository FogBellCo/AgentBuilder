import { TeamMemberList } from './TeamMemberList';

export function AdminSettings() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-navy">Settings</h1>
      <TeamMemberList />
    </div>
  );
}
