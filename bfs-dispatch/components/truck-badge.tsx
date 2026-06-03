"use client";

import { cn } from "@/lib/utils";
import type { AvailabilityStatus } from "@/lib/actions";

interface TruckBadgeProps {
  status: AvailabilityStatus;
  showLabel?: boolean;
  size?: "sm" | "md";
}

const statusConfig = {
  disponible: {
    label: "Disponible",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
    textColor: "text-emerald-700 dark:text-emerald-400",
    dotColor: "bg-emerald-500",
  },
  en_ruta: {
    label: "En Ruta",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
    textColor: "text-amber-700 dark:text-amber-400",
    dotColor: "bg-amber-500",
  },
  maintenance: {
    label: "Mantenimiento",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    textColor: "text-red-700 dark:text-red-400",
    dotColor: "bg-red-500",
  },
};

export function TruckBadge({ status, showLabel = true, size = "sm" }: TruckBadgeProps) {
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
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}