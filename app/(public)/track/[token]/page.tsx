import { notFound } from "next/navigation";
import { Truck, Clock, MapPin } from "lucide-react";
import { getLoadTrack } from "@/lib/actions";
import { TrackingPageClient } from "./tracking-page-client";

type Props = {
  params: Promise<{ token: string }>;
};

const LOAD_STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  booked: "Reservado",
  picked_up: "Recogido",
  delivered: "Entregado",
  paid: "Pagado",
  cancelled: "Cancelada",
  delayed: "Retrasada",
};

const LOAD_STATUS_PROGRESS: Record<string, number> = {
  pending: 10,
  booked: 25,
  picked_up: 50,
  delivered: 85,
  paid: 100,
  cancelled: 0,
  delayed: 50,
};

const LOAD_STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500",
  booked: "bg-blue-500",
  picked_up: "bg-purple-500",
  delivered: "bg-green-500",
  paid: "bg-emerald-500",
  cancelled: "bg-red-500",
  delayed: "bg-orange-500",
};

export default async function TrackPage({ params }: Props) {
  const { token } = await params;
  const data = await getLoadTrack(token);

  if (!data) {
    notFound();
  }

  const { load, checkpoints, route } = data;
  const progress = LOAD_STATUS_PROGRESS[load.load_status || ""] || 0;
  const color = LOAD_STATUS_COLORS[load.load_status || ""] || "bg-zinc-400";
  const label = LOAD_STATUS_LABELS[load.load_status || ""] || load.load_status;

  const carrierName = load.carriers
    ? String(Array.isArray(load.carriers)
      ? (load.carriers[0] as Record<string, unknown>)?.company_name || ""
      : (load.carriers as Record<string, unknown>)?.company_name || "")
    : "";

  const driverFirst = load.drivers
    ? String(Array.isArray(load.drivers)
      ? (load.drivers[0] as Record<string, unknown>)?.first_name || ""
      : (load.drivers as Record<string, unknown>)?.first_name || "")
    : "";

  const driverLast = load.drivers
    ? String(Array.isArray(load.drivers)
      ? (load.drivers[0] as Record<string, unknown>)?.last_name || ""
      : (load.drivers as Record<string, unknown>)?.last_name || "")
    : "";

  return (
    <div className="max-w-full sm:max-w-2xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
      {/* BFS Solutions branding */}
      <div className="flex items-center gap-2 mb-6">
        <Truck className="h-5 w-5 text-zinc-900" />
        <span className="text-lg font-bold text-zinc-900">BestFreight</span>
      </div>

      <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-zinc-100">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-2xl font-bold text-zinc-900">
              Carga #{load.load_number || load.load_id}
            </h1>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${color}`}>
              {label}
            </span>
          </div>
          {carrierName && (
            <p className="text-sm text-zinc-500">
              Carrier: {carrierName}
            </p>
          )}
          {driverFirst && (
            <p className="text-sm text-zinc-500">
              Conductor: {driverFirst} {driverLast}
            </p>
          )}
        </div>

        {/* Progress bar */}
        <div className="px-6 py-4 bg-zinc-50">
          <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
            <span>Pendiente</span>
            <span>Reservado</span>
            <span>Recogido</span>
            <span>Entregado</span>
          </div>
          <div className="h-2 bg-zinc-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${color}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Route info */}
        {route && (
          <div className="px-6 py-4 border-b border-zinc-100">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-green-500" />
                <span>{route.origin_state_name}</span>
              </div>
              <span className="text-zinc-300">→</span>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-red-500" />
                <span>{route.destination_state_name}</span>
              </div>
              {route.miles && (
                <span className="text-zinc-400 ml-auto">{route.miles} mi</span>
              )}
            </div>
          </div>
        )}

        {/* Map */}
        <div className="border-b border-zinc-100">
          <TrackingPageClient
            checkpoints={checkpoints || []}
            loadId={load.load_id}
          />
        </div>

        {/* Checkpoint timeline */}
        <div className="p-6">
          <h2 className="text-sm font-semibold text-zinc-900 mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Historial de Rastreo
          </h2>

          {!checkpoints || checkpoints.length === 0 ? (
            <p className="text-sm text-zinc-400 italic">
              El conductor aún no ha reportado ubicaciones.
            </p>
          ) : (
            <div className="space-y-3">
              {checkpoints.slice(0, 10).map((cp: Record<string, unknown>) => (
                <div key={cp.checkpoint_id as number} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <div className="w-px flex-1 bg-zinc-200" />
                  </div>
                  <div className="pb-3">
                    <p className="text-sm font-medium">
                      {cp.status_at_checkpoint
                        ? LOAD_STATUS_LABELS[cp.status_at_checkpoint as string] || (cp.status_at_checkpoint as string)
                        : "Reporte de posición"}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {new Date(cp.recorded_at as string).toLocaleString("es-CR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    {(cp.notes as string) && (
                      <p className="text-xs text-zinc-400 mt-0.5">{cp.notes as string}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-6 text-xs text-zinc-400">
        BFS Solutions — Sistema de Rastreo de Cargas
      </div>
    </div>
  );
}

