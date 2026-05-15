"use client";

import { TruckLoadHistory } from "@/lib/actions";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface TruckTimelineProps {
  truckId: number;
  unitNumber: string;
  history: TruckLoadHistory[];
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  booked: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  picked_up: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  delivered: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};

export function TruckTimeline({ truckId, unitNumber, history }: TruckTimelineProps) {
  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-zinc-500">
        <MapPin className="h-8 w-8 mb-2" />
        <p className="text-sm">Sin historial de cargas en los últimos 30 días</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h4 className="font-medium text-sm text-zinc-700 dark:text-zinc-300">
          Historial de {unitNumber}
        </h4>
        <span className="text-xs text-zinc-500">{history.length} cargas</span>
      </div>

      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-px bg-zinc-200 dark:bg-zinc-700" />

        <div className="space-y-4">
          {history.map((load) => (
            <div key={load.load_id} className="relative pl-10">
              <div className="absolute left-3 top-1.5 h-2.5 w-2.5 rounded-full bg-zinc-400 dark:bg-zinc-600 border-2 border-white dark:border-zinc-950" />

              <div className={cn(
                "rounded-lg border p-3",
                "border-zinc-200 dark:border-zinc-800",
                "bg-white dark:bg-zinc-900"
              )}>
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {load.load_number || `Load #${load.load_id}`}
                      </span>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-medium",
                        statusColors[load.load_status] || "bg-zinc-100 text-zinc-700"
                      )}>
                        {load.load_status?.replace("_", " ")}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-500">
                      <span className="font-medium">{load.origin}</span>
                      <span className="mx-1">→</span>
                      <span className="font-medium">{load.destination}</span>
                    </div>
                    <div className="text-xs text-zinc-400">
                      {load.load_date}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      ${Number(load.rate).toLocaleString("es-CR", { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}