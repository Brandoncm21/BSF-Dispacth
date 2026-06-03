export type RoleType = "admin" | "back_office" | "dispatcher" | "logistics" | "sales";

export interface RoleConfig {
  label: string;
  modules: string[];
  description: string;
}

export const ROLE_PERMISSIONS: Record<RoleType, RoleConfig> = {
  admin: {
    label: "Administrador",
    modules: ["*"],
    description: "Acceso total al sistema",
  },
  back_office: {
    label: "Back Office",
    modules: [
      "dashboard",
      "loads",
      "trucks",
      "drivers",
      "carriers",
      "brokers",
      "traceability",
      "reports",
    ],
    description: "Operaciones administrativas",
  },
  dispatcher: {
    label: "Dispatcher",
    modules: ["dashboard", "loads", "traceability"],
    description: "Operador de carga",
  },
  logistics: {
    label: "Logística",
    modules: ["dashboard", "loads", "trucks", "drivers", "carriers", "traceability"],
    description: "Gestión logística",
  },
  sales: {
    label: "Ventas",
    modules: ["dashboard", "brokers", "reports"],
    description: "Gestión de ventas y brokers",
  },
};

export const MODULE_ROUTE_MAP: Record<string, string> = {
  dashboard: "/dashboard",
  loads: "/loads",
  trucks: "/dashboard/trucks",
  drivers: "/drivers",
  carriers: "/carriers",
  brokers: "/brokers",
  traceability: "/traceability",
  reports: "/reports",
  human_resources: "/dashboard/human-resources",
};

export function hasAccess(role: RoleType | null | undefined, module: string): boolean {
  if (!role) return false;
  const config = ROLE_PERMISSIONS[role];
  if (!config) return false;
  if (config.modules.includes("*")) return true;
  return config.modules.includes(module);
}

export function getAccessibleModules(role: RoleType | null | undefined): string[] {
  if (!role) return [];
  const config = ROLE_PERMISSIONS[role];
  if (!config) return [];
  if (config.modules.includes("*")) return Object.keys(MODULE_ROUTE_MAP);
  return config.modules;
}
