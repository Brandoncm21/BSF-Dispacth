"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { getStates, getCities, getOrCreateAddress } from "@/lib/actions";

type StateOption = { state_id: number; state_name: string };
type CityOption = { city_id: number; city_name: string };

interface AddressModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddressCreated: (addressId: number) => void;
}

export function AddressModal({ open, onOpenChange, onAddressCreated }: AddressModalProps) {
  const [states, setStates] = useState<StateOption[]>([]);
  const [cities, setCities] = useState<CityOption[]>([]);
  const [selectedState, setSelectedState] = useState<number | null>(null);
  const [selectedCity, setSelectedCity] = useState<number | null>(null);
  const [street, setStreet] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchStates();
    }
  }, [open]);

  useEffect(() => {
    if (selectedState) {
      fetchCities(selectedState);
    } else {
      setCities([]);
      setSelectedCity(null);
    }
  }, [selectedState]);

  async function fetchStates() {
    try {
      const data = await getStates();
      setStates(data);
    } catch (e) {
      setError("Error cargando estados");
    }
  }

  async function fetchCities(stateId: number) {
    try {
      const data = await getCities(stateId);
      setCities(data);
    } catch (e) {
      setError("Error cargando ciudades");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedState || !selectedCity || !street.trim()) {
      setError("Todos los campos son requeridos");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const addressId = await getOrCreateAddress(street.trim(), selectedCity, selectedState);
      onAddressCreated(addressId);
      handleClose();
    } catch (e) {
      setError("Error creando dirección");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setSelectedState(null);
    setSelectedCity(null);
    setStreet("");
    setError(null);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Registrar Nueva Dirección</DialogTitle>
          <DialogDescription>
            Ingresa los datos de la nueva dirección de origen o destino.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {error && (
            <p className="text-sm text-red-500 bg-red-50 p-2 rounded">{error}</p>
          )}

          <div className="space-y-2">
            <Label htmlFor="state">Estado *</Label>
            <select
              id="state"
              value={selectedState || ""}
              onChange={(e) => setSelectedState(e.target.value ? Number(e.target.value) : null)}
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
              required
            >
              <option value="">Seleccionar estado</option>
              {states.map((state) => (
                <option key={state.state_id} value={state.state_id}>
                  {state.state_name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">Ciudad *</Label>
            <select
              id="city"
              value={selectedCity || ""}
              onChange={(e) => setSelectedCity(e.target.value ? Number(e.target.value) : null)}
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
              required
              disabled={!selectedState}
            >
              <option value="">Seleccionar ciudad</option>
              {cities.map((city) => (
                <option key={city.city_id} value={city.city_id}>
                  {city.city_name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="street">Calle / Dirección *</Label>
            <Input
              id="street"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              placeholder="Ej: 123 Main St, Suite 100"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !selectedState || !selectedCity || !street.trim()}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar Dirección"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}