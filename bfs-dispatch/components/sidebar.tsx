"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/auth-actions";
import {
  LayoutDashboard,
  Truck,
  Users,
  Package,
  BarChart3,
  LogOut,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/loads", label: "Cargas", icon: Package },
  { href: "/carriers", label: "Carriers", icon: Truck },
  { href: "/drivers", label: "Drivers", icon: Users },
  { href: "/reports", label: "Reportes", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <div className="flex h-16 items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 dark:bg-zinc-100">
          <Truck className="h-4 w-4 text-white dark:text-zinc-900" />
        </div>
        <span className="text-lg font-bold">BestFreight</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-zinc-200 dark:border-zinc-800 p-3">
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
          >
            <LogOut className="h-4 w-4" />
            Cerrar Sesión
          </button>
        </form>
      </div>
    </aside>
  );
}
