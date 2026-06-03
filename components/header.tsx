"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { User, LogOut, ChevronDown } from "lucide-react";
import { NotificationBell } from "@/components/notification-bell";
import { useState, useEffect, useRef } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { logout } from "@/lib/auth-actions";

export function Header() {
  const pathname = usePathname();
  const [employeeId, setEmployeeId] = useState<number | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [userInitials, setUserInitials] = useState<string>("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function getEmployee() {
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setUserEmail("");
        setUserInitials("");
        return;
      }
      setUserEmail(user.email ?? "");

      const names = (user.user_metadata?.full_name as string) ?? "";
      if (names) {
        const parts = names.split(" ");
        const initials = parts
          .filter(Boolean)
          .slice(0, 2)
          .map((p: string) => p[0].toUpperCase())
          .join("");
        setUserInitials(initials);
      } else {
        setUserInitials((user.email?.[0] ?? "U").toUpperCase());
      }

      const { data } = await supabase
        .from("employees")
        .select("employee_id")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      if (data) setEmployeeId(data.employee_id);
    }
    getEmployee();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (pathname === "/" || pathname?.startsWith("/login")) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-end border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-6">
      <div className="flex items-center gap-3">
        {employeeId && (
          <NotificationBell recipientType="dispatcher" recipientId={employeeId} />
        )}

        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 rounded-full p-1 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900 transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 dark:bg-zinc-100 text-sm font-semibold text-white dark:text-zinc-900">
              {userInitials || <User className="h-4 w-4" />}
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-lg py-1 z-50">
              {userEmail && (
                <div className="px-3 py-2 text-xs text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 truncate">
                  {userEmail}
                </div>
              )}
              <Link
                href="/dashboard"
                className="flex items-center gap-3 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                onClick={() => setDropdownOpen(false)}
              >
                <User className="h-4 w-4" />
                Perfil
              </Link>
              <button
                type="button"
                onClick={async () => {
                  setDropdownOpen(false);
                  await logout();
                }}
                className="flex w-full items-center gap-3 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
