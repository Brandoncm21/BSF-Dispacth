"use client";

import { cn } from "@/lib/utils";
import type { TruckStatus } from "@/lib/actions";

interface TruckStatusBadgeProps {
  status: TruckStatus;
  reason?: string | null;
  size?: "sm" | "md";
}

const statusConfig = {
  active: {
    label: "Activo",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
    textColor: "text-emerald-700 dark:text-emerald-400",
    dotColor: "bg-emerald-500",
  },
  inactive: {
    label: "Inactivo",
    bgColor: "bg-zinc-100 dark:bg-zinc-800",
    textColor: "text-zinc-600 dark:text-zinc-400",
    dotColor: "bg-zinc-400",
  },
  maintenance: {
    label: "Mantenimiento",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    textColor: "text-red-700 dark:text-red-400",
    dotColor: "bg-red-500",
  },
  in_route: {
    label: "En Ruta",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    textColor: "text-blue-700 dark:text-blue-400",
    dotColor: "bg-blue-500",
  },
};

export function TruckStatusBadge({ status, size = "sm" }: TruckStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        config.bgColor,
        config.textColor,
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
      )}
    >
      <span className={cn("rounded-full", config.dotColor, size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2")} />
      <span>{config.label}</span>
    </span>
  );
}