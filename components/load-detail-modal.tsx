"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, Eye, Trash2, MapPin, Truck, User, Package, Route, DollarSign, Gauge, Calendar, FileWarning } from "lucide-react";
import { getLoadDocuments, getDocumentSignedUrl, deleteLoadDocument, getCheckpointHistory, calculateRouteMiles } from "@/lib/actions";
import { formatTimestamp, formatDollarPerMile } from "@/lib/format";
import { LOAD_STATUS_LABELS, LOAD_STATUS_COLORS, LoadStatus } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { Load } from "@/types/load";
import type { WaypointData } from "@/components/tracking-map";

const TrackingMapWithNoSSR = dynamic(
  () => import("@/components/tracking-map").then((mod) => ({ default: mod.TrackingMap })),
  { ssr: false }
);

type Checkpoint = {
  checkpoint_id: number;
  lat: number;
  lng: number;
  status_at_checkpoint: string | null;
  recorded_at: string;
  notes: string | null;
};

type Props = {
  load: Load;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type TabId = "general" | "docs" | "tracking";

export function LoadDetailModal({ load, open, onOpenChange }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("general");

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) onOpenChange(false); }}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Detalles de Carga
            <span className="text-zinc-500 font-mono">#{load.load_number || load.load_id}</span>
          </DialogTitle>
        </DialogHeader>

        {/* Tab bar */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 -mx-6 px-6">
          {([
            { id: "general" as const, label: "Información General", Icon: FileWarning },
            { id: "docs" as const, label: "Documentos Adjuntos", Icon: FileText },
            { id: "tracking" as const, label: "Mapa de Tracking", Icon: MapPin },
          ]).map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
                activeTab === id
                  ? "border-zinc-900 dark:border-zinc-50 text-zinc-900 dark:text-zinc-50"
                  : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="pt-4">
          {activeTab === "general" && <TabGeneral load={load} />}
          {activeTab === "docs" && <TabDocs loadId={load.load_id} />}
          {activeTab === "tracking" && <TabTracking loadId={load.load_id} load={load} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TabGeneral({ load }: { load: Load }) {
  const statusKey = (load.load_status || "pending") as LoadStatus;
  const fee = load.rate && load.dispatch_fee_pct
    ? (load.rate * load.dispatch_fee_pct) / 100
    : null;

  const fields: Array<{ label: string; value: string | null; icon: React.ReactNode }> = [
    { label: "Número de Carga", value: load.load_number || `#${load.load_id}`, icon: <FileWarning className="h-4 w-4 text-zinc-400" /> },
    { label: "Carrier", value: load.carrier_name, icon: <Truck className="h-4 w-4 text-zinc-400" /> },
    { label: "Conductor", value: load.driver_name, icon: <User className="h-4 w-4 text-zinc-400" /> },
    { label: "Broker", value: load.broker_name || "Sin broker", icon: <User className="h-4 w-4 text-zinc-400" /> },
    { label: "Unidad", value: load.unit_number, icon: <Truck className="h-4 w-4 text-zinc-400" /> },
    { label: "Tipo de Carga", value: load.cargo_type_name, icon: <Package className="h-4 w-4 text-zinc-400" /> },
    { label: "Millas", value: load.miles ? `${load.miles} mi` : null, icon: <Route className="h-4 w-4 text-zinc-400" /> },
    { label: "Rate", value: load.rate ? `$${load.rate.toLocaleString()}` : null, icon: <DollarSign className="h-4 w-4 text-zinc-400" /> },
    { label: "Dispatch Fee", value: fee ? `$${fee.toLocaleString("es-CR", { minimumFractionDigits: 2 })}` : null, icon: <DollarSign className="h-4 w-4 text-zinc-400" /> },
    { label: "$/Mile", value: formatDollarPerMile(load.rate, load.miles), icon: <Gauge className="h-4 w-4 text-zinc-400" /> },
    { label: "Status", value: LOAD_STATUS_LABELS[statusKey] || load.load_status, icon: null },
    { label: "Recogida (Pickup)", value: formatTimestamp(load.picked_up_at), icon: <Calendar className="h-4 w-4 text-zinc-400" /> },
    { label: "Entrega (Delivery)", value: formatTimestamp(load.delivered_at), icon: <Calendar className="h-4 w-4 text-zinc-400" /> },
    { label: "Notas", value: load.load_data || "Sin notas", icon: <FileWarning className="h-4 w-4 text-zinc-400" /> },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {fields.map((f) => (
        <div key={f.label} className="flex items-start gap-3 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
          <div className="mt-0.5">{f.icon}</div>
          <div className="min-w-0">
            <p className="text-xs text-zinc-500 uppercase tracking-wide">{f.label}</p>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 break-words">
              {f.label === "Status" ? (
                <span className={cn("inline-flex px-2 py-0.5 rounded-full text-xs font-medium", LOAD_STATUS_COLORS[statusKey])}>
                  {f.value}
                </span>
              ) : (
                f.value || "—"
              )}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function TabDocs({ loadId }: { loadId: number }) {
  const [docs, setDocs] = useState<{ document_id: number; document_type: string; file_name: string; file_path: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [docUrls, setDocUrls] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);

  async function loadDocs() {
    setLoading(true);
    setError(null);
    try {
      const items = await getLoadDocuments(loadId);
      setDocs(items);
      for (const doc of items) {
        try {
          const url = await getDocumentSignedUrl(doc.file_path);
          setDocUrls((prev) => ({ ...prev, [doc.document_id]: url }));
        } catch {
          // skip failed url fetch
        }
      }
    } catch {
      setError("Error al cargar documentos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDocs();
  }, [loadId]);

  async function handleDelete(docId: number, filePath: string) {
    if (!confirm("¿Eliminar este documento?")) return;
    try {
      await deleteLoadDocument(docId, filePath);
      loadDocs();
    } catch {
      setError("Error al eliminar");
    }
  }

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-zinc-400" /></div>;
  }

  return (
    <div className="py-2">
      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
      {docs.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">
          <FileText className="h-12 w-12 mx-auto mb-3 text-zinc-300" />
          <p>No hay documentos adjuntos</p>
          <p className="text-xs mt-1">Sube RC o BOL al crear o editar la carga</p>
        </div>
      ) : (
        <div className="space-y-3">
          {docs.map((doc) => (
            <div key={doc.document_id} className="flex items-center justify-between p-3 border border-zinc-200 dark:border-zinc-700 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-red-500" />
                <div>
                  <p className="font-medium text-sm">{doc.document_type}</p>
                  <p className="text-xs text-zinc-500">{doc.file_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {docUrls[doc.document_id] && (
                  <a
                    href={docUrls[doc.document_id]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30"
                  >
                    <Eye className="h-4 w-4" />
                    Ver
                  </a>
                )}
                <Button variant="ghost" size="icon" onClick={() => handleDelete(doc.document_id, doc.file_path)} className="text-red-500">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TabTracking({ loadId, load }: { loadId: number; load: Load }) {
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [routeOrigin, setRouteOrigin] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [routeDest, setRouteDest] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [waypoints, setWaypoints] = useState<WaypointData[]>([]);
  const [routeGeometry, setRouteGeometry] = useState<{ type: "LineString"; coordinates: number[][] } | null>(null);
  const supabase = useRef(createSupabaseBrowserClient());

  useEffect(() => {
    async function fetchTrackingData() {
      setLoading(true);
      try {
        const data = await getCheckpointHistory(loadId);
        setCheckpoints(data as Checkpoint[]);

        // Fetch route info for origin/dest/waypoints
        const { data: loadData } = await supabase.current
          .from("loads")
          .select("route_id")
          .eq("load_id", loadId)
          .maybeSingle();

        if (loadData?.route_id) {
          const { data: route } = await supabase.current
            .from("routes")
            .select("origin_location_id, destination_location_id, waypoints")
            .eq("route_id", loadData.route_id)
            .maybeSingle();

          if (route) {
            const locationIds: number[] = [];
            if (route.origin_location_id) locationIds.push(route.origin_location_id);
            if (route.destination_location_id) locationIds.push(route.destination_location_id);

            const rawWaypoints = (route.waypoints as Array<Record<string, unknown>>) || [];
            rawWaypoints.forEach((wp) => {
              if (wp.location_id) locationIds.push(wp.location_id as number);
            });

            if (locationIds.length > 0) {
              const { data: locs } = await supabase.current
                .from("locations")
                .select("location_id, lat, lng, formatted_address")
                .in("location_id", locationIds);

              const locMap: Record<number, { lat: number; lng: number; address: string }> = {};
              if (locs) {
                locs.forEach((loc: Record<string, unknown>) => {
                  locMap[loc.location_id as number] = {
                    lat: Number(loc.lat),
                    lng: Number(loc.lng),
                    address: (loc.formatted_address as string) || "",
                  };
                });
              }

              let originLat: number | null = null;
              let originLng: number | null = null;
              let destLat: number | null = null;
              let destLng: number | null = null;
              const routeWaypoints: WaypointData[] = [];

              if (route.origin_location_id && locMap[route.origin_location_id]) {
                const loc = locMap[route.origin_location_id];
                setRouteOrigin(loc);
                originLat = loc.lat;
                originLng = loc.lng;
              }

              if (route.destination_location_id && locMap[route.destination_location_id]) {
                const loc = locMap[route.destination_location_id];
                setRouteDest(loc);
                destLat = loc.lat;
                destLng = loc.lng;
              }

              if (rawWaypoints.length > 0) {
                const mapped = rawWaypoints
                  .map((wp: Record<string, unknown>) => {
                    const loc = wp.location_id ? locMap[wp.location_id as number] : null;
                    return {
                      sequence: Number(wp.sequence) || 0,
                      lat: loc?.lat ?? (wp.lat ? Number(wp.lat) : null),
                      lng: loc?.lng ?? (wp.lng ? Number(wp.lng) : null),
                      type: (wp.type as "pickup" | "delivery") || "pickup",
                      address: loc?.address || (wp.address as string) || null,
                    };
                  })
                  .filter((wp) => wp.lat != null && wp.lng != null);
                setWaypoints(mapped);
                mapped.forEach((wp) => routeWaypoints.push(wp));
              }

              // Fetch real road geometry from Mapbox Directions API
              if (originLat != null && originLng != null && destLat != null && destLng != null) {
                const waypointsForApi = routeWaypoints.map((wp) => ({
                  lat: wp.lat as number,
                  lng: wp.lng as number,
                }));
                const result = await calculateRouteMiles(
                  originLat,
                  originLng,
                  destLat,
                  destLng,
                  waypointsForApi.length > 0 ? waypointsForApi : undefined
                );
                if (result.geometry) {
                  setRouteGeometry(result.geometry);
                }
              }
            }
          }
        }
      } catch {
        setCheckpoints([]);
      } finally {
        setLoading(false);
      }
    }
    fetchTrackingData();
  }, [loadId]);

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-zinc-400" /></div>;
  }

  return (
    <div className="space-y-4">
      {checkpoints.length === 0 && !routeOrigin && !routeDest ? (
        <div className="text-center py-12 text-zinc-500">
          <MapPin className="h-12 w-12 mx-auto mb-3 text-zinc-300" />
          <p>No hay checkpoints registrados para esta carga</p>
          <p className="text-xs mt-1">Los checkpoints aparecerán cuando el conductor reporte su ubicación</p>
        </div>
      ) : (
        <>
          <div className="rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800">
            <TrackingMapWithNoSSR
              checkpoints={checkpoints}
              height="350px"
              showPopup={true}
              originLng={routeOrigin?.lng}
              originLat={routeOrigin?.lat}
              originAddress={routeOrigin?.address}
              destLng={routeDest?.lng}
              destLat={routeDest?.lat}
              destAddress={routeDest?.address}
              waypoints={waypoints}
              routeGeometry={routeGeometry}
            />
          </div>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            <p className="text-xs font-medium text-zinc-500 uppercase">Historial de Checkpoints</p>
            {checkpoints.sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()).slice(0, 10).map((cp) => (
              <div key={cp.checkpoint_id} className="flex gap-3 text-sm p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900">
                <div className="flex flex-col items-center">
                  <div className={cn(
                    "w-2.5 h-2.5 rounded-full",
                    cp.checkpoint_id === checkpoints[0]?.checkpoint_id ? "bg-emerald-500" : "bg-blue-500"
                  )} />
                  <div className="w-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
                </div>
                <div className="pb-2">
                  <p className="font-medium text-xs">
                    {cp.status_at_checkpoint
                      ? LOAD_STATUS_LABELS[cp.status_at_checkpoint as LoadStatus] || cp.status_at_checkpoint
                      : "Reporte de posición"}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {new Date(cp.recorded_at).toLocaleString("es-CR", {
                      year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                  {cp.notes && <p className="text-xs text-zinc-400 mt-0.5 italic">{cp.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

