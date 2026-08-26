import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { OrgMembership, OrgRole } from '@/types';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  membership: OrgMembership | null;
  role: OrgRole | null;
  orgId: string | null;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, orgName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshMembership: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [membership, setMembership] = useState<OrgMembership | null>(null);

  const fetchMembership = useCallback(async (uid: string) => {
    const { data, error } = await supabase
      .from('org_members')
      .select('org_id, role, organizations(id, name, created_by, created_at)')
      .eq('user_id', uid)
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      setMembership(null);
      return;
    }

    const orgData = data.organizations as unknown as { id: string; name: string; created_by: string; created_at: string };
    if (orgData && orgData.id) {
      setMembership({
        org: {
          id: orgData.id,
          name: orgData.name,
          created_by: orgData.created_by,
          created_at: orgData.created_at,
        },
        role: data.role as OrgRole,
      });
    } else {
      setMembership(null);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
      if (data.session?.user) {
        fetchMembership(data.session.user.id);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      (async () => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          await fetchMembership(newSession.user.id);
        } else {
          setMembership(null);
        }
      })();
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [fetchMembership]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error?.message ?? null };
    },
    [],
  );

  const signUp = useCallback(
    async (email: string, password: string, orgName: string) => {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) return { error: error.message };
      if (!data.user) return { error: 'Failed to create account.' };

      // Create org and add user as admin
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert({ name: orgName, created_by: data.user.id })
        .select()
        .single();

      if (orgError) return { error: orgError.message };

      const { error: memberError } = await supabase.from('org_members').insert({
        org_id: orgData.id,
        user_id: data.user.id,
        role: 'admin',
      });

      if (memberError) return { error: memberError.message };

      await fetchMembership(data.user.id);
      return { error: null };
    },
    [fetchMembership],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setMembership(null);
  }, []);

  const refreshMembership = useCallback(async () => {
    if (user) await fetchMembership(user.id);
  }, [user, fetchMembership]);

  const value: AuthContextValue = {
    session,
    user,
    loading,
    membership,
    role: membership?.role ?? null,
    orgId: membership?.org.id ?? null,
    signIn,
    signUp,
    signOut,
    refreshMembership,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
