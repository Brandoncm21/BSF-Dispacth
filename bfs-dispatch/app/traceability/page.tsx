"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { TruckBadge } from "@/components/truck-badge";
import { TruckTimeline } from "@/components/truck-timeline";
import { FleetAlerts } from "@/components/fleet-alerts";
import { getFleetOverview, getFleetAlerts, getTruckLoadHistory, TruckWithAvailability, FleetAlert, TruckLoadHistory } from "@/lib/actions";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type FleetByCarrier = Record<string, TruckWithAvailability[]>;

export default function TraceabilityPage() {
  const [fleetByCarrier, setFleetByCarrier] = useState<FleetByCarrier>({});
  const [alerts, setAlerts] = useState<FleetAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCarrier, setExpandedCarrier] = useState<string | null>(null);
  const [selectedTruck, setSelectedTruck] = useState<number | null>(null);
  const [truckHistory, setTruckHistory] = useState<TruckLoadHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [fleetData, alertsData] = await Promise.all([
        getFleetOverview(),
        getFleetAlerts(),
      ]);
      setFleetByCarrier(fleetData);
      setAlerts(alertsData);

      const firstCarrier = Object.keys(fleetData)[0];
      if (firstCarrier) {
        setExpandedCarrier(firstCarrier);
      }
    } catch (e) {
      console.error("Error fetching fleet data:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleTruckSelect(truckId: number) {
    setSelectedTruck(truckId);
    setLoadingHistory(true);
    try {
      const history = await getTruckLoadHistory(truckId, 30);
      setTruckHistory(history);
    } catch (e) {
      console.error("Error fetching truck history:", e);
    } finally {
      setLoadingHistory(false);
    }
  }

  function handleAlertTruckClick(truckId: number) {
    const truck = Object.values(fleetByCarrier).flat().find((t) => t.truck_id === truckId);
    if (truck) {
      setExpandedCarrier(truck.carrier_name);
      handleTruckSelect(truckId);
    }
  }

  const statusSummary = {
    disponible: Object.values(fleetByCarrier).flat().filter((t) => t.availability_status === "disponible").length,
    en_ruta: Object.values(fleetByCarrier).flat().filter((t) => t.availability_status === "en_ruta").length,
    maintenance: Object.values(fleetByCarrier).flat().filter((t) => t.availability_status === "maintenance").length,
  };

  const selectedTruckData = selectedTruck
    ? Object.values(fleetByCarrier).flat().find((t) => t.truck_id === selectedTruck)
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Trazabilidad de Flota</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
          Monitorea el estado de todos los camiones de la flota
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
            {statusSummary.disponible}
          </div>
          <div className="text-sm text-emerald-600 dark:text-emerald-300">Disponibles</div>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">
            {statusSummary.en_ruta}
          </div>
          <div className="text-sm text-amber-600 dark:text-amber-300">En Ruta</div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-red-700 dark:text-red-400">
            {statusSummary.maintenance}
          </div>
          <div className="text-sm text-red-600 dark:text-red-300">En Mantenimiento</div>
        </div>
        <div className="bg-zinc-50 dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-zinc-700 dark:text-zinc-300">
            {statusSummary.disponible + statusSummary.en_ruta + statusSummary.maintenance}
          </div>
          <div className="text-sm text-zinc-600 dark:text-zinc-400">Total Flota</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-lg font-semibold">Flota por Carrier</h2>
            </div>
            <div className="p-4 space-y-3 max-h-[600px] overflow-auto">
              {Object.entries(fleetByCarrier).map(([carrierName, trucks]) => (
                <div key={carrierName} className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedCarrier(expandedCarrier === carrierName ? null : carrierName)}
                    className="flex w-full items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {expandedCarrier === carrierName ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <span className="font-medium">{carrierName}</span>
                      <span className="text-xs text-zinc-500">({trucks.length} camiones)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {trucks.filter((t) => t.availability_status === "disponible").length > 0 && (
                        <span className="flex items-center gap-1 text-xs text-emerald-600">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          {trucks.filter((t) => t.availability_status === "disponible").length}
                        </span>
                      )}
                      {trucks.filter((t) => t.availability_status === "en_ruta").length > 0 && (
                        <span className="flex items-center gap-1 text-xs text-amber-600">
                          <span className="h-2 w-2 rounded-full bg-amber-500" />
                          {trucks.filter((t) => t.availability_status === "en_ruta").length}
                        </span>
                      )}
                      {trucks.filter((t) => t.availability_status === "maintenance").length > 0 && (
                        <span className="flex items-center gap-1 text-xs text-red-600">
                          <span className="h-2 w-2 rounded-full bg-red-500" />
                          {trucks.filter((t) => t.availability_status === "maintenance").length}
                        </span>
                      )}
                    </div>
                  </button>

                  {expandedCarrier === carrierName && (
                    <div className="divide-y divide-zinc-200 dark:divide-zinc-700">
                      {trucks.map((truck) => (
                        <div
                          key={truck.truck_id}
                          onClick={() => handleTruckSelect(truck.truck_id)}
                          className={cn(
                            "flex items-center justify-between p-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors",
                            selectedTruck === truck.truck_id && "bg-blue-50 dark:bg-blue-900/20"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <TruckBadge status={truck.availability_status} showLabel={false} />
                            <div>
                              <div className="font-medium">{truck.unit_number}</div>
                              <div className="text-xs text-zinc-500">{truck.vehicle_type}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            {truck.current_route ? (
                              <div className="text-xs text-zinc-500">
                                <span className="font-medium">{truck.current_load_status?.replace("_", " ")}</span>
                                <div className="max-w-[200px] truncate">{truck.current_route}</div>
                              </div>
                            ) : (
                              <span className="text-xs text-zinc-400">Sin carga asignada</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-lg font-semibold">Alertas</h2>
            </div>
            <div className="p-4 max-h-[300px] overflow-auto">
              <FleetAlerts alerts={alerts} onTruckClick={handleAlertTruckClick} />
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-lg font-semibold">Timeline</h2>
            </div>
            <div className="p-4 max-h-[400px] overflow-auto">
              {selectedTruckData ? (
                loadingHistory ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
                  </div>
                ) : (
                  <TruckTimeline
                    truckId={selectedTruckData.truck_id}
                    unitNumber={selectedTruckData.unit_number}
                    history={truckHistory}
                  />
                )
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-zinc-500">
                  <p className="text-sm">Selecciona un camión para ver su historial</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}