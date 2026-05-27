"use client";

import { Button } from "@/components/ui/button";
import { Edit2, Trash2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { LOAD_STATUS, LOAD_STATUS_LABELS, LOAD_STATUS_COLORS, LoadStatus } from "@/lib/constants";
import { formatTimestamp, formatDollarPerMile } from "@/lib/format";
import type { Load } from "@/types/load";

type LoadsTableProps = {
  loads: Load[];
  onEdit: (load: Load) => void;
  onDelete: (loadId: number) => void;
  onViewDocs: (loadId: number) => void;
  onStatusChange: (loadId: number, newStatus: string) => void;
};

export function LoadsTable({ loads, onEdit, onDelete, onViewDocs, onStatusChange }: LoadsTableProps) {
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Load#</th>
            <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Carrier</th>
            <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Driver</th>
            <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Truck</th>
            <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Cargo</th>
            <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Miles</th>
            <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Rate</th>
            <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Fee %</th>
            <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">$/Mile</th>
            <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Status</th>
            <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Pickup</th>
            <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Delivery</th>
            <th className="text-right px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {loads.map((load) => (
            <tr key={load.load_id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900">
              <td className="px-4 py-3 font-mono font-medium text-zinc-900 dark:text-zinc-50">
                {load.load_number || `#${load.load_id}`}
              </td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                {load.carrier_name || "—"}
              </td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                {load.driver_name || "—"}
              </td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                {load.unit_number || "—"}
              </td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                {load.cargo_type_name || "—"}
              </td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                {load.miles || "—"}
              </td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                {load.rate ? `$${load.rate.toLocaleString()}` : "—"}
              </td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                {load.dispatch_fee_pct != null ? `${load.dispatch_fee_pct}%` : "—"}
              </td>
              <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                {formatDollarPerMile(load.rate, load.miles)}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                  <span className={cn("inline-flex px-2 py-1 rounded-full text-xs font-medium", LOAD_STATUS_COLORS[(load.load_status as LoadStatus) || LOAD_STATUS.PENDING])}>
                    {LOAD_STATUS_LABELS[(load.load_status as LoadStatus) || LOAD_STATUS.PENDING]}
                  </span>
                  {load.load_status !== LOAD_STATUS.PAID && (
                    <select
                      value=""
                      onChange={(e) => onStatusChange(load.load_id, e.target.value)}
                      className="text-xs border rounded px-1 py-0.5 bg-transparent"
                    >
                      <option value="">→</option>
                      {load.load_status === LOAD_STATUS.PENDING && <option value={LOAD_STATUS.BOOKED}>{LOAD_STATUS_LABELS[LOAD_STATUS.BOOKED]}</option>}
                      {load.load_status === LOAD_STATUS.BOOKED && <option value={LOAD_STATUS.PICKED_UP}>{LOAD_STATUS_LABELS[LOAD_STATUS.PICKED_UP]}</option>}
                      {load.load_status === LOAD_STATUS.PICKED_UP && <option value={LOAD_STATUS.DELIVERED}>{LOAD_STATUS_LABELS[LOAD_STATUS.DELIVERED]}</option>}
                      {load.load_status === LOAD_STATUS.DELIVERED && <option value={LOAD_STATUS.PAID}>{LOAD_STATUS_LABELS[LOAD_STATUS.PAID]}</option>}
                    </select>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 font-mono text-xs">
                {formatTimestamp(load.picked_up_at)}
              </td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 font-mono text-xs">
                {formatTimestamp(load.delivered_at)}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" onClick={() => onViewDocs(load.load_id)} title="Ver documentos">
                    <FileText className="h-4 w-4 text-blue-500" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onEdit(load)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(load.load_id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
          {loads.length === 0 && (
            <tr>
              <td colSpan={13} className="text-center py-12 text-zinc-500">
                No se encontraron cargas
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
