"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Send } from "lucide-react";

type Props = {
  loadId: number;
  driverId: number;
  currentStatus?: string;
  onSubmit: (data: {
    load_id: number;
    driver_id: number;
    lat: number;
    lng: number;
    status_at_checkpoint?: string;
    notes?: string;
  }) => Promise<void>;
};

export function CheckpointForm({ loadId, driverId, currentStatus, onSubmit }: Props) {
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [geoLoading, setGeoLoading] = useState(false);
  const [status, setStatus] = useState(currentStatus || "");
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);

  const detectPosition = () => {
    if (!navigator.geolocation) {
      alert("Tu navegador no soporta geolocalización. Ingresa las coordenadas manualmente.");
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        setGeoLoading(false);
      },
      () => {
        alert("No se pudo obtener la ubicación. Ingresa las coordenadas manualmente.");
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async () => {
    if (!lat || !lng) {
      alert("Debes ingresar o detectar tu ubicación.");
      return;
    }
    setSending(true);
    await onSubmit({
      load_id: loadId,
      driver_id: driverId,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      status_at_checkpoint: status || undefined,
      notes: notes || undefined,
    });
    setSending(false);
  };

  return (
    <div className="space-y-4 p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg">
      <h3 className="font-semibold text-sm">Reportar Posición</h3>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2">
        <div className="flex-1">
          <label className="text-xs text-zinc-500 block mb-1">Latitud</label>
          <input
            type="text"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            placeholder="-90 a 90"
            className="w-full px-2 py-1.5 text-sm border border-zinc-200 dark:border-zinc-800 rounded-md bg-white dark:bg-zinc-950"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs text-zinc-500 block mb-1">Longitud</label>
          <input
            type="text"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            placeholder="-180 a 180"
            className="w-full px-2 py-1.5 text-sm border border-zinc-200 dark:border-zinc-800 rounded-md bg-white dark:bg-zinc-950"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={detectPosition}
          disabled={geoLoading}
          className="w-full sm:w-auto"
        >
          <MapPin className="h-4 w-4" />
          {geoLoading ? "..." : "Detectar"}
        </Button>
      </div>

      <div>
        <label className="text-xs text-zinc-500 block mb-1">Estado</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full px-2 py-1.5 text-sm border border-zinc-200 dark:border-zinc-800 rounded-md bg-white dark:bg-zinc-950"
        >
          <option value="">En tránsito</option>
          <option value="picked_up">Recogido</option>
          <option value="delivered">Entregado</option>
        </select>
      </div>

      <div>
        <label className="text-xs text-zinc-500 block mb-1">Notas (opcional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full px-2 py-1.5 text-sm border border-zinc-200 dark:border-zinc-800 rounded-md bg-white dark:bg-zinc-950 resize-none"
        />
      </div>

      <Button onClick={handleSubmit} disabled={sending} className="w-full">
        <Send className="h-4 w-4 mr-2" />
        {sending ? "Enviando..." : "Reportar Posición"}
      </Button>
    </div>
  );
}
