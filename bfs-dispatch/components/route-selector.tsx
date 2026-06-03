"use client";

import { useState, useEffect } from "react";
import { Plus, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getRoutesWithDetails } from "@/lib/actions";
import { NewRouteModal } from "@/components/new-route-modal";

type RouteOption = { id: number; label: string; miles: number | null };

interface RouteSelectorProps {
  value: number | null;
  onChange: (routeId: number | null) => void;
  label?: string;
  error?: string;
}

export function RouteSelector({ value, onChange, label, error }: RouteSelectorProps) {
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoutes();
  }, []);

  async function fetchRoutes() {
    try {
      const data = await getRoutesWithDetails();
      const routeOptions: RouteOption[] = data.map((r) => ({
        id: r.route_id,
        label: `${r.origin.formatted_address} → ${r.destination.formatted_address}`,
        miles: r.miles,
      }));
      setRoutes(routeOptions);
    } catch (e) {
      console.error("Error fetching routes:", e);
    } finally {
      setLoading(false);
    }
  }

  const selectedRoute = routes.find((r) => r.id === value);

  function handleRouteCreated(routeId: number) {
    fetchRoutes();
    onChange(routeId);
  }

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {label}
        </label>
      )}

      <div className="flex gap-2">
        <div className="relative flex-1">
          <button
            type="button"
            onClick={() => !loading && setOpen(!open)}
            className={cn(
              "flex h-9 w-full items-center justify-between rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-2 text-sm",
              "hover:bg-zinc-50 dark:hover:bg-zinc-900",
              "focus:outline-none focus:ring-2 focus:ring-ring/50",
              error && "border-red-500"
            )}
          >
            <span className={selectedRoute ? "text-zinc-900 dark:text-zinc-50" : "text-zinc-400"}>
              {selectedRoute ? (
                <span>
                  {selectedRoute.label}
                  <span className="ml-2 text-zinc-400">({selectedRoute.miles} mi)</span>
                </span>
              ) : (
                loading ? "Cargando rutas..." : "Seleccionar ruta"
              )}
            </span>
            <ChevronDown className={cn("h-4 w-4 text-zinc-400 transition-transform", open && "rotate-180")} />
          </button>

          {open && (
            <div className="absolute z-50 mt-1 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-lg">
              <div className="max-h-60 overflow-auto p-1">
                {routes.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-zinc-400">
                    No hay rutas disponibles
                  </div>
                ) : (
                  routes.map((route) => (
                    <button
                      key={route.id}
                      type="button"
                      onClick={() => {
                        onChange(route.id);
                        setOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between rounded-sm px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100",
                        "hover:bg-zinc-100 dark:hover:bg-zinc-800",
                        route.id === value && "bg-zinc-100 dark:bg-zinc-800"
                      )}
                    >
                      <div>
                        <div>{route.label}</div>
                        <div className="text-xs text-zinc-400">{route.miles} millas</div>
                      </div>
                      {route.id === value && <Check className="h-4 w-4 text-emerald-500" />}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setModalOpen(true)}
          className="gap-1"
        >
          <Plus className="h-4 w-4" />
          Nueva Ruta
        </Button>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <NewRouteModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onRouteCreated={handleRouteCreated}
      />
    </div>
  );
}
