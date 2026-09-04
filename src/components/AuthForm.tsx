import { useState } from 'react';
import { Wallet, Mail, Lock, Building2, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';

export function AuthForm() {
  const { signIn, signUp } = useAuth();
  const { t } = useSettings();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgName, setOrgName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'signup') {
      if (!orgName.trim()) {
        setError(t('enterOrgName'));
        setLoading(false);
        return;
      }
      const { error: err } = await signUp(email.trim(), password, orgName.trim());
      if (err) setError(err);
    } else {
      const { error: err } = await signIn(email.trim(), password);
      if (err) setError(err);
    }
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 dark:from-gray-950 dark:to-gray-900">
      <div className="w-full max-w-md animate-slide-up">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-600/30">
            <Wallet className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{t('finchCorporate')}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {mode === 'signin' ? t('signInToWorkspace') : t('createOrganization')}
          </p>
        </div>

        <div className="card p-6">
          <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
            <button
              type="button"
              onClick={() => { setMode('signin'); setError(''); }}
              className={`rounded-lg py-2 text-sm font-semibold transition ${
                mode === 'signin'
                  ? 'bg-white text-brand-700 shadow-sm dark:bg-gray-900 dark:text-brand-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {t('signIn')}
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(''); }}
              className={`rounded-lg py-2 text-sm font-semibold transition ${
                mode === 'signup'
                  ? 'bg-white text-brand-700 shadow-sm dark:bg-gray-900 dark:text-brand-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {t('signUp')}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="mb-1.5 block text-sm font-medium">{t('orgName')}</label>
                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    className="input pl-10"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="..."
                    autoFocus
                  />
                </div>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium">{t('email')}</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  className="input pl-10"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="..."
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">{t('password')}</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  className="input pl-10"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {error && (
              <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{error}</p>
            )}

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {mode === 'signin' ? t('signInBtn') : t('createAccountBtn')}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400 dark:text-gray-500">
          {t('corporateDescShort')}
        </p>
      </div>
    </div>
  );
}
