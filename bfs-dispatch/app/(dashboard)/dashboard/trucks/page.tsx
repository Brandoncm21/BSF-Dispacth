"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Edit2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TruckStatusBadge } from "@/components/truck-status-badge";
import { TruckFormSheet } from "@/components/truck-form-sheet";
import { searchTrucks as searchTrucksAction, TruckWithSmartStatus } from "@/lib/actions";
import { cn } from "@/lib/utils";
import { PaginationControls } from "@/components/pagination-controls";
import { TableSkeleton } from "@/components/table-skeleton";

function mapTruckData(raw: any): TruckWithSmartStatus {
  const opStatus = raw.operational_status?.toLowerCase() || "";
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
    truck_id: raw.truck_id,
    unit_number: raw.unit_number,
    truck_type: raw.vehicle_type || "N/A",
    operational_status: raw.operational_status,
    carrier_id: raw.carrier_id,
    carrier_name: raw.carriers ? `${raw.carriers.first_name} ${raw.carriers.last_name}` : "N/A",
    smart_status: smartStatus,
    status_reason: statusReason,
    current_load_id: null,
    current_load_number: null,
  };
}

export default function TrucksPage() {
  const PAGE_SIZE = 16;
  const [trucks, setTrucks] = useState<TruckWithSmartStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingTruck, setEditingTruck] = useState<TruckWithSmartStatus | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchTrucks = useCallback(async () => {
    setLoading(true);
    try {
      const result = await searchTrucksAction(search, page, PAGE_SIZE);
      setTrucks(result.data.map(mapTruckData));
      setTotal(result.count);
    } catch {
      setTrucks([]);
      setTotal(0);
    }
    setLoading(false);
  }, [search, page]);

  useEffect(() => {
    fetchTrucks();
  }, [fetchTrucks]);

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
