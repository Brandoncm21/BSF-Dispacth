"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Loader2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { LOAD_STATUS } from "@/lib/constants";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

type LoadMarker = {
  load_id: number;
  load_number: string | null;
  driver_name: string | null;
  load_status: string | null;
  lat: number;
  lng: number;
  last_reported: string;
  checkpoint_notes: string | null;
  checkpoint_status: string | null;
};

function getMarkerColor(hoursAgo: number): string {
  if (hoursAgo <= 2) return "#10b981";
  if (hoursAgo <= 12) return "#f59e0b";
  return "#ef4444";
}

type Props = {
  height?: string;
  onReportCheckpoint?: (loadId: number) => void;
};

export function TrackingMapPins({ height = "400px", onReportCheckpoint }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const supabase = useRef(createSupabaseBrowserClient());
  const [loaded, setLoaded] = useState(false);
  const [markers, setMarkers] = useState<LoadMarker[]>([]);
  const [fetching, setFetching] = useState(true);

  // Fetch active loads with checkpoints
  useEffect(() => {
    async function fetchMarkers() {
      setFetching(true);
      try {
        const activeStatuses = [LOAD_STATUS.BOOKED, LOAD_STATUS.PICKED_UP];
        const { data: loads } = await supabase.current
          .from("loads")
          .select("load_id, load_number, load_status, driver_id, drivers!left(first_name, last_name)")
          .in("load_status", activeStatuses);

        if (!loads || loads.length === 0) {
          setMarkers([]);
          setFetching(false);
          return;
        }

        const loadIds = loads.map((l) => l.load_id);
        const { data: checkpoints } = await supabase.current
          .from("driver_checkpoints")
          .select("load_id, lat, lng, recorded_at, notes, status_at_checkpoint")
          .in("load_id", loadIds)
          .order("recorded_at", { ascending: false });

        if (!checkpoints) {
          setMarkers([]);
          setFetching(false);
          return;
        }

        // Get latest checkpoint per load
        const seen = new Set<number>();
        const result: LoadMarker[] = [];
        for (const cp of checkpoints) {
          if (seen.has(cp.load_id)) continue;
          seen.add(cp.load_id);
          const load = loads.find((l) => l.load_id === cp.load_id);
          const driverData = load?.drivers as { first_name?: string; last_name?: string } | null;
          result.push({
            load_id: cp.load_id,
            load_number: load?.load_number || null,
            driver_name: driverData ? `${driverData.first_name || ""} ${driverData.last_name || ""}`.trim() || null : null,
            load_status: load?.load_status || null,
            lat: Number(cp.lat),
            lng: Number(cp.lng),
            last_reported: cp.recorded_at as string,
            checkpoint_notes: cp.notes as string | null,
            checkpoint_status: cp.status_at_checkpoint as string | null,
          });
        }
        setMarkers(result);
      } catch (e) {
        console.error("[TrackingMapPins]", e);
      } finally {
        setFetching(false);
      }
    }
    fetchMarkers();
  }, []);

  // Init map
  useEffect(() => {
    if (!mapContainer.current || map.current || !MAPBOX_TOKEN) {
      setLoaded(true);
      return;
    }
    mapboxgl.accessToken = MAPBOX_TOKEN;
    const m = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [-99.1332, 25.2048],
      zoom: 3,
      attributionControl: false,
    });
    m.on("load", () => {
      map.current = m;
      setLoaded(true);
    });
    return () => {
      m.remove();
      map.current = null;
    };
  }, []);

  // Add markers when data or map changes
  useEffect(() => {
    if (!map.current || !loaded || markers.length === 0) return;
    if (!MAPBOX_TOKEN) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Fit bounds
    const bounds = new mapboxgl.LngLatBounds();

    markers.forEach((mk) => {
      const hoursAgo = (Date.now() - new Date(mk.last_reported).getTime()) / 3600000;
      bounds.extend([mk.lng, mk.lat]);

      const el = document.createElement("div");
      el.className = "w-4 h-4 rounded-full border-2 border-white shadow-md cursor-pointer";
      el.style.backgroundColor = getMarkerColor(hoursAgo);

      const statusLabel =
        mk.load_status === LOAD_STATUS.PICKED_UP ? "Recogido" :
        mk.load_status === LOAD_STATUS.BOOKED ? "Reservado" :
        mk.load_status || "";
      const notesHtml = mk.checkpoint_notes ? `<p class="text-zinc-500 mt-1 text-xs italic">${mk.checkpoint_notes}</p>` : "";

      const popupHtml = `
        <div class="text-xs leading-relaxed" style="max-width:220px">
          <p class="font-bold text-sm">#${mk.load_number || mk.load_id}</p>
          <p class="text-zinc-600">Estado: ${statusLabel}</p>
          ${mk.driver_name ? `<p class="text-zinc-600">Conductor: ${mk.driver_name}</p>` : ""}
          <p class="text-zinc-400">Reportado: ${new Date(mk.last_reported).toLocaleString("es-CR")}</p>
          ${notesHtml}
          <button
            onclick="window.dispatchEvent(new CustomEvent('report-checkpoint', { detail: { loadId: ${mk.load_id} } }))"
            class="mt-2 w-full px-2 py-1 bg-emerald-600 text-white rounded text-xs font-medium hover:bg-emerald-700"
          >
            📍 Reportar Posición
          </button>
        </div>
      `;

      const popup = new mapboxgl.Popup({ offset: 25, closeButton: true, maxWidth: "260px" }).setHTML(popupHtml);

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([mk.lng, mk.lat])
        .setPopup(popup)
        .addTo(map.current!);

      markersRef.current.push(marker);
    });

    if (markers.length > 0) {
      map.current.fitBounds(bounds, { padding: 60, maxZoom: 10 });
    }
  }, [markers, loaded]);

  // Listen for report-checkpoint custom event from popup
  useEffect(() => {
    function handler(e: CustomEvent) {
      if (onReportCheckpoint && e.detail?.loadId) {
        onReportCheckpoint(e.detail.loadId);
      }
    }
    window.addEventListener("report-checkpoint" as never, handler as never);
    return () => window.removeEventListener("report-checkpoint" as never, handler as never);
  }, [onReportCheckpoint]);

  // Realtime subscription for live updates
  useEffect(() => {
    if (markers.length === 0) return;
    const loadIds = markers.map((m) => m.load_id);
    const subscriptions: ReturnType<typeof supabase.current.channel>[] = [];

    loadIds.forEach((lid) => {
      const ch = supabase.current
        .channel(`load-tracking:${lid}`)
        .on("broadcast", { event: "checkpoint" }, () => {
          // Refetch markers on any checkpoint
          setMarkers((prev) => [...prev]); // trigger re-render
        })
        .subscribe();
      subscriptions.push(ch);
    });

    return () => {
      subscriptions.forEach((ch) => supabase.current.removeChannel(ch));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 rounded-lg text-zinc-400 text-sm" style={{ height }}>
        Mapbox no configurado. Define NEXT_PUBLIC_MAPBOX_TOKEN en .env.local
      </div>
    );
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 rounded-lg" style={{ height }}>
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (markers.length === 0) {
    return (
      <div className="flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 rounded-lg text-zinc-400 text-sm" style={{ height }}>
        No hay cargas activas con ubicación reportada
      </div>
    );
  }

  return (
    <div className="relative rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800" style={{ height }}>
      <div ref={mapContainer} className="h-full w-full" />
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-50 dark:bg-zinc-900">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        </div>
      )}
    </div>
  );
}
