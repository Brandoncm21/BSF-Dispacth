"use client";

import { useState, useEffect } from "react";
import { MapboxAutocomplete, type MapboxSuggestion } from "@/components/mapbox-autocomplete";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, MapPin } from "lucide-react";
import { calculateRouteMiles, getOrCreateLocation, type MapboxPlaceData } from "@/lib/actions";

export type LocationPair = {
  origin: MapboxSuggestion | null;
  destination: MapboxSuggestion | null;
  miles: number | null;
};

interface LocationPickerProps {
  value: LocationPair;
  onChange: (pair: LocationPair) => void;
  originLabel?: string;
  destinationLabel?: string;
}

export function LocationPicker({
  value,
  onChange,
  originLabel = "Dirección de Origen",
  destinationLabel = "Dirección de Destino",
}: LocationPickerProps) {
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCalculateMiles() {
    if (!value.origin || !value.destination) return;

    setCalculating(true);
    setError(null);

    try {
      const result = await calculateRouteMiles(
        value.origin.center[1], // lat
        value.origin.center[0], // lng
        value.destination.center[1], // lat
        value.destination.center[0] // lng
      );

      if (result.error) {
        setError(result.error);
      } else if (result.miles) {
        onChange({ ...value, miles: result.miles });
      }
    } catch (err) {
      setError("Error al calcular la distancia");
    } finally {
      setCalculating(false);
    }
  }

  // Auto-calculate when both locations are selected and miles is null
  useEffect(() => {
    if (value.origin && value.destination && value.miles === null) {
      handleCalculateMiles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.origin?.id, value.destination?.id]);

  function handleOriginChange(origin: MapboxSuggestion | null) {
    onChange({ ...value, origin, miles: null });
    setError(null);
  }

  function handleDestinationChange(destination: MapboxSuggestion | null) {
    onChange({ ...value, destination, miles: null });
    setError(null);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
          <MapPin className="h-5 w-5" />
          <span className="font-medium">{originLabel}</span>
        </div>
        <MapboxAutocomplete
          value={value.origin}
          onChange={handleOriginChange}
          placeholder="Ej: 123 Main St, Houston, TX"
        />
      </div>

      <div className="flex justify-center">
        <ArrowRight className="h-5 w-5 text-zinc-400" />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <MapPin className="h-5 w-5" />
          <span className="font-medium">{destinationLabel}</span>
        </div>
        <MapboxAutocomplete
          value={value.destination}
          onChange={handleDestinationChange}
          placeholder="Ej: 456 Oak Ave, Dallas, TX"
        />
      </div>

      {value.miles !== null && (
        <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-3 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Distancia calculada</span>
            <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {value.miles} millas
            </span>
          </div>
        </div>
      )}

      {value.origin && value.destination && value.miles === null && (
        <Button
          type="button"
          variant="outline"
          onClick={handleCalculateMiles}
          disabled={calculating}
          className="w-full"
        >
          {calculating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Calculando distancia...
            </>
          ) : (
            <>
              <MapPin className="mr-2 h-4 w-4" />
              Calcular distancia
            </>
          )}
        </Button>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}

/**
 * Helper to save both locations to DB and return their IDs
 */
export async function saveLocationPair(pair: LocationPair): Promise<{
  originLocationId: number;
  destinationLocationId: number;
}> {
  if (!pair.origin || !pair.destination) {
    throw new Error("Se requiere origen y destino");
  }

  const originData: MapboxPlaceData = {
    place_name: pair.origin.place_name,
    center: pair.origin.center,
    id: pair.origin.id,
    context: pair.origin.context,
    address: pair.origin.address,
  };

  const destData: MapboxPlaceData = {
    place_name: pair.destination.place_name,
    center: pair.destination.center,
    id: pair.destination.id,
    context: pair.destination.context,
    address: pair.destination.address,
  };

  const [originLocationId, destinationLocationId] = await Promise.all([
    getOrCreateLocation(originData),
    getOrCreateLocation(destData),
  ]);

  return { originLocationId, destinationLocationId };
}
