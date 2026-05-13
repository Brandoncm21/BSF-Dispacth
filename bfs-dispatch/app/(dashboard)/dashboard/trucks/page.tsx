"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Plus, Edit2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TruckStatusBadge } from "@/components/truck-status-badge";
import { TruckFormSheet } from "@/components/truck-form-sheet";
import { TruckWithSmartStatus } from "@/lib/actions";
import { cn } from "@/lib/utils";
import { PaginationControls } from "@/components/pagination-controls";
import { TableSkeleton } from "@/components/table-skeleton";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function TrucksPage() {
  const PAGE_SIZE = 16;
  const [trucks, setTrucks] = useState<TruckWithSmartStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingTruck, setEditingTruck] = useState<TruckWithSmartStatus | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchTrucks();
  }, [search, page]);

  async function fetchTrucks() {
    setLoading(true);
    const offset = (page - 1) * PAGE_SIZE;

    let query = supabase
      .from("trucks")
      .select("*, carriers(first_name, last_name), record_status:status_id(status_name)", { count: "exact" })
      .eq("status_id", 1);

    if (search) {
      query = query.or(
        `unit_number.ilike.%${search}%,carriers.first_name.ilike.%${search}%,carriers.last_name.ilike.%${search}%`
      );
    }

    const { data, count, error } = await query.range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      console.error("Error fetching trucks:", error);
    } else if (data) {
      const mapped = data.map((t) => {
        const opStatus = t.operational_status?.toLowerCase() || "";
        let smartStatus: "active" | "inactive" | "maintenance" | "in_route" = "inactive";
        let statusReason = "Sin asignar";

        if (opStatus === "activo" || opStatus === "active" || opStatus === "available") {
          smartStatus = "active";
          statusReason = "Disponible";
        } else if (opStatus.includes("mantenimiento") || opStatus.includes("maintenance")) {
          smartStatus = "maintenance";
          statusReason = "En mantenimiento";
        } else if (opStatus.includes("ruta") || opStatus.includes("route") || opStatus === "in_route") {
          smartStatus = "in_route";
          statusReason = "En ruta activa";
        }

        return {
          truck_id: t.truck_id,
          unit_number: t.unit_number,
          truck_type: t.vehicle_type || "N/A",
          capacity: t.capacity,
          operational_status: t.operational_status,
          carrier_id: t.carrier_id,
          status_id: t.status_id,
          carrier_name: t.carriers ? `${t.carriers.first_name} ${t.carriers.last_name}` : "N/A",
          smart_status: smartStatus,
          status_reason: statusReason,
          current_load_id: null,
          current_load_number: null,
        };
      }) as TruckWithSmartStatus[];
      setTrucks(mapped);
      setTotal(count || 0);
    }
    setLoading(false);
  }

  function handleAdd() {
    setEditingTruck(null);
    setSheetOpen(true);
  }

  function handleEdit(truck: TruckWithSmartStatus) {
    setEditingTruck(truck);
    setSheetOpen(true);
  }

  function handleSuccess() {
    fetchTrucks();
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Trucks</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Gestiona los camiones de la flota
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar Camión
        </Button>
      </div>

      <div className="mb-6">
        <Input
          placeholder="Buscar por unit number o carrier..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-md"
        />
      </div>

      {loading ? (
        <TableSkeleton rows={16} columns={6} />
      ) : (
        <>
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800">
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-500 dark:text-zinc-400">Unit Number</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-500 dark:text-zinc-400">Carrier</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-500 dark:text-zinc-400">Truck Type</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-500 dark:text-zinc-400">Current Load</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-500 dark:text-zinc-400">Status</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-zinc-500 dark:text-zinc-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                {trucks.map((truck) => (
                  <tr key={truck.truck_id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">{truck.unit_number}</span>
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{truck.carrier_name}</td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{truck.truck_type}</td>
                    <td className="px-4 py-3">
                      {truck.current_load_number ? (
                        <span className="text-sm text-blue-600 dark:text-blue-400">{truck.current_load_number}</span>
                      ) : (
                        <span className="text-sm text-zinc-400">Sin carga</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <TruckStatusBadge status={truck.smart_status} reason={truck.status_reason} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(truck)}
                        disabled={truck.smart_status === "in_route"}
                        className={cn(truck.smart_status === "in_route" && "opacity-50 cursor-not-allowed")}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {trucks.length === 0 && (
              <div className="py-12 text-center text-zinc-500">No hay camiones registrados</div>
            )}
          </div>
          <PaginationControls currentPage={page} totalItems={total} pageSize={PAGE_SIZE} onPageChange={setPage} />
        </>
      )}

      <TruckFormSheet open={sheetOpen} onOpenChange={setSheetOpen} truck={editingTruck} onSuccess={handleSuccess} />
    </div>
  );
}
