"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, MapPin, ArrowRight } from "lucide-react";
import { getStates, getCities, searchStreets, createRoute, getOrCreateCity } from "@/lib/actions";
import { cn } from "@/lib/utils";

type StateOption = { state_id: number; state_name: string };
type CityOption = { city_id: number; city_name: string };
type StreetOption = { street_id: number; street_name: string };

interface NewRouteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRouteCreated: (routeId: number) => void;
}

interface AddressForm {
  stateId: number | null;
  cityId: number | null;
  cityInputMode: "select" | "custom";
  customCityName: string;
  streetId: number | null;
  streetInputMode: "select" | "custom";
  customStreetName: string;
}

export function NewRouteModal({ open, onOpenChange, onRouteCreated }: NewRouteModalProps) {
  const [states, setStates] = useState<StateOption[]>([]);
  const [originCities, setOriginCities] = useState<CityOption[]>([]);
  const [destCities, setDestCities] = useState<CityOption[]>([]);
  const [originStreets, setOriginStreets] = useState<StreetOption[]>([]);
  const [destStreets, setDestStreets] = useState<StreetOption[]>([]);
  const [originStreetSearch, setOriginStreetSearch] = useState("");
  const [destStreetSearch, setDestStreetSearch] = useState("");

  const [origin, setOrigin] = useState<AddressForm>({
    stateId: null,
    cityId: null,
    cityInputMode: "select",
    customCityName: "",
    streetId: null,
    streetInputMode: "select",
    customStreetName: "",
  });

  const [destination, setDestination] = useState<AddressForm>({
    stateId: null,
    cityId: null,
    cityInputMode: "select",
    customCityName: "",
    streetId: null,
    streetInputMode: "select",
    customStreetName: "",
  });

  const [miles, setMiles] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"origin" | "destination" | "confirm">("origin");

  useEffect(() => {
    if (open) {
      fetchStates();
      resetForm();
    }
  }, [open]);

  useEffect(() => {
    if (origin.stateId) {
      fetchCities(origin.stateId, "origin");
    }
  }, [origin.stateId]);

  useEffect(() => {
    if (origin.cityId && origin.cityInputMode === "select") {
      searchOriginStreets(originStreetSearch);
    }
  }, [origin.cityId, origin.cityInputMode, originStreetSearch]);

  useEffect(() => {
    if (destination.stateId) {
      fetchCities(destination.stateId, "destination");
    }
  }, [destination.stateId]);

  useEffect(() => {
    if (destination.cityId && destination.cityInputMode === "select") {
      searchDestStreets(destStreetSearch);
    }
  }, [destination.cityId, destination.cityInputMode, destStreetSearch]);

  async function fetchStates() {
    try {
      const data = await getStates();
      setStates(data);
    } catch (e) {
      setError("Error cargando estados");
    }
  }

  async function fetchCities(stateId: number, type: "origin" | "destination") {
    try {
      const data = await getCities(stateId);
      if (type === "origin") {
        setOriginCities(data);
      } else {
        setDestCities(data);
      }
    } catch (e) {
      setError("Error cargando ciudades");
    }
  }

  async function searchOriginStreets(query: string) {
    if (!origin.cityId) return;
    try {
      const data = await searchStreets(query, origin.cityId, origin.stateId || undefined);
      setOriginStreets(data || []);
    } catch (e) {
      setOriginStreets([]);
    }
  }

  async function searchDestStreets(query: string) {
    if (!destination.cityId) return;
    try {
      const data = await searchStreets(query, destination.cityId, destination.stateId || undefined);
      setDestStreets(data || []);
    } catch (e) {
      setDestStreets([]);
    }
  }

  function resetForm() {
    setOrigin({
      stateId: null,
      cityId: null,
      cityInputMode: "select",
      customCityName: "",
      streetId: null,
      streetInputMode: "select",
      customStreetName: "",
    });
    setDestination({
      stateId: null,
      cityId: null,
      cityInputMode: "select",
      customCityName: "",
      streetId: null,
      streetInputMode: "select",
      customStreetName: "",
    });
    setMiles("");
    setError(null);
    setStep("origin");
  }

  function handleClose() {
    resetForm();
    onOpenChange(false);
  }

  function canProceedToDest(): boolean {
    const hasCity = origin.cityInputMode === "custom"
      ? origin.customCityName.trim() !== ""
      : origin.cityId !== null;
    const hasStreet = origin.streetId !== null || origin.customStreetName.trim() !== "";
    return origin.stateId !== null && hasCity && hasStreet;
  }

  function canProceedToConfirm(): boolean {
    const hasCity = destination.cityInputMode === "custom"
      ? destination.customCityName.trim() !== ""
      : destination.cityId !== null;
    const hasStreet = destination.streetId !== null || destination.customStreetName.trim() !== "";
    return destination.stateId !== null && hasCity && hasStreet;
  }

  function canCreateRoute(): boolean {
    return canProceedToDest() && canProceedToConfirm() && miles !== "" && parseFloat(miles) > 0;
  }

  async function handleCreateRoute() {
    if (!canCreateRoute()) return;

    setLoading(true);
    setError(null);

    try {
      let originCityId = origin.cityId;
      let originStreetName = origin.customStreetName.trim();

      if (origin.cityInputMode === "custom" && origin.customCityName.trim()) {
        originCityId = await getOrCreateCity(origin.customCityName.trim(), origin.stateId!);
      }

      if (origin.streetId) {
        const street = originStreets.find(s => s.street_id === origin.streetId);
        originStreetName = street?.street_name || origin.customStreetName.trim() || "Address";
      } else if (!originStreetName) {
        originStreetName = "Address";
      }

      let destCityId = destination.cityId;
      let destStreetName = destination.customStreetName.trim();

      if (destination.cityInputMode === "custom" && destination.customCityName.trim()) {
        destCityId = await getOrCreateCity(destination.customCityName.trim(), destination.stateId!);
      }

      if (destination.streetId) {
        const street = destStreets.find(s => s.street_id === destination.streetId);
        destStreetName = street?.street_name || destination.customStreetName.trim() || "Address";
      } else if (!destStreetName) {
        destStreetName = "Address";
      }

      const routeId = await createRoute(
        originStreetName,
        originCityId!,
        origin.stateId!,
        destStreetName,
        destCityId!,
        destination.stateId!,
        parseFloat(miles)
      );

      onRouteCreated(routeId);
      handleClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error creando la ruta");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nueva Ruta</DialogTitle>
          <DialogDescription>
            Ingresa el origen, destino y distancia de la nueva ruta.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-zinc-500 mb-4">
          <span className={cn("flex items-center gap-1", step === "origin" ? "text-zinc-900 dark:text-zinc-100 font-medium" : "")}>
            <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs", step === "origin" ? "bg-primary text-primary-foreground" : "bg-zinc-200 dark:bg-zinc-700")}>1</span>
            Origen
          </span>
          <ArrowRight className="h-4 w-4" />
          <span className={cn("flex items-center gap-1", step === "destination" ? "text-zinc-900 dark:text-zinc-100 font-medium" : "")}>
            <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs", step === "destination" ? "bg-primary text-primary-foreground" : "bg-zinc-200 dark:bg-zinc-700")}>2</span>
            Destino
          </span>
          <ArrowRight className="h-4 w-4" />
          <span className={cn("flex items-center gap-1", step === "confirm" ? "text-zinc-900 dark:text-zinc-100 font-medium" : "")}>
            <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs", step === "confirm" ? "bg-primary text-primary-foreground" : "bg-zinc-200 dark:bg-zinc-700")}>3</span>
            Confirmar
          </span>
        </div>

        <div className="space-y-6">
          {step === "origin" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <MapPin className="h-5 w-5" />
                <span className="font-medium">Dirección de Origen</span>
              </div>

              <div className="space-y-2">
                <Label>Estado *</Label>
                <select
                  value={origin.stateId || ""}
                  onChange={(e) => setOrigin(prev => ({ ...prev, stateId: e.target.value ? Number(e.target.value) : null, cityId: null, cityInputMode: "select" }))}
                  className="w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-sm"
                >
                  <option value="">Seleccionar estado</option>
                  {states.map(state => (
                    <option key={state.state_id} value={state.state_id}>{state.state_name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Ciudad *</Label>
                <div className="flex gap-2">
                  <select
                    value={origin.cityId || ""}
                    onChange={(e) => setOrigin(prev => ({ ...prev, cityId: e.target.value ? Number(e.target.value) : null, cityInputMode: "select" }))}
                    className="flex-1 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-sm"
                    disabled={!origin.stateId}
                  >
                    <option value="">Seleccionar ciudad</option>
                    {originCities.map(city => (
                      <option key={city.city_id} value={city.city_id}>{city.city_name}</option>
                    ))}
                  </select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setOrigin(prev => ({ ...prev, cityInputMode: prev.cityInputMode === "select" ? "custom" : "select", cityId: null }))}
                  >
                    {origin.cityInputMode === "select" ? "+ Nueva" : "Seleccionar"}
                  </Button>
                </div>
                {origin.cityInputMode === "custom" && (
                  <Input
                    value={origin.customCityName}
                    onChange={(e) => setOrigin(prev => ({ ...prev, customCityName: e.target.value }))}
                    placeholder="Escribir nombre de ciudad"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label>Calle / Dirección *</Label>
                {origin.cityInputMode === "select" && origin.cityId ? (
                  <div className="relative">
                    <Input
                      value={originStreetSearch}
                      onChange={(e) => {
                        setOriginStreetSearch(e.target.value);
                        setOrigin(prev => ({ ...prev, streetId: null, streetInputMode: "custom", customStreetName: e.target.value }));
                      }}
                      placeholder="Buscar o escribir calle..."
                      className="pr-20"
                    />
                    <div className="absolute z-10 mt-1 w-full max-h-40 overflow-auto rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-lg">
                      {originStreets.map(street => (
                        <button
                          key={street.street_id}
                          type="button"
                          onClick={() => {
                            setOrigin(prev => ({ ...prev, streetId: street.street_id, customStreetName: street.street_name }));
                            setOriginStreetSearch(street.street_name);
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        >
                          {street.street_name}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Input
                    value={origin.customStreetName}
                    onChange={(e) => setOrigin(prev => ({ ...prev, customStreetName: e.target.value, streetInputMode: "custom" }))}
                    placeholder="Escribir nombre de calle"
                  />
                )}
              </div>

              <div className="flex justify-end">
                <Button onClick={() => setStep("destination")} disabled={!canProceedToDest()}>
                  Siguiente: Destino
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === "destination" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <MapPin className="h-5 w-5" />
                <span className="font-medium">Dirección de Destino</span>
              </div>

              <div className="space-y-2">
                <Label>Estado *</Label>
                <select
                  value={destination.stateId || ""}
                  onChange={(e) => setDestination(prev => ({ ...prev, stateId: e.target.value ? Number(e.target.value) : null, cityId: null, cityInputMode: "select" }))}
                  className="w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-sm"
                >
                  <option value="">Seleccionar estado</option>
                  {states.map(state => (
                    <option key={state.state_id} value={state.state_id}>{state.state_name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Ciudad *</Label>
                <div className="flex gap-2">
                  <select
                    value={destination.cityId || ""}
                    onChange={(e) => setDestination(prev => ({ ...prev, cityId: e.target.value ? Number(e.target.value) : null, cityInputMode: "select" }))}
                    className="flex-1 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-sm"
                    disabled={!destination.stateId}
                  >
                    <option value="">Seleccionar ciudad</option>
                    {destCities.map(city => (
                      <option key={city.city_id} value={city.city_id}>{city.city_name}</option>
                    ))}
                  </select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDestination(prev => ({ ...prev, cityInputMode: prev.cityInputMode === "select" ? "custom" : "select", cityId: null }))}
                  >
                    {destination.cityInputMode === "select" ? "+ Nueva" : "Seleccionar"}
                  </Button>
                </div>
                {destination.cityInputMode === "custom" && (
                  <Input
                    value={destination.customCityName}
                    onChange={(e) => setDestination(prev => ({ ...prev, customCityName: e.target.value }))}
                    placeholder="Escribir nombre de ciudad"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label>Calle / Dirección *</Label>
                {destination.cityInputMode === "select" && destination.cityId ? (
                  <div className="relative">
                    <Input
                      value={destStreetSearch}
                      onChange={(e) => {
                        setDestStreetSearch(e.target.value);
                        setDestination(prev => ({ ...prev, streetId: null, streetInputMode: "custom", customStreetName: e.target.value }));
                      }}
                      placeholder="Buscar o escribir calle..."
                      className="pr-20"
                    />
                    <div className="absolute z-10 mt-1 w-full max-h-40 overflow-auto rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-lg">
                      {destStreets.map(street => (
                        <button
                          key={street.street_id}
                          type="button"
                          onClick={() => {
                            setDestination(prev => ({ ...prev, streetId: street.street_id, customStreetName: street.street_name }));
                            setDestStreetSearch(street.street_name);
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        >
                          {street.street_name}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Input
                    value={destination.customStreetName}
                    onChange={(e) => setDestination(prev => ({ ...prev, customStreetName: e.target.value, streetInputMode: "custom" }))}
                    placeholder="Escribir nombre de calle"
                  />
                )}
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep("origin")}>
                  Volver: Origen
                </Button>
                <Button onClick={() => setStep("confirm")} disabled={!canProceedToConfirm()}>
                  Siguiente: Confirmar
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === "confirm" && (
            <div className="space-y-4">
              <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4 space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-emerald-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-zinc-500 uppercase">Origen</p>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {origin.customStreetName || "Calle"} {origin.customCityName || originCities.find(c => c.city_id === origin.cityId)?.city_name}, {origin.stateId ? states.find(s => s.state_id === origin.stateId)?.state_name : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-red-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-zinc-500 uppercase">Destino</p>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {destination.customStreetName || "Calle"} {destination.customCityName || destCities.find(c => c.city_id === destination.cityId)?.city_name}, {destination.stateId ? states.find(s => s.state_id === destination.stateId)?.state_name : ""}
                    </p>
                  </div>
                </div>

                <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="miles">Distancia (millas) *</Label>
                    <Input
                      id="miles"
                      type="number"
                      min="1"
                      value={miles}
                      onChange={(e) => setMiles(e.target.value)}
                      placeholder="Ej: 250"
                      className="max-w-[200px]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep("destination")}>
                  Volver: Destino
                </Button>
                <Button onClick={handleCreateRoute} disabled={!canCreateRoute() || loading}>
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
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
