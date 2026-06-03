"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logout } from "@/lib/auth-actions";
import { useUserRole } from "@/hooks/use-has-access";
import {
  getAccessibleModules,
  MODULE_ROUTE_MAP,
  ROLE_PERMISSIONS,
} from "@/config/roles";
import {
  LayoutDashboard,
  Truck,
  Users,
  Package,
  BarChart3,
  LogOut,
  MapPin,
  UserCircle,
  UserCog,
} from "lucide-react";

const iconMap: Record<string, typeof LayoutDashboard> = {
  dashboard: LayoutDashboard,
  loads: Package,
  trucks: Truck,
  drivers: Users,
  carriers: Truck,
  brokers: UserCircle,
  traceability: MapPin,
  reports: BarChart3,
  human_resources: UserCog,
};

const labelMap: Record<string, string> = {
  dashboard: "Dashboard",
  loads: "Cargas",
  trucks: "Trucks",
  drivers: "Drivers",
  carriers: "Carriers",
  brokers: "Brokers",
  traceability: "Trazabilidad",
  reports: "Reportes",
  human_resources: "Staff",
};

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}

export function Sidebar() {
  const pathname = usePathname();
  const { role: userRole, loading } = useUserRole();
  const [navItems, setNavItems] = useState<NavItem[]>([]);

  useEffect(() => {
    if (!userRole) {
      setNavItems([]);
      return;
    }

    const modules = getAccessibleModules(userRole);
    const items: NavItem[] = modules
      .filter((m) => MODULE_ROUTE_MAP[m])
      .map((m) => ({
        href: MODULE_ROUTE_MAP[m],
        label: labelMap[m] ?? m,
        icon: iconMap[m] ?? LayoutDashboard,
      }));

    setNavItems(items);
  }, [userRole]);

  if (pathname === "/" || pathname?.startsWith("/login")) {
    return null;
  }

  async function handleLogout() {
    await logout();
  }

  if (loading) {
    return (
      <aside className="flex h-full w-64 flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="flex h-16 items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 dark:bg-zinc-100">
            <Truck className="h-4 w-4 text-white dark:text-zinc-900" />
          </div>
          <span className="text-lg font-bold">BestFreight</span>
        </div>
        <div className="flex-1 px-6 py-4">
          <div className="animate-pulse space-y-3">
            <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
            <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
            <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
            <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex h-full w-64 flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <div className="flex h-16 items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 px-6">
        <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 dark:bg-zinc-100">
            <Truck className="h-4 w-4 text-white dark:text-zinc-900" />
          </div>
          <span className="text-lg font-bold">BestFreight</span>
        </Link>
      </div>

      {userRole && (
        <div className="px-6 py-2 border-b border-zinc-200 dark:border-zinc-800">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
            {ROLE_PERMISSIONS[userRole]?.label ?? "Usuario"}
          </span>
        </div>
      )}

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

      <div className="border-t border-zinc-200 dark:border-zinc-800 p-4">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-4 rounded-md px-4 py-3 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
        >
          <LogOut className="h-4 w-4" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
