"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Search, MapPin, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StatusHistoryEvent, TruckLoadHistory } from "@/lib/actions";

interface TruckTimelineProps {
  truckId: number;
  unitNumber: string;
  history: TruckLoadHistory[];
  statusHistory?: StatusHistoryEvent[];
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  booked: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  picked_up: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  delivered: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  delayed: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-CR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TruckTimeline({ truckId, unitNumber, history, statusHistory }: TruckTimelineProps) {
  const [loadFilter, setLoadFilter] = useState("");

  const filteredStatusHistory = useMemo(() => {
    if (!statusHistory) return [];
    if (!loadFilter.trim()) return statusHistory;
    const q = loadFilter.toLowerCase();
    return statusHistory.filter(
      (e) =>
        e.load_number?.toLowerCase().includes(q) ||
        String(e.load_id).includes(q)
    );
  }, [statusHistory, loadFilter]);

  const filteredLoadHistory = useMemo(() => {
    if (!loadFilter.trim()) return history;
    const q = loadFilter.toLowerCase();
    return history.filter(
      (l) =>
        l.load_number?.toLowerCase().includes(q) ||
        String(l.load_id).includes(q)
    );
  }, [history, loadFilter]);

  const creatorMap = useMemo(() => {
    const map = new Map<number, { name: string; date: string }>();
    if (!statusHistory) return map;
    for (const event of statusHistory) {
      if (event.old_status === null && !map.has(event.load_id)) {
        map.set(event.load_id, { name: event.employee_name, date: event.changed_at });
      }
    }
    return map;
  }, [statusHistory]);

  const lastEditorMap = useMemo(() => {
    const map = new Map<number, { name: string; date: string }>();
    if (!statusHistory) return map;
    const grouped = new Map<number, typeof statusHistory>();
    for (const event of statusHistory) {
      const arr = grouped.get(event.load_id) || [];
      arr.push(event);
      grouped.set(event.load_id, arr);
    }
    for (const [loadId, events] of grouped) {
      const first = events[0];
      if (first && first.employee_name) {
        map.set(loadId, { name: first.employee_name, date: first.changed_at });
      }
    }
    return map;
  }, [statusHistory]);

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-zinc-500">
        <MapPin className="h-8 w-8 mb-2" />
        <p className="text-sm">Sin historial de cargas en los últimos 30 días</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h4 className="font-medium text-sm text-zinc-700 dark:text-zinc-300">
          Historial de {unitNumber}
        </h4>
        <div className="relative flex-1 max-w-[200px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
          <Input
            placeholder="Filtrar por load #..."
            value={loadFilter}
            onChange={(e) => setLoadFilter(e.target.value)}
            className="pl-7 h-8 text-xs"
          />
        </div>
      </div>

      {/* Status History Timeline */}
      {filteredStatusHistory.length > 0 && (
        <div className="relative">
          <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-zinc-200 dark:bg-zinc-700" />
          <div className="space-y-2 max-h-[300px] overflow-auto">
            {filteredStatusHistory.slice(0, 50).map((event) => (
              <div key={event.history_id} className="relative pl-8">
                <div className="absolute left-[7px] top-[10px] h-2.5 w-2.5 rounded-full bg-zinc-400 dark:bg-zinc-500 border-2 border-white dark:border-zinc-950" />
                <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2.5">
                  <div className="flex items-center gap-1.5 text-xs">
                    {event.old_status && (
                      <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium", statusColors[event.old_status])}>
                        {event.old_status.replace("_", " ")}
                      </span>
                    )}
                    {event.old_status && <ArrowRight className="h-3 w-3 text-zinc-400" />}
                    <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium", statusColors[event.new_status])}>
                      {event.new_status.replace("_", " ")}
                    </span>
                    <span className="text-zinc-400 mx-1">•</span>
                    <span className="font-medium text-zinc-600 dark:text-zinc-400">
                      {event.load_number || `#${event.load_id}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-zinc-400">
                      {formatDate(event.changed_at)}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      por <strong className="text-zinc-500">{event.employee_name}</strong>
                    </span>
                  </div>
                  {event.notes && (
                    <p className="text-[10px] text-zinc-500 mt-1 italic">{event.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Load History List */}
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-px bg-zinc-200 dark:bg-zinc-700" />
        <div className="space-y-3">
          {filteredLoadHistory.map((load) => (
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
                    <div className="flex gap-3 mt-1.5">
                      {creatorMap.has(load.load_id) && (() => {
                        const c = creatorMap.get(load.load_id)!;
                        return (
                          <span className="inline-flex items-center gap-1 text-[10px] text-zinc-400">
                            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                            Creada por {c.name} · {new Date(c.date).toLocaleDateString("es-CR")}
                          </span>
                        );
                      })()}
                      {lastEditorMap.has(load.load_id) && (() => {
                        const e = lastEditorMap.get(load.load_id)!;
                        if (creatorMap.get(load.load_id)?.name === e.name) return null;
                        return (
                          <span className="inline-flex items-center gap-1 text-[10px] text-zinc-400">
                            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            Editada por {e.name} · {new Date(e.date).toLocaleDateString("es-CR")}
                          </span>
                        );
                      })()}
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

