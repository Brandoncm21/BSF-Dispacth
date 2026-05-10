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
import { TruckWithSmartStatus, createTruck, updateTruck } from "@/lib/actions";

interface CarrierOption {
  carrier_id: number;
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
  const [form, setForm] = useState({
    unit_number: "",
    carrier_id: "",
    truck_type: "",
    capacity: "",
    operational_status: "Activo",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!truck;

  useEffect(() => {
    if (truck) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        unit_number: truck.unit_number || "",
        carrier_id: truck.carrier_id?.toString() || "",
        truck_type: truck.truck_type || "",
        capacity: "",
        operational_status: truck.operational_status || "Activo",
      });
    } else {
      setForm({
        unit_number: "",
        carrier_id: "",
        truck_type: "",
        capacity: "",
        operational_status: "Activo",
      });
    }
    setErrors({});
  }, [truck, open]);

  useEffect(() => {
    async function fetchCarriers() {
      try {
        const { getCarriersSimple } = await import("@/lib/actions");
        const data = await getCarriersSimple();
        setCarriers(data);
      } catch (e) {
        console.error("Error fetching carriers:", e);
      }
    }
    fetchCarriers();
  }, []);

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
      if (isEditing) {
        await updateTruck(truck!.truck_id, {
          unit_number: form.unit_number,
          carrier_id: parseInt(form.carrier_id),
          truck_type: form.truck_type,
          capacity: form.capacity || undefined,
          operational_status: form.operational_status,
        });
      } else {
        await createTruck({
          unit_number: form.unit_number,
          carrier_id: parseInt(form.carrier_id),
          truck_type: form.truck_type,
          capacity: form.capacity || undefined,
          operational_status: form.operational_status,
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
      <SheetContent className="sm:max-w-[500px]">
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
            <Label htmlFor="carrier_id">Carrier *</Label>
            <select
              id="carrier_id"
              value={form.carrier_id}
              onChange={(e) => setForm({ ...form, carrier_id: e.target.value })}
              className={cn(
                "flex w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-2 text-sm",
                errors.carrier_id && "border-red-500"
              )}
            >
              <option value="">Seleccionar carrier</option>
              {carriers.map((c) => (
                <option key={c.carrier_id} value={c.carrier_id}>
                  {c.first_name} {c.last_name}
                </option>
              ))}
            </select>
            {errors.carrier_id && (
              <p className="text-xs text-red-500">{errors.carrier_id}</p>
            )}
          </div>

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
            <Label htmlFor="capacity">Capacidad</Label>
            <Input
              id="capacity"
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              placeholder="ej: 20,000 lbs"
            />
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