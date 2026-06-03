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
  originLat?: number | null;
  originLng?: number | null;
  originAddress?: string | null;
  destLat?: number | null;
  destLng?: number | null;
  destAddress?: string | null;
  waypoints?: WaypointData[];
};

export type WaypointData = {
  sequence: number;
  lat?: number | null;
  lng?: number | null;
  type: "pickup" | "delivery";
  address?: string | null;
};

type Props = {
  truckMarkers?: TruckMarker[];
  checkpoints?: Checkpoint[];
  height?: string;
  interactive?: boolean;
  showPopup?: boolean;
  originLng?: number;
  originLat?: number;
  originAddress?: string;
  destLng?: number;
  destLat?: number;
  destAddress?: string;
  waypoints?: WaypointData[];
};

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

function getMarkerColor(hoursAgo: number): string {
  if (hoursAgo <= 2) return "#10b981";
  if (hoursAgo <= 12) return "#f59e0b";
  return "#ef4444";
}

function createOriginFlagElement(address?: string): HTMLElement {
  const el = document.createElement("div");
  el.innerHTML = `<svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 0C10 0 4 4 4 11c0 8 12 24 12 29 0-5 12-21 12-29 0-7-6-11-12-11z" fill="#10b981" stroke="white" stroke-width="2.5"/>
    <circle cx="16" cy="11" r="5" fill="white"/>
    <rect x="12.5" y="8" width="7" height="2" rx="1" fill="#10b981"/>
    <rect x="12.5" y="11" width="7" height="2" rx="1" fill="#10b981"/>
    <rect x="12.5" y="14" width="7" height="2" rx="1" fill="#10b981"/>
  </svg>`;
  el.className = "cursor-pointer origin-marker";
  return el;
}

function createDestPinElement(address?: string): HTMLElement {
  const el = document.createElement("div");
  el.innerHTML = `<svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 0C10 0 4 4 4 11c0 8 12 24 12 29 0-5 12-21 12-29 0-7-6-11-12-11z" fill="#ef4444" stroke="white" stroke-width="2.5"/>
    <circle cx="16" cy="11" r="5" fill="white"/>
    <circle cx="16" cy="11" r="2.5" fill="#ef4444"/>
  </svg>`;
  el.className = "cursor-pointer dest-marker";
  return el;
}

function createWaypointDotElement(sequence: number): HTMLElement {
  const el = document.createElement("div");
  el.style.cssText = `width:22px;height:22px;background:#3b82f6;border:2px solid white;border-radius:9999px;display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:700;box-shadow:0 1px 3px rgba(0,0,0,0.3);cursor:pointer;`;
  el.textContent = String(sequence);
  return el;
}

