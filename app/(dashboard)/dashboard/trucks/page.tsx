"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Edit2, Grid, List, Wrench, ChevronDown, ChevronUp, Truck as TruckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TruckStatusBadge } from "@/components/truck-status-badge";
import { TruckFormSheet } from "@/components/truck-form-sheet";
import { MaintenanceDrawer } from "@/components/maintenance-drawer";
import { searchTrucks as searchTrucksAction, getTruckLoadHistory, TruckWithSmartStatus, TruckLoadHistory } from "@/lib/actions";
import { cn } from "@/lib/utils";
import { TableSkeleton } from "@/components/table-skeleton";
import { PaginationControls } from "@/components/pagination-controls";

type TruckSearchResult = {
  truck_id: number;
  unit_number: string;
  vehicle_type: string;
  operational_status: string;
  carrier_id: number;
  carrier_company_name: string;
  capacity: string | null;
  plate_number: string | null;
  vin: string | null;
  truck_name: string | null;
  empty_weight: number | null;
  driver_id: number | null;
  driver_first_name: string | null;
  driver_last_name: string | null;
  fuel_type: string | null;
  fuel_cost_per_mile: number | null;
};

function mapTruckData(raw: TruckSearchResult): TruckWithSmartStatus {
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
    vehicle_type: raw.vehicle_type || "N/A",
    capacity: raw.capacity as string | null,
    operational_status: raw.operational_status,
    carrier_id: raw.carrier_id,
    carrier_name: raw.carrier_company_name || "N/A",
    smart_status: smartStatus,
    status_reason: statusReason,
    current_load_id: null,
    current_load_number: null,
    plate_number: raw.plate_number || null,
    vin: raw.vin || null,
    truck_name: raw.truck_name || null,
    empty_weight: raw.empty_weight || null,
    driver_id: raw.driver_id || null,
    driver_first_name: raw.driver_first_name || null,
    driver_last_name: raw.driver_last_name || null,
    fuel_type: raw.fuel_type || null,
    fuel_cost_per_mile: raw.fuel_cost_per_mile || null,
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
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [maintenanceTruck, setMaintenanceTruck] = useState<TruckWithSmartStatus | null>(null);
  const [expandedTrucks, setExpandedTrucks] = useState<Set<number>>(new Set());
  const [truckHistory, setTruckHistory] = useState<Record<number, TruckLoadHistory[]>>({});

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

  async function toggleHistory(truckId: number) {
    if (expandedTrucks.has(truckId)) {
      setExpandedTrucks((prev) => {
        const next = new Set(prev);
        next.delete(truckId);
        return next;
      });
      return;
    }

    setExpandedTrucks((prev) => new Set(prev).add(truckId));

    if (!truckHistory[truckId]) {
      try {
        const history = await getTruckLoadHistory(truckId, 30);
        setTruckHistory((prev) => ({ ...prev, [truckId]: history.slice(0, 5) }));
      } catch (e) {
        console.error("Error fetching truck history:", e);
        setTruckHistory((prev) => ({ ...prev, [truckId]: [] }));
      }
    }
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
        <div className="flex items-center gap-3">
          <div className="flex items-center border border-zinc-200 dark:border-zinc-700 rounded-md overflow-hidden">
            <button
              onClick={() => setViewMode("table")}
              className={cn(
                "p-2 transition-colors",
                viewMode === "table" ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50" : "text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900"
              )}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("cards")}
              className={cn(
                "p-2 transition-colors",
                viewMode === "cards" ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50" : "text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900"
              )}
            >
              <Grid className="h-4 w-4" />
            </button>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Agregar Camión
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <Input
          placeholder="Buscar por unit number, placa, VIN o carrier..."
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
      ) : viewMode === "table" ? (
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
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-500 dark:text-zinc-400">Fuel</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-zinc-500 dark:text-zinc-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                {trucks.map((truck) => (
                  <tr key={truck.truck_id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">{truck.unit_number}</span>
                        {truck.truck_name && (
                          <span className="ml-2 text-xs text-zinc-500">— {truck.truck_name}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{truck.carrier_name}</td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{truck.vehicle_type}</td>
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
                    <td className="px-4 py-3">
                      {truck.fuel_type ? (
                        <div>
                          <span className="text-xs font-medium capitalize">{truck.fuel_type}</span>
                          <span className="text-xs text-zinc-400 ml-1">
                            ${truck.fuel_cost_per_mile?.toFixed(2)}/mi
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleHistory(truck.truck_id)}
                          title="Ver historial"
                        >
                          {expandedTrucks.has(truck.truck_id) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setMaintenanceTruck(truck)}
                          title="Mantenimiento"
                        >
                          <Wrench className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(truck)}
                          disabled={truck.smart_status === "in_route"}
                          className={cn(truck.smart_status === "in_route" && "opacity-50 cursor-not-allowed")}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
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
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {trucks.map((truck) => (
              <TruckCard
                key={truck.truck_id}
                truck={truck}
                isExpanded={expandedTrucks.has(truck.truck_id)}
                history={truckHistory[truck.truck_id] || []}
                onToggleHistory={() => toggleHistory(truck.truck_id)}
                onEdit={() => handleEdit(truck)}
                onMaintenance={() => setMaintenanceTruck(truck)}
              />
            ))}
          </div>
          {trucks.length === 0 && (
            <div className="py-12 text-center text-zinc-500">No hay camiones registrados</div>
          )}
          <PaginationControls currentPage={page} totalItems={total} pageSize={PAGE_SIZE} onPageChange={setPage} />
        </>
      )}

      <TruckFormSheet open={sheetOpen} onOpenChange={setSheetOpen} truck={editingTruck} onSuccess={handleSuccess} />

      {maintenanceTruck && (
        <MaintenanceDrawer
          open={!!maintenanceTruck}
          onOpenChange={(open) => !open && setMaintenanceTruck(null)}
          truck={maintenanceTruck}
        />
      )}
    </div>
  );
}

