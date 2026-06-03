"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { LocationPicker, saveLocationPair, type LocationPair } from "@/components/location-picker";
import { createRoute } from "@/lib/actions";

interface NewRouteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRouteCreated: (routeId: number) => void;
}

export function NewRouteModal({ open, onOpenChange, onRouteCreated }: NewRouteModalProps) {
  const [pair, setPair] = useState<LocationPair>({
    origin: null,
    destination: null,
    miles: null,
  });
  const [loading, setLoading] = useState(false);
  const [isFrequent, setIsFrequent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    setPair({ origin: null, destination: null, miles: null });
    setError(null);
    setLoading(false);
    onOpenChange(false);
  }

  async function handleCreateRoute() {
    if (!pair.origin || !pair.destination || !pair.miles) {
      setError("Se requiere origen, destino y distancia");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { originLocationId, destinationLocationId } = await saveLocationPair(pair);
      const routeId = await createRoute(
        originLocationId,
        destinationLocationId,
        pair.miles
      );

      onRouteCreated(routeId);
      handleClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error creando la ruta");
    } finally {
      setLoading(false);
    }
  }

  const canCreate = pair.origin && pair.destination && pair.miles && pair.miles > 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nueva Ruta</DialogTitle>
          <DialogDescription>
            Ingresa el origen y destino. La distancia se calcula automáticamente.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <LocationPicker value={pair} onChange={setPair} />

        <div className="flex items-center gap-2 py-3">
          <input
            type="checkbox"
            id="is_frequent"
            checked={isFrequent}
            onChange={(e) => setIsFrequent(e.target.checked)}
            className="h-4 w-4"
          />
          <label htmlFor="is_frequent" className="text-sm text-zinc-700 dark:text-zinc-300 cursor-pointer">
            Guardar como ruta frecuente
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleCreateRoute} disabled={!canCreate || loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando...
              </>
            ) : (
              "Crear Ruta"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

