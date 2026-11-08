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
import { apiFetch } from "@/lib/api";

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
  avatar_url: string | null;
  created_at: string | null;
  address: string | null;
  city: string | null;
  region: string | null;
  region_code: string | null;
  province: string | null;
  province_code: string | null;
  city_code: string | null;
  barangay: string | null;
  barangay_code: string | null;
  postal_code: string | null;
  landmark: string | null;
  gender: "female" | "male" | "non_binary" | "prefer_not_to_say" | null;
  birth_date: string | null;
};

type AuthContextValue = {
  user: User | null;
  account: UserAccount | null;
  loading: boolean;
  signOut: () => Promise<void>;
  updateAccount: (details: Partial<UserAccount>) => Promise<UserAccount>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

async function loadAccount() {
  const response = await apiFetch("/api/v1/auth/me");
  const body = (await response.json()) as { account: UserAccount | null };
  return body.account;
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
        setAccount(await loadAccount());
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
        void loadAccount()
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
      async updateAccount(details) {
        const response = await apiFetch("/api/v1/auth/me", {
          method: "PATCH",
          body: JSON.stringify({
            firstname: details.firstname,
            middlename: details.middlename,
            lastname: details.lastname,
            contactNo: details.contactNo,
            address: details.address,
            city: details.city,
            region: details.region,
            regionCode: details.region_code,
            province: details.province,
            provinceCode: details.province_code,
            cityCode: details.city_code,
            barangay: details.barangay,
            barangayCode: details.barangay_code,
            avatarUrl: details.avatar_url,
            postalCode: details.postal_code,
            landmark: details.landmark,
            gender: details.gender,
            birthDate: details.birth_date,
          }),
        });
        const body = (await response.json()) as { account: UserAccount };
        setAccount(body.account);
        return body.account;
      },
    }),
    [account, loading, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