function TruckCard({
  truck,
  isExpanded,
  history,
  onToggleHistory,
  onEdit,
  onMaintenance,
}: {
  truck: TruckWithSmartStatus;
  isExpanded: boolean;
  history: TruckLoadHistory[];
  onToggleHistory: () => void;
  onEdit: () => void;
  onMaintenance: () => void;
}) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TruckIcon className="h-5 w-5 text-zinc-400" />
            <div>
              <h3 className="font-bold text-zinc-900 dark:text-zinc-50">{truck.truck_name || truck.unit_number}</h3>
              <p className="text-xs text-zinc-500">{truck.unit_number}</p>
            </div>
          </div>
          <TruckStatusBadge status={truck.smart_status} reason={truck.status_reason} />
        </div>
      </div>

      <div className="p-4 space-y-2 text-sm">
        <div className="grid grid-cols-2 gap-x-4">
          <div>
            <p className="text-zinc-500 text-xs">Placa</p>
            <p className="font-medium font-mono">{truck.plate_number || "—"}</p>
          </div>
          <div>
            <p className="text-zinc-500 text-xs">VIN</p>
            <p className="font-medium font-mono text-xs truncate">{truck.vin || "—"}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-4">
          <div>
            <p className="text-zinc-500 text-xs">Peso Vacío</p>
            <p className="font-medium">{truck.empty_weight ? `${truck.empty_weight.toLocaleString()} lbs` : "—"}</p>
          </div>
          <div>
            <p className="text-zinc-500 text-xs">Tipo</p>
            <p className="font-medium">{truck.vehicle_type}</p>
          </div>
        </div>
        <div>
          <p className="text-zinc-500 text-xs">Carrier</p>
          <p className="font-medium">{truck.carrier_name}</p>
        </div>
        {truck.driver_first_name && (
          <div>
            <p className="text-zinc-500 text-xs">Chofer Asignado</p>
            <p className="font-medium">{truck.driver_first_name} {truck.driver_last_name}</p>
          </div>
        )}
        {truck.fuel_type && (
          <div className="border-t border-zinc-200 dark:border-zinc-700 pt-2 mt-1">
            <div className="grid grid-cols-2 gap-x-4">
              <div>
                <p className="text-zinc-500 text-xs">Combustible</p>
                <p className="font-medium capitalize">{truck.fuel_type}</p>
              </div>
              <div>
                <p className="text-zinc-500 text-xs">Costo por Milla</p>
                <p className="font-medium">${truck.fuel_cost_per_mile?.toFixed(2)}/mi</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {history.length > 0 && isExpanded && (
        <div className="px-4 pb-4">
          <div className="text-xs text-zinc-500 mb-2">Últimas {history.length} cargas</div>
          <div className="space-y-1">
            {history.map((load) => (
              <div key={load.load_id} className="flex items-center justify-between text-xs p-2 bg-zinc-50 dark:bg-zinc-800 rounded">
                <div>
                  <span className="font-mono text-blue-600 dark:text-blue-400">{load.load_number}</span>
                  <span className="ml-2 text-zinc-500">{load.origin} → {load.destination}</span>
                </div>
                <Badge variant={load.load_status === "delivered" ? "default" : "secondary"} className="text-xs">
                  {load.load_status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleHistory}
          className="text-xs"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-3 w-3 mr-1" />
              Ocultar historial
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3 mr-1" />
              Ver historial
            </>
          )}
        </Button>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={onMaintenance} title="Mantenimiento">
            <Wrench className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onEdit} disabled={truck.smart_status === "in_route"}>
            <Edit2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}