"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { TruckWithSmartStatus, createTruck, updateTruck, getDriversByCarrier, getActiveCarriers } from "@/lib/actions";

interface CarrierOption {
  carrier_id: number;
  company_name: string;
}

interface DriverOption {
  driver_id: number;
  first_name: string;
  last_name: string;
}

const TRUCK_TYPES = ["Semi", "Hotshot", "Box Truck", "Furgón", "Camión", "Refrigerado"];
const OPERATIONAL_STATUSES = ["Activo", "Inactivo", "En mantenimiento"];

interface TruckFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  truck?: TruckWithSmartStatus | null;
  onSuccess: () => void;
}

export function TruckFormSheet({ open, onOpenChange, truck, onSuccess }: TruckFormSheetProps) {
  const [loading, setLoading] = useState(false);
  const [carriers, setCarriers] = useState<CarrierOption[]>([]);
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [form, setForm] = useState({
    unit_number: "",
    carrier_id: "",
    truck_type: "",
    capacity: "",
    operational_status: "Activo",
    plate_number: "",
    vin: "",
    truck_name: "",
    empty_weight: "",
    driver_id: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!truck;

  useEffect(() => {
    async function fetchCarriers() {
      try {
        const data = await getActiveCarriers();
        setCarriers(data);
      } catch (e) {
        console.error("Error fetching carriers:", e);
      }
    }
    fetchCarriers();
  }, []);

  useEffect(() => {
    if (form.carrier_id) {
      async function fetchDriversForCarrier() {
        try {
          const data = await getDriversByCarrier(parseInt(form.carrier_id));
          setDrivers(data);
        } catch (e) {
          console.error("Error fetching drivers:", e);
          setDrivers([]);
        }
      }
      fetchDriversForCarrier();
    } else {
      setDrivers([]);
    }
  }, [form.carrier_id]);

  useEffect(() => {
    if (truck) {
      setForm({
        unit_number: truck.unit_number || "",
        carrier_id: truck.carrier_id?.toString() || "",
        truck_type: truck.truck_type || "",
        capacity: "",
        operational_status: truck.operational_status || "Activo",
        plate_number: truck.plate_number || "",
        vin: truck.vin || "",
        truck_name: truck.truck_name || "",
        empty_weight: truck.empty_weight?.toString() || "",
        driver_id: truck.driver_id?.toString() || "",
      });
    } else {
      setForm({
        unit_number: "",
        carrier_id: "",
        truck_type: "",
        capacity: "",
        operational_status: "Activo",
        plate_number: "",
        vin: "",
        truck_name: "",
        empty_weight: "",
        driver_id: "",
      });
    }
    setErrors({});
  }, [truck, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    if (!form.unit_number.trim()) {
      setErrors({ unit_number: "Unit number es requerido" });
      return;
    }
    if (!form.carrier_id) {
      setErrors({ carrier_id: "Carrier es requerido" });
      return;
    }
    if (!form.truck_type) {
      setErrors({ truck_type: "Truck type es requerido" });
      return;
    }

    setLoading(true);
    try {
      const updateData: Parameters<typeof updateTruck>[1] = {
        unit_number: form.unit_number,
        carrier_id: parseInt(form.carrier_id),
        truck_type: form.truck_type,
        capacity: form.capacity || undefined,
        operational_status: form.operational_status,
        plate_number: form.plate_number || undefined,
        vin: form.vin || undefined,
        truck_name: form.truck_name || undefined,
        empty_weight: form.empty_weight ? parseFloat(form.empty_weight) : undefined,
        driver_id: form.driver_id ? parseInt(form.driver_id) : undefined,
      };

      if (isEditing) {
        await updateTruck(truck!.truck_id, updateData);
      } else {
        await createTruck({
          unit_number: form.unit_number,
          carrier_id: parseInt(form.carrier_id),
          truck_type: form.truck_type,
          capacity: form.capacity || undefined,
          operational_status: form.operational_status,
          plate_number: form.plate_number || undefined,
          vin: form.vin || undefined,
          truck_name: form.truck_name || undefined,
          empty_weight: form.empty_weight ? parseFloat(form.empty_weight) : undefined,
          driver_id: form.driver_id ? parseInt(form.driver_id) : undefined,
        });
      }
      onOpenChange(false);
      onSuccess();
    } catch (e) {
      console.error("Error saving truck:", e);
      setErrors({ general: "Error al guardar el camión" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEditing ? "Editar Camión" : "Agregar Camión"}</SheetTitle>
          <SheetDescription>
            {isEditing
              ? "Modifica los datos del camión"
              : "Complete los datos para registrar un nuevo camión"}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          {errors.general && (
            <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
              {errors.general}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unit_number">Unit Number *</Label>
              <Input
                id="unit_number"
                value={form.unit_number}
                onChange={(e) => setForm({ ...form, unit_number: e.target.value })}
                placeholder="ej: U-001"
                className={cn(errors.unit_number && "border-red-500")}
              />
              {errors.unit_number && (
                <p className="text-xs text-red-500">{errors.unit_number}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="truck_name">Nombre del Camión</Label>
              <Input
                id="truck_name"
                value={form.truck_name}
                onChange={(e) => setForm({ ...form, truck_name: e.target.value })}
                placeholder="ej: La Bestia"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="plate_number">Placa</Label>
              <Input
                id="plate_number"
                value={form.plate_number}
                onChange={(e) => setForm({ ...form, plate_number: e.target.value.toUpperCase() })}
                placeholder="ej: ABC-1234"
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vin">VIN</Label>
              <Input
                id="vin"
                value={form.vin}
                onChange={(e) => setForm({ ...form, vin: e.target.value.toUpperCase() })}
                placeholder="ej: 1HGCM82633A004352"
                className="font-mono text-xs"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="carrier_id">Carrier *</Label>
            <select
              id="carrier_id"
              value={form.carrier_id}
              onChange={(e) => setForm({ ...form, carrier_id: e.target.value, driver_id: "" })}
              className={cn(
                "flex w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-2 text-sm",
                errors.carrier_id && "border-red-500"
              )}
            >
              <option value="">Seleccionar carrier</option>
              {carriers.map((c) => (
                <option key={c.carrier_id} value={c.carrier_id}>
                  {c.company_name}
                </option>
              ))}
            </select>
            {errors.carrier_id && (
              <p className="text-xs text-red-500">{errors.carrier_id}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="truck_type">Truck Type *</Label>
              <select
                id="truck_type"
                value={form.truck_type}
                onChange={(e) => setForm({ ...form, truck_type: e.target.value })}
                className={cn(
                  "flex w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-2 text-sm",
                  errors.truck_type && "border-red-500"
                )}
              >
                <option value="">Seleccionar tipo</option>
                {TRUCK_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              {errors.truck_type && (
                <p className="text-xs text-red-500">{errors.truck_type}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="driver_id">Chofer Asignado</Label>
              <select
                id="driver_id"
                value={form.driver_id}
                onChange={(e) => setForm({ ...form, driver_id: e.target.value })}
                className="flex w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-2 text-sm"
                disabled={!form.carrier_id}
              >
                <option value="">Sin asignar</option>
                {drivers.map((d) => (
                  <option key={d.driver_id} value={d.driver_id}>
                    {d.first_name} {d.last_name}
                  </option>
                ))}
              </select>
              {!form.carrier_id && (
                <p className="text-xs text-zinc-400">Seleccione un carrier primero</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacidad</Label>
              <Input
                id="capacity"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                placeholder="ej: 20,000 lbs"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="empty_weight">Peso en Vacío (lbs)</Label>
              <Input
                id="empty_weight"
                type="number"
                value={form.empty_weight}
                onChange={(e) => setForm({ ...form, empty_weight: e.target.value })}
                placeholder="ej: 15000"
              />
            </div>
          </div>

          {isEditing && (
            <div className="space-y-2">
              <Label htmlFor="operational_status">Estado Operacional</Label>
              <select
                id="operational_status"
                value={form.operational_status}
                onChange={(e) => setForm({ ...form, operational_status: e.target.value })}
                disabled={truck?.smart_status === "in_route"}
                className={cn(
                  "flex w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-2 text-sm",
                  truck?.smart_status === "in_route" && "opacity-50 cursor-not-allowed"
                )}
              >
                {OPERATIONAL_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              {truck?.smart_status === "in_route" && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  No se puede cambiar el estado mientras el camión está en ruta
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar"
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}