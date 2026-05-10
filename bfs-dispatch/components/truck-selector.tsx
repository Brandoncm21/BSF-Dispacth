"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronDown, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTrucksWithAvailability, TruckWithAvailability } from "@/lib/actions";
import { TruckBadge } from "@/components/truck-badge";

interface TruckSelectorProps {
  value: number | null;
  onChange: (truckId: number | null) => void;
  carrierId?: number | null;
  label?: string;
  error?: string;
  disabled?: boolean;
}

export function TruckSelector({
  value,
  onChange,
  carrierId,
  label,
  error,
  disabled = false,
}: TruckSelectorProps) {
  const [trucks, setTrucks] = useState<TruckWithAvailability[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchTrucks = useCallback(async () => {
    try {
      const data = await getTrucksWithAvailability();
      setTrucks(data);
    } catch (e) {
      console.error("Error fetching trucks:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrucks();
  }, [fetchTrucks]);

  const filteredTrucks = carrierId
    ? trucks.filter((t) => t.carrier_id === carrierId)
    : trucks;

  const availableTrucks = filteredTrucks.filter((t) => t.availability_status !== "maintenance");
  const maintenanceTrucks = filteredTrucks.filter((t) => t.availability_status === "maintenance");
  const showAll = filteredTrucks.length !== availableTrucks.length;

  const selectedTruck = trucks.find((t) => t.truck_id === value);

  function handleSelect(truckId: number) {
    const truck = trucks.find((t) => t.truck_id === truckId);
    if (truck?.availability_status === "maintenance") {
      return;
    }
    onChange(truckId);
    setOpen(false);
  }

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {label}
        </label>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && !loading && setOpen(!open)}
          disabled={disabled || loading}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-sm",
            "hover:bg-zinc-50 dark:hover:bg-zinc-900",
            "focus:outline-none focus:ring-2 focus:ring-ring/50",
            disabled && "cursor-not-allowed opacity-50",
            error && "border-red-500"
          )}
        >
          <span className={selectedTruck ? "text-zinc-900 dark:text-zinc-50" : "text-zinc-400"}>
            {loading ? (
              "Cargando..."
            ) : selectedTruck ? (
              <span className="flex items-center gap-2">
                {selectedTruck.unit_number}
                <TruckBadge status={selectedTruck.availability_status} showLabel={false} size="sm" />
              </span>
            ) : (
              "Seleccionar camión"
            )}
          </span>
          <ChevronDown className={cn("h-4 w-4 text-zinc-400 transition-transform", open && "rotate-180")} />
        </button>

        {open && (
          <div className="absolute z-50 mt-1 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-lg">
            <div className="max-h-80 overflow-auto p-1">
              {loading ? (
                <div className="px-3 py-2 text-sm text-zinc-400">Cargando...</div>
              ) : filteredTrucks.length === 0 ? (
                <div className="px-3 py-2 text-sm text-zinc-400">No hay camiones disponibles</div>
              ) : (
                <>
                  {availableTrucks.length > 0 && (
                    <div className="space-y-1">
                      {showAll && (
                        <div className="px-3 py-1 text-xs font-medium text-zinc-500 uppercase">Disponibles</div>
                      )}
                      {availableTrucks.map((truck) => (
                        <button
                          key={truck.truck_id}
                          type="button"
                          onClick={() => handleSelect(truck.truck_id)}
                          className={cn(
                            "flex w-full items-center justify-between rounded-sm px-3 py-2 text-sm",
                            "hover:bg-zinc-100 dark:hover:bg-zinc-800",
                            truck.truck_id === value && "bg-zinc-100 dark:bg-zinc-800"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <TruckBadge status={truck.availability_status} showLabel={false} />
                            <div className="text-left">
                              <div className="font-medium text-zinc-900 dark:text-zinc-100">
                                {truck.unit_number}
                              </div>
                              <div className="text-xs text-zinc-500">
                                {truck.carrier_name}
                                {truck.current_route && (
                                  <span className="ml-2 text-amber-600 dark:text-amber-400">
                                    → {truck.current_route}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          {truck.truck_id === value && (
                            <Check className="h-4 w-4 text-emerald-500" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {maintenanceTrucks.length > 0 && (
                    <div className="mt-2 border-t border-zinc-200 dark:border-zinc-700 pt-2">
                      <div className="px-3 py-1 text-xs font-medium text-zinc-500 uppercase flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        En Mantenimiento
                      </div>
                      {maintenanceTrucks.map((truck) => (
                        <button
                          key={truck.truck_id}
                          type="button"
                          disabled
                          className={cn(
                            "flex w-full items-center justify-between rounded-sm px-3 py-2 text-sm opacity-50 cursor-not-allowed"
                          )}
                          title="Camión en mantenimiento. Contacte al administrador."
                        >
                          <div className="flex items-center gap-3">
                            <TruckBadge status={truck.availability_status} showLabel={false} />
                            <div className="text-left">
                              <div className="font-medium text-zinc-900 dark:text-zinc-100">
                                {truck.unit_number}
                              </div>
                              <div className="text-xs text-zinc-500">
                                {truck.carrier_name}
                              </div>
                            </div>
                          </div>
                          <span className="text-xs text-zinc-400">Bloqueado</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}