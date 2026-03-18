import { useState, type FormEvent } from 'react';
import { UserPlus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminTeam, useAddTeamMember, useRemoveTeamMember } from '@/hooks/use-admin-team';
import { ConfirmDialog } from '../ConfirmDialog';

export function TeamMemberList() {
  const { data, isLoading } = useAdminTeam();
  const addMember = useAddTeamMember();
  const removeMember = useRemoveTeamMember();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const members = data?.members ?? [];

  function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    addMember.mutate(
      { name: name.trim(), email: email.trim() },
      {
        onSuccess: () => {
          setName('');
          setEmail('');
        },
      },
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-4 py-3">
        <h2 className="text-sm font-bold text-navy">Team Members</h2>
        <p className="text-xs text-gray-500">Manage OSI team members for assignment and note attribution.</p>
      </div>

      <div className="p-4">
        {/* Add member form */}
        <form onSubmit={handleAdd} className="mb-4 flex gap-2">
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={cn(
              'flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none',
              'focus:border-blue focus:ring-1 focus:ring-blue',
            )}
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={cn(
              'flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none',
              'focus:border-blue focus:ring-1 focus:ring-blue',
            )}
          />
          <button
            type="submit"
            disabled={!name.trim() || !email.trim() || addMember.isPending}
            className={cn(
              'flex items-center gap-1.5 rounded-md bg-navy px-3 py-1.5 text-xs font-medium text-white',
              'hover:bg-navy/90 disabled:opacity-50',
            )}
          >
            <UserPlus className="h-3.5 w-3.5" />
            Add
          </button>
        </form>

        {/* Members list */}
        {isLoading ? (
          <div className="py-8 text-center text-sm text-gray-400">Loading...</div>
        ) : members.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-400">No team members yet</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between py-2.5">
                <div>
                  <div className="text-sm font-medium text-gray-800">{member.name}</div>
                  <div className="text-xs text-gray-500">{member.email}</div>
                </div>
                <button
                  onClick={() => setConfirmDeleteId(member.id)}
                  className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                  title="Remove member"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmDeleteId !== null}
        title="Remove Team Member"
        message={`Are you sure you want to remove ${members.find((m) => m.id === confirmDeleteId)?.name ?? 'this member'}?`}
        confirmLabel="Remove"
        confirmVariant="danger"
        onConfirm={() => {
          if (confirmDeleteId) removeMember.mutate(confirmDeleteId);
          setConfirmDeleteId(null);
        }}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
}
