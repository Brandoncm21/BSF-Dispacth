"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { createDriver, updateDriver } from "@/lib/actions";

const driverSchema = z.object({
  first_name: z.string().min(1, "Nombre es requerido"),
  last_name: z.string().min(1, "Apellido es requerido"),
  phone_number: z.string().optional(),
  license_type: z.string().optional(),
  cdl_number: z.string().optional(),
  carrier_id: z.number().min(1, "Carrier es requerido"),
  has_twic_card: z.boolean().default(false),
  status_id: z.number().default(1),
});

type Driver = {
  driver_id: number;
  first_name: string;
  last_name: string;
  phone_number: string | null;
  license_type: string | null;
  cdl_number: string | null;
  carrier_id: number;
  has_twic_card: boolean;
  status_id: number;
  carriers: { company_name?: string; first_name?: string; last_name?: string } | null;
  record_status: { status_name: string } | null;
};

type Carrier = {
  carrier_id: number;
  company_name: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingDriver: Driver | null;
  carriers: Carrier[];
  onSuccess: () => void;
};

export function DriverDialogForm({ open, onOpenChange, editingDriver, carriers, onSuccess }: Props) {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
    license_type: "",
    cdl_number: "",
    carrier_id: 0,
    has_twic_card: false,
    status_id: 1,
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      if (editingDriver) {
        setForm({
          first_name: editingDriver.first_name,
          last_name: editingDriver.last_name,
          phone_number: editingDriver.phone_number || "",
          license_type: editingDriver.license_type || "",
          cdl_number: editingDriver.cdl_number || "",
          carrier_id: editingDriver.carrier_id,
          has_twic_card: editingDriver.has_twic_card || false,
          status_id: editingDriver.status_id || 1,
        });
      } else {
        setForm({
          first_name: "",
          last_name: "",
          phone_number: "",
          license_type: "",
          cdl_number: "",
          carrier_id: 0,
          has_twic_card: false,
          status_id: 1,
        });
      }
      setFormErrors({});
    }
  }, [open, editingDriver]);

  async function handleSubmit() {
    setFormLoading(true);
    setFormErrors({});

    const dataToSubmit = {
      first_name: form.first_name,
      last_name: form.last_name,
      phone_number: form.phone_number || undefined,
      license_type: form.license_type || undefined,
      cdl_number: form.cdl_number || undefined,
      carrier_id: form.carrier_id,
      has_twic_card: form.has_twic_card,
      status_id: form.status_id,
    };

    const result = driverSchema.safeParse(dataToSubmit);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const key = String(issue.path[0]);
        errors[key] = issue.message;
      });
      setFormErrors(errors);
      setFormLoading(false);
      return;
    }

    try {
      if (editingDriver) {
        await updateDriver(editingDriver.driver_id, result.data);
      } else {
        await createDriver(result.data);
      }
      onOpenChange(false);
      onSuccess();
    } catch (e) {
      setFormErrors({ form: e instanceof Error ? e.message : "Error al guardar driver" });
    }
    setFormLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingDriver ? "Editar Driver" : "Nuevo Driver"}</DialogTitle>
          <DialogDescription>
            {editingDriver ? "Modifica los datos del driver" : "Completa los datos para registrar un nuevo driver"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="first_name">Nombre *</Label>
            <Input
              id="first_name"
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
            />
            {formErrors.first_name && (
              <p className="text-xs text-red-500">{formErrors.first_name}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="last_name">Apellido *</Label>
            <Input
              id="last_name"
              value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
            />
            {formErrors.last_name && (
              <p className="text-xs text-red-500">{formErrors.last_name}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone_number">Teléfono</Label>
            <Input
              id="phone_number"
              value={form.phone_number}
              onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="license_type">Tipo Licencia</Label>
            <Input
              id="license_type"
              value={form.license_type}
              onChange={(e) => setForm({ ...form, license_type: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cdl_number">CDL Number</Label>
            <Input
              id="cdl_number"
              value={form.cdl_number}
              onChange={(e) => setForm({ ...form, cdl_number: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="carrier_id">Carrier *</Label>
            <select
              id="carrier_id"
              value={form.carrier_id}
              onChange={(e) => setForm({ ...form, carrier_id: parseInt(e.target.value) })}
              className="flex w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-2 text-sm"
            >
              <option value={0}>Seleccionar carrier</option>
              {carriers.map((c) => (
                <option key={c.carrier_id} value={c.carrier_id}>
                  {c.company_name}
                </option>
              ))}
            </select>
            {formErrors.carrier_id && (
              <p className="text-xs text-red-500">{formErrors.carrier_id}</p>
            )}
          </div>
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="has_twic_card"
              checked={form.has_twic_card}
              onChange={(e) => setForm({ ...form, has_twic_card: e.target.checked })}
              className="h-4 w-4"
            />
            <Label htmlFor="has_twic_card">Posee Tarjeta TWIC</Label>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status_id">Estado</Label>
            <select
              id="status_id"
              value={form.status_id}
              onChange={(e) => setForm({ ...form, status_id: Number(e.target.value) })}
              className="flex w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-2 text-sm"
            >
              <option value={1}>Activo</option>
              <option value={3}>Pendiente</option>
              <option value={2}>Inactivo</option>
            </select>
          </div>
        </div>

        {formErrors.form && (
          <p className="text-sm text-red-500 px-4">{formErrors.form}</p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={formLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={formLoading}>
            {formLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
