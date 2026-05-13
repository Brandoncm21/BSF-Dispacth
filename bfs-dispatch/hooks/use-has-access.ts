"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { hasAccess, type RoleType } from "@/config/roles";

async function fetchUserRoleFromDB(userId: string): Promise<RoleType | null> {
  const { data, error } = await supabase.rpc("get_user_role_type");
  if (error || !data) return null;
  return data as RoleType;
}

export function useHasAccess(module: string) {
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAccess() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setAllowed(false);
        setLoading(false);
        return;
      }

      const role = await fetchUserRoleFromDB(session.user.id);
      if (!role) {
        setAllowed(false);
        setLoading(false);
        return;
      }

      setAllowed(hasAccess(role, module));
      setLoading(false);
    }

    checkAccess();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      checkAccess();
    });

    return () => subscription.unsubscribe();
  }, [module]);

  return { allowed, loading };
}

export function useUserRole() {
  const [role, setRole] = useState<RoleType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getRole() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setRole(null);
        setLoading(false);
        return;
      }

      const dbRole = await fetchUserRoleFromDB(session.user.id);
      setRole(dbRole);
      setLoading(false);
    }

    getRole();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      getRole();
    });

    return () => subscription.unsubscribe();
  }, []);

  return { role, loading };
}

export { fetchUserRoleFromDB };
