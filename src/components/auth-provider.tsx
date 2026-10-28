"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type UserAccount = {
  id: string;
  firstname: string | null;
  middlename: string | null;
  lastname: string | null;
  role: string | null;
  contactNo: string | null;
  email: string;
  status: string | null;
  is_active: boolean | null;
  created_at: string | null;
};

type AuthContextValue = {
  user: User | null;
  account: UserAccount | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

async function loadAccount(user: User) {
  const { data, error } = await getSupabaseBrowserClient()
    .from("user_accounts")
    .select(
      "id, firstname, middlename, lastname, role, contactNo, email, status, is_active, created_at",
    )
    .eq("email", user.email ?? "")
    .maybeSingle();
  if (error) {
    throw new Error(`Account profile could not be loaded: ${error.message}`);
  }
  return data as UserAccount | null;
}

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, setSession] = useState<Session | null>(null);
  const [account, setAccount] = useState<UserAccount | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let active = true;

    async function initialize() {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw new Error(`Session could not be loaded: ${error.message}`);
      if (!active) return;
      setSession(data.session);
      if (data.session?.user) {
        setAccount(await loadAccount(data.session.user));
      }
      setLoading(false);
    }

    void initialize().catch(() => {
      if (active) {
        setSession(null);
        setAccount(null);
        setLoading(false);
      }
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession?.user) {
        setAccount(null);
        setLoading(false);
      } else {
        void loadAccount(nextSession.user)
          .then(setAccount)
          .catch(() => setAccount(null))
          .finally(() => setLoading(false));
      }
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      account,
      loading,
      async signOut() {
        const { error } = await getSupabaseBrowserClient().auth.signOut();
        if (error) throw new Error(`Sign-out failed: ${error.message}`);
      },
    }),
    [account, loading, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
