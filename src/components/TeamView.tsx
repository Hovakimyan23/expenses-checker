import { useState, useEffect } from 'react';
import { Users, UserPlus, Trash2, Shield, UserCog, Mail, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useSettings } from '@/context/SettingsContext';
import type { OrgMember, OrgRole } from '@/types';
import type { TranslationKey } from '@/lib/i18n';

interface TeamViewProps {
  orgId: string;
  currentUserId: string;
  onMemberChange?: () => void;
}

const ROLE_STYLES: Record<OrgRole, { bg: string; text: string; icon: typeof Shield }> = {
  admin: { bg: 'bg-brand-100 dark:bg-brand-500/15', text: 'text-brand-700 dark:text-brand-400', icon: Shield },
  manager: { bg: 'bg-sky-100 dark:bg-sky-500/15', text: 'text-sky-700 dark:text-sky-400', icon: UserCog },
  employee: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', icon: Users },
};

export function TeamView({ orgId, currentUserId, onMemberChange }: TeamViewProps) {
  const { t, language } = useSettings();
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<OrgRole>('employee');
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadMembers();
  }, [orgId]);

  async function loadMembers() {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('org_members')
      .select('id, org_id, user_id, role, created_at')
      .eq('org_id', orgId)
      .order('created_at');

    if (!err && data) {
      setMembers(data as OrgMember[]);
    }
    setLoading(false);
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setActionLoading(true);
    setError(t('inviteEmailRequiresServer'));
    setActionLoading(false);
  }

  async function changeRole(memberId: string, newRole: OrgRole) {
    setActionLoading(true);
    const { error: err } = await supabase
      .from('org_members')
      .update({ role: newRole })
      .eq('id', memberId);

    if (!err) {
      await loadMembers();
      onMemberChange?.();
    } else {
      setError(err.message);
    }
    setActionLoading(false);
  }

  async function removeMember(memberId: string) {
    setActionLoading(true);
    const { error: err } = await supabase
      .from('org_members')
      .delete()
      .eq('id', memberId);

    if (!err) {
      await loadMembers();
      onMemberChange?.();
    } else {
      setError(err.message);
    }
    setActionLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const locale = language === 'ru' ? 'ru-RU' : language === 'hy' ? 'hy-AM' : 'en-US';

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-lg font-bold">{t('teamMembers')}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('manageRoles')}
        </p>
      </div>

      <div className="card p-5">
        <div className="mb-3 flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-gray-400" />
          <h3 className="text-sm font-semibold">{t('inviteMember')}</h3>
        </div>
        <form onSubmit={handleInvite} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">{t('email')}</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                className="input pl-10"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="..."
              />
            </div>
          </div>
          <div className="sm:w-40">
            <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">{t('team')}</label>
            <select
              className="input"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as OrgRole)}
            >
              <option value="employee">{t('employee')}</option>
              <option value="manager">{t('manager')}</option>
              <option value="admin">{t('admin')}</option>
            </select>
          </div>
          <button type="submit" className="btn-primary" disabled={actionLoading}>
            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            {t('invite')}
          </button>
        </form>
        {error && <p className="mt-3 text-sm text-amber-600 dark:text-amber-400">{error}</p>}
      </div>

      <div className="card divide-y divide-gray-100 dark:divide-gray-800">
        {members.map((m) => {
          const style = ROLE_STYLES[m.role];
          const RoleIcon = style.icon;
          const isSelf = m.user_id === currentUserId;
          return (
            <div key={m.id} className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white">
                {m.user_id.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {m.user_id.slice(0, 8)}...
                  {isSelf && <span className="ml-2 text-xs text-gray-400">{t('you')}</span>}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('joined')} {new Date(m.created_at).toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`badge ${style.bg} ${style.text}`}>
                  <RoleIcon className="h-3 w-3" />
                  <span>{t(m.role as TranslationKey)}</span>
                </span>
                {!isSelf && (
                  <>
                    <select
                      value={m.role}
                      onChange={(e) => changeRole(m.id, e.target.value as OrgRole)}
                      className="hidden rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-800 sm:block"
                    >
                      <option value="employee">{t('employee')}</option>
                      <option value="manager">{t('manager')}</option>
                      <option value="admin">{t('admin')}</option>
                    </select>
                    <button
                      onClick={() => removeMember(m.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-rose-500 transition hover:bg-rose-50 dark:hover:bg-rose-500/10"
                      title={t('removeMember')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