export function TrackingMap({
  truckMarkers,
  checkpoints,
  height = "300px",
  interactive = true,
  showPopup = true,
  originLng,
  originLat,
  originAddress,
  destLng,
  destLat,
  destAddress,
  waypoints,
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

  // Add truck markers (with optional origin/dest/waypoints per truck)
  useEffect(() => {
    if (!map.current || !loaded || !truckMarkers) return;
    if (!MAPBOX_TOKEN) return;

    // Clean up previous markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Also clean up any existing route source/layer
    if (map.current.getLayer("checkpoint-route-line")) {
      map.current.removeLayer("checkpoint-route-line");
    }
    if (map.current.getSource("checkpoint-route")) {
      map.current.removeSource("checkpoint-route");
    }
    if (map.current.getLayer("planned-route-line")) {
      map.current.removeLayer("planned-route-line");
    }
    if (map.current.getSource("planned-route")) {
      map.current.removeSource("planned-route");
    }

    const bounds = new mapboxgl.LngLatBounds();
    let hasCoords = false;

    truckMarkers.forEach((t) => {
      // Render truck position marker
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
      bounds.extend([t.lng, t.lat]);
      hasCoords = true;

      // Render origin flag for this truck (if available)
      if (t.originLng != null && t.originLat != null) {
        bounds.extend([t.originLng, t.originLat]);
        const originPopupHtml = `<div class="text-xs"><strong class="text-emerald-600">Origen</strong><br/>${t.originAddress || ""}</div>`;
        const originMarker = new mapboxgl.Marker({ element: createOriginFlagElement(t.originAddress || undefined), anchor: "bottom" })
          .setLngLat([t.originLng, t.originLat])
          .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(originPopupHtml))
          .addTo(map.current!);
        markersRef.current.push(originMarker);
      }

      // Render waypoints for this truck (if available)
      if (t.waypoints && t.waypoints.length > 0) {
        const sorted = [...t.waypoints].sort((a, b) => a.sequence - b.sequence);
        sorted.forEach((wp) => {
          if (wp.lat == null || wp.lng == null) return;
          bounds.extend([wp.lng, wp.lat]);
          const typeLabel = wp.type === "pickup" ? "Pickup" : "Delivery";
          const wpPopupHtml = `<div class="text-xs">
            <strong class="text-blue-500">${typeLabel}</strong><br/>
            <span class="text-zinc-500">Parada #${wp.sequence}</span><br/>
            ${wp.address || ""}
          </div>`;
          const wpMarker = new mapboxgl.Marker({ element: createWaypointDotElement(wp.sequence), anchor: "center" })
            .setLngLat([wp.lng, wp.lat])
            .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(wpPopupHtml))
            .addTo(map.current!);
          markersRef.current.push(wpMarker);
        });
      }

      // Render destination pin for this truck (if available)
      if (t.destLng != null && t.destLat != null) {
        bounds.extend([t.destLng, t.destLat]);
        const destPopupHtml = `<div class="text-xs"><strong class="text-red-500">Destino</strong><br/>${t.destAddress || ""}</div>`;
        const destMarker = new mapboxgl.Marker({ element: createDestPinElement(t.destAddress || undefined), anchor: "bottom" })
          .setLngLat([t.destLng, t.destLat])
          .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(destPopupHtml))
          .addTo(map.current!);
        markersRef.current.push(destMarker);
      }
    });

    // Fit bounds for all markers
    if (hasCoords) {
      map.current.fitBounds(bounds, { padding: 60, maxZoom: 10 });
    }
  }, [truckMarkers, loaded, showPopup]);

  // Add checkpoint path (fallback route line when origin/dest not provided)
  useEffect(() => {
    if (!map.current || !loaded || !checkpoints || checkpoints.length === 0) return;
    if (!MAPBOX_TOKEN) return;

    // If origin/dest are provided, skip checkpoint route line (planned route takes priority)
    const hasPlannedRoute = originLng != null && originLat != null;
    if (hasPlannedRoute) return;

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
  }, [checkpoints, loaded, originLng, originLat]);

  // Add origin/destination/waypoint markers and planned route line
  useEffect(() => {
    if (!map.current || !loaded) return;
    if (!MAPBOX_TOKEN) return;

    // Clean up previous planned-route source/layer
    if (map.current.getLayer("planned-route-line")) {
      map.current.removeLayer("planned-route-line");
    }
    if (map.current.getSource("planned-route")) {
      map.current.removeSource("planned-route");
    }

    // Collect all valid coordinates for the route line and bounds
    const routeCoords: [number, number][] = [];
    const bounds = new mapboxgl.LngLatBounds();

    // Render origin marker (green flag)
    if (originLng != null && originLat != null) {
      routeCoords.push([originLng, originLat]);
      bounds.extend([originLng, originLat]);

      const popupHtml = `<div class="text-xs"><strong class="text-emerald-600">Origen</strong><br/>${originAddress || ""}</div>`;
      const marker = new mapboxgl.Marker({ element: createOriginFlagElement(originAddress), anchor: "bottom" })
        .setLngLat([originLng, originLat])
        .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(popupHtml))
        .addTo(map.current!);
      markersRef.current.push(marker);
    }

    // Render waypoint markers (small blue numbered dots)
    if (waypoints && waypoints.length > 0) {
      const sorted = [...waypoints].sort((a, b) => a.sequence - b.sequence);
      sorted.forEach((wp) => {
        if (wp.lat == null || wp.lng == null) return;
        routeCoords.push([wp.lng, wp.lat]);
        bounds.extend([wp.lng, wp.lat]);

        const typeLabel = wp.type === "pickup" ? "Pickup" : "Delivery";
        const popupHtml = `<div class="text-xs">
          <strong class="text-blue-500">${typeLabel}</strong><br/>
          <span class="text-zinc-500">Parada #${wp.sequence}</span><br/>
          ${wp.address || ""}
        </div>`;
        const marker = new mapboxgl.Marker({ element: createWaypointDotElement(wp.sequence), anchor: "center" })
          .setLngLat([wp.lng, wp.lat])
          .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(popupHtml))
          .addTo(map.current!);
        markersRef.current.push(marker);
      });
    }

    // Render destination marker (red pin)
    if (destLng != null && destLat != null) {
      routeCoords.push([destLng, destLat]);
      bounds.extend([destLng, destLat]);

      const popupHtml = `<div class="text-xs"><strong class="text-red-500">Destino</strong><br/>${destAddress || ""}</div>`;
      const marker = new mapboxgl.Marker({ element: createDestPinElement(destAddress), anchor: "bottom" })
        .setLngLat([destLng, destLat])
        .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(popupHtml))
        .addTo(map.current!);
      markersRef.current.push(marker);
    }

    // Draw planned route line: origin → waypoints → dest
    if (routeCoords.length >= 2) {
      map.current.addSource("planned-route", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: routeCoords },
        },
      });

      map.current.addLayer({
        id: "planned-route-line",
        type: "line",
        source: "planned-route",
        paint: {
          "line-color": "#6366f1",
          "line-width": 3,
          "line-opacity": 0.7,
          "line-dasharray": [1, 0],
        },
      });
    }

    // Fit bounds to include all stops if we have coordinates
    if (routeCoords.length > 0) {
      map.current.fitBounds(bounds, { padding: 60, maxZoom: 12 });
    }
  }, [originLng, originLat, destLng, destLat, waypoints, loaded]);

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
