"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Loader2, MapPin, Clock, Edit2, User } from "lucide-react";
import { getTruckLoadHistory } from "@/lib/actions";

type Driver = {
  driver_id: number;
  first_name: string;
  last_name: string;
  phone_number: string | null;
  license_type: string | null;
  cdl_number: string | null;
  carrier_id: number;
  has_twic_card: boolean;
  status_id: number;
  carriers: { company_name?: string; first_name?: string; last_name?: string } | null;
  record_status: { status_name: string } | null;
};

interface DriverHistoryItem {
  load_id: number;
  load_number: string;
  load_date: string;
  origin: string;
  destination: string;
  load_status: string;
  rate: number;
  driver_id?: number;
}

type Props = {
  driver: Driver | null;
  onOpenChange: (open: boolean) => void;
  onEdit: (driver: Driver) => void;
};

export function DriverSheetDetails({ driver, onOpenChange, onEdit }: Props) {
  const [driverHistory, setDriverHistory] = useState<DriverHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (driver) {
      setLoadingHistory(true);
      getTruckLoadHistory(driver.carrier_id, 30)
        .then((data) => setDriverHistory((data || []).slice(0, 5) as DriverHistoryItem[]))
        .catch(() => setDriverHistory([]))
        .finally(() => setLoadingHistory(false));
    }
  }, [driver]);

  function getCarrierName(carrier: Driver["carriers"]) {
    return carrier?.company_name || (carrier?.first_name ? `${carrier.first_name} ${carrier.last_name}` : "—");
  }

  return (
    <Sheet open={!!driver} onOpenChange={(open) => { if (!open) onOpenChange(false); }}>
      <SheetContent className="sm:max-w-[500px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Detalles del Driver</SheetTitle>
          <SheetDescription>
            {driver?.first_name} {driver?.last_name}
          </SheetDescription>
        </SheetHeader>

        {driver && (
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-zinc-500">Teléfono</p>
                <p className="text-sm font-medium">{driver.phone_number || "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-zinc-500">Licencia</p>
                <p className="text-sm font-medium">{driver.license_type || "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-zinc-500">CDL</p>
                <p className="text-sm font-medium font-mono">{driver.cdl_number || "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-zinc-500">TWIC Card</p>
                <p className="text-sm">
                  {driver.has_twic_card ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">Sí posee</span>
                  ) : (
                    <span className="text-zinc-400">No posee</span>
                  )}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-zinc-500">Carrier</p>
                <p className="text-sm font-medium">{getCarrierName(driver.carriers)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-zinc-500">Estado</p>
                <Badge
                  variant={
                    driver.record_status?.status_name === "Activo"
                      ? "default"
                      : driver.record_status?.status_name === "Pendiente"
                      ? "secondary"
                      : "destructive"
                  }
                >
                  {driver.record_status?.status_name || "—"}
                </Badge>
              </div>
            </div>

            <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4">
              <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Últimos Viajes
              </h3>

              {loadingHistory ? (
                <div className="text-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-zinc-400" />
                </div>
              ) : driverHistory.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center py-4">No hay viajes recientes</p>
              ) : (
                <div className="space-y-2">
                  {driverHistory.map((trip) => (
                    <div key={trip.load_id} className="p-3 border border-zinc-200 dark:border-zinc-700 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-sm text-blue-600 dark:text-blue-400">{trip.load_number}</span>
                        <Badge variant={trip.load_status === "delivered" ? "default" : "secondary"} className="text-xs">
                          {trip.load_status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-zinc-500">
                        <MapPin className="h-3 w-3" />
                        {trip.origin} → {trip.destination}
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-zinc-400">{new Date(trip.load_date).toLocaleDateString("es-CR")}</span>
                        <span className="text-sm font-medium">${trip.rate?.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4 flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { onOpenChange(false); onEdit(driver); }}>
                <Edit2 className="h-4 w-4 mr-1" />
                Editar
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
