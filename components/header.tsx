"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Truck } from "lucide-react";
import { NotificationBell } from "@/components/notification-bell";
import { useState, useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export function Header() {
  const pathname = usePathname();
  const [employeeId, setEmployeeId] = useState<number | null>(null);

  useEffect(() => {
    async function getEmployee() {
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("employees")
        .select("employee_id")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      if (data) setEmployeeId(data.employee_id);
    }
    getEmployee();
  }, []);

  if (pathname === "/" || pathname?.startsWith("/login")) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-6">
      <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 dark:bg-zinc-100">
          <Truck className="h-4 w-4 text-white dark:text-zinc-900" />
        </div>
        <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">BestFreight</span>
      </Link>

      <div className="flex items-center gap-2">
        {employeeId && (
          <NotificationBell recipientType="dispatcher" recipientId={employeeId} />
        )}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900 transition-colors"
          title="Ir al Dashboard"
        >
          <Home className="h-4 w-4" />
          <span className="hidden sm:inline">Dashboard</span>
        </Link>
      </div>
    </header>
  );
}
