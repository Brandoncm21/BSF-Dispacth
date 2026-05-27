"use client";

import { FleetAlert } from "@/lib/actions";
import { AlertTriangle, CheckCircle, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

interface FleetAlertsProps {
  alerts: FleetAlert[];
  onTruckClick?: (truckId: number) => void;
}

const alertConfig = {
  maintenance: {
    icon: Wrench,
    bgColor: "bg-red-50 dark:bg-red-900/20",
    borderColor: "border-red-200 dark:border-red-800",
    iconColor: "text-red-500",
    titleColor: "text-red-700 dark:text-red-400",
    messageColor: "text-red-600 dark:text-red-300",
  },
  delay: {
    icon: AlertTriangle,
    bgColor: "bg-amber-50 dark:bg-amber-900/20",
    borderColor: "border-amber-200 dark:border-amber-800",
    iconColor: "text-amber-500",
    titleColor: "text-amber-700 dark:text-amber-400",
    messageColor: "text-amber-600 dark:text-amber-300",
  },
  available: {
    icon: CheckCircle,
    bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
    borderColor: "border-emerald-200 dark:border-emerald-800",
    iconColor: "text-emerald-500",
    titleColor: "text-emerald-700 dark:text-emerald-400",
    messageColor: "text-emerald-600 dark:text-emerald-300",
  },
};

export function FleetAlerts({ alerts, onTruckClick }: FleetAlertsProps) {
  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-zinc-500">
        <CheckCircle className="h-8 w-8 mb-2" />
        <p className="text-sm">No hay alertas en este momento</p>
      </div>
    );
  }

  const maintenanceAlerts = alerts.filter((a) => a.alert_type === "maintenance");
  const delayAlerts = alerts.filter((a) => a.alert_type === "delay");
  const availableAlerts = alerts.filter((a) => a.alert_type === "available");

  return (
    <div className="space-y-4">
      {maintenanceAlerts.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium uppercase text-red-600 dark:text-red-400 flex items-center gap-1">
            <Wrench className="h-3 w-3" /> Requiere Atención
          </h4>
          {maintenanceAlerts.map((alert) => {
            const config = alertConfig.maintenance;
            return (
              <div
                key={alert.truck_id}
                onClick={() => onTruckClick?.(alert.truck_id)}
                className={cn(
                  "rounded-lg border p-3 cursor-pointer hover:opacity-90 transition-opacity",
                  config.bgColor,
                  config.borderColor
                )}
              >
                <div className="flex items-start gap-3">
                  <config.icon className={cn("h-4 w-4 mt-0.5", config.iconColor)} />
                  <div>
                    <p className={cn("font-medium text-sm", config.titleColor)}>
                      {alert.unit_number}
                    </p>
                    <p className={cn("text-xs", config.messageColor)}>
                      {alert.message}
                    </p>
                    {alert.current_route && (
                      <p className="text-xs text-zinc-500 mt-1">
                        Ruta actual: {alert.current_route}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {delayAlerts.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium uppercase text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> Posibles Delays
          </h4>
          {delayAlerts.map((alert) => {
            const config = alertConfig.delay;
            return (
              <div
                key={alert.truck_id}
                onClick={() => onTruckClick?.(alert.truck_id)}
                className={cn(
                  "rounded-lg border p-3 cursor-pointer hover:opacity-90 transition-opacity",
                  config.bgColor,
                  config.borderColor
                )}
              >
                <div className="flex items-start gap-3">
                  <config.icon className={cn("h-4 w-4 mt-0.5", config.iconColor)} />
                  <div>
                    <p className={cn("font-medium text-sm", config.titleColor)}>
                      {alert.unit_number}
                    </p>
                    <p className={cn("text-xs", config.messageColor)}>
                      {alert.message}
                    </p>
                    {alert.current_route && (
                      <p className="text-xs text-zinc-500 mt-1">
                        Ruta actual: {alert.current_route}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {availableAlerts.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium uppercase text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" /> Disponibles
          </h4>
          {availableAlerts.slice(0, 5).map((alert) => {
            const config = alertConfig.available;
            return (
              <div
                key={alert.truck_id}
                onClick={() => onTruckClick?.(alert.truck_id)}
                className={cn(
                  "rounded-lg border p-3 cursor-pointer hover:opacity-90 transition-opacity",
                  config.bgColor,
                  config.borderColor
                )}
              >
                <div className="flex items-start gap-3">
                  <config.icon className={cn("h-4 w-4 mt-0.5", config.iconColor)} />
                  <div>
                    <p className={cn("font-medium text-sm", config.titleColor)}>
                      {alert.unit_number}
                    </p>
                    <p className={cn("text-xs", config.messageColor)}>
                      {alert.message}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
          {availableAlerts.length > 5 && (
            <p className="text-xs text-zinc-500 text-center">
              +{availableAlerts.length - 5} más disponibles
            </p>
          )}
        </div>
      )}
    </div>
  );
}