"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Loader2 } from "lucide-react";

type Checkpoint = {
  checkpoint_id: number;
  lat: number;
  lng: number;
  status_at_checkpoint: string | null;
  recorded_at: string;
  notes: string | null;
};

type TruckMarker = {
  load_id: number;
  load_number: string | null;
  unit_number: string | null;
  lat: number;
  lng: number;
  last_reported: string;
};

type Props = {
  truckMarkers?: TruckMarker[];
  checkpoints?: Checkpoint[];
  height?: string;
  interactive?: boolean;
  showPopup?: boolean;
  originLng?: number;
  originLat?: number;
  destLng?: number;
  destLat?: number;
};

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

function getMarkerColor(hoursAgo: number): string {
  if (hoursAgo <= 2) return "#10b981";
  if (hoursAgo <= 12) return "#f59e0b";
  return "#ef4444";
}

export function TrackingMap({
  truckMarkers,
  checkpoints,
  height = "300px",
  interactive = true,
  showPopup = true,
  originLng,
  originLat,
  destLng,
  destLat,
}: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    if (!MAPBOX_TOKEN) {
      setLoaded(true);
      return;
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const m = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [-99.1332, 25.2048], // center-ish Mexico
      zoom: 3,
      attributionControl: false,
      interactive,
    });

    m.on("load", () => {
      map.current = m;
      setLoaded(true);
    });

    return () => {
      m.remove();
      map.current = null;
    };
  }, [interactive]);

  // Add truck markers
  useEffect(() => {
    if (!map.current || !loaded || !truckMarkers) return;
    if (!MAPBOX_TOKEN) return;

    // Clean up previous checkpoint markers if any
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Also clean up any existing route source/layer
    if (map.current.getLayer("checkpoint-route-line")) {
      map.current.removeLayer("checkpoint-route-line");
    }
    if (map.current.getSource("checkpoint-route")) {
      map.current.removeSource("checkpoint-route");
    }

    truckMarkers.forEach((t) => {
      const hoursAgo = (Date.now() - new Date(t.last_reported).getTime()) / 3600000;
      const el = document.createElement("div");
      el.className = "w-3 h-3 rounded-full border-2 border-white shadow-md cursor-pointer";
      el.style.backgroundColor = getMarkerColor(hoursAgo);

      const popup = showPopup
        ? new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div class="text-xs">
              <strong>${t.unit_number || "N/A"}</strong><br/>
              Load: ${t.load_number || "N/A"}<br/>
              Último reporte: ${new Date(t.last_reported).toLocaleString("es-CR")}
            </div>
          `)
        : undefined;

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([t.lng, t.lat])
        .setPopup(popup)
        .addTo(map.current!);

      markersRef.current.push(marker);
    });

    // Fit bounds for truck markers
    if (truckMarkers.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      truckMarkers.forEach((t) => bounds.extend([t.lng, t.lat]));
      map.current.fitBounds(bounds, { padding: 60, maxZoom: 10 });
    }
  }, [truckMarkers, loaded, showPopup]);

  // Add checkpoint path for customer portal
  useEffect(() => {
    if (!map.current || !loaded || !checkpoints || checkpoints.length === 0) return;
    if (!MAPBOX_TOKEN) return;

    // Clean up previous checkpoint markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Clean up previous source/layer if they exist
    if (map.current.getLayer("checkpoint-route-line")) {
      map.current.removeLayer("checkpoint-route-line");
    }
    if (map.current.getSource("checkpoint-route")) {
      map.current.removeSource("checkpoint-route");
    }

    // Sort checkpoints chronologically
    const sorted = [...checkpoints].sort(
      (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
    );

    const coords = sorted.map((c) => [c.lng, c.lat] as [number, number]);

    // Draw route line if 2+ points
    if (coords.length >= 2) {
      map.current.addSource("checkpoint-route", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: coords },
        },
      });

      map.current.addLayer({
        id: "checkpoint-route-line",
        type: "line",
        source: "checkpoint-route",
        paint: {
          "line-color": "#3b82f6",
          "line-width": 3,
          "line-opacity": 0.6,
        },
      });
    }

    // Always draw checkpoint markers (even with 1 checkpoint)
    sorted.forEach((cp) => {
      const el = document.createElement("div");
      el.className = "w-2.5 h-2.5 rounded-full border-2 border-white";
      el.style.backgroundColor = "#3b82f6";

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
        `<div class="text-xs">
          ${cp.status_at_checkpoint ? `<strong>${cp.status_at_checkpoint}</strong><br/>` : ""}
          ${new Date(cp.recorded_at).toLocaleString("es-CR")}
          ${cp.notes ? `<br/>${cp.notes}` : ""}
        </div>`
      );

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([cp.lng, cp.lat])
        .setPopup(popup)
        .addTo(map.current!);

      markersRef.current.push(marker);
    });

    // Fit map to checkpoint bounds
    const bounds = new mapboxgl.LngLatBounds();
    sorted.forEach((cp) => bounds.extend([cp.lng, cp.lat]));
    map.current.fitBounds(bounds, { padding: 60, maxZoom: 12 });
  }, [checkpoints, loaded]);

  // Add origin/destination markers for customer portal
  useEffect(() => {
    if (!map.current || !loaded) return;
    if (!MAPBOX_TOKEN) return;

    if (originLng && originLat) {
      const el = document.createElement("div");
      el.className = "w-4 h-4 rounded-full border-2 border-white";
      el.style.backgroundColor = "#10b981";
      new mapboxgl.Marker({ element: el })
        .setLngLat([originLng, originLat])
        .setPopup(new mapboxgl.Popup().setHTML('<div class="text-xs font-bold">Origen</div>'))
        .addTo(map.current!);
    }

    if (destLng && destLat) {
      const el = document.createElement("div");
      el.className = "w-4 h-4 rounded-full border-2 border-white";
      el.style.backgroundColor = "#ef4444";
      new mapboxgl.Marker({ element: el })
        .setLngLat([destLng, destLat])
        .setPopup(new mapboxgl.Popup().setHTML('<div class="text-xs font-bold">Destino</div>'))
        .addTo(map.current!);
    }
  }, [originLng, originLat, destLng, destLat, loaded]);

  if (!MAPBOX_TOKEN) {
    return (
      <div
        className="flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 rounded-lg text-zinc-400 text-sm"
        style={{ height }}
      >
        Mapbox no configurado. Define NEXT_PUBLIC_MAPBOX_TOKEN en .env.local
      </div>
    );
  }

  return (
    <div className="relative rounded-lg overflow-hidden" style={{ height }}>
      <div ref={mapContainer} className="h-full w-full" />
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-50 dark:bg-zinc-900">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        </div>
      )}
    </div>
  );
}
