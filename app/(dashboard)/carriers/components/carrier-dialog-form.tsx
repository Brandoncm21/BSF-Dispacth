"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { createCarrier, updateCarrier } from "@/lib/actions";

const carrierSchema = z.object({
  company_name: z.string().min(1, "Nombre de empresa es requerido"),
  owner_name: z.string().optional(),
  email: z.string().email("Email inválido").or(z.literal("")),
  phone_number: z.string().optional(),
  address: z.string().optional(),
  motor_carrier_id: z.string().min(1, "MC Number es requerido"),
  dot_number: z.string().optional(),
  us_department_of_transportation_number: z.string().optional(),
  employer_identification_number: z.string().optional(),
  social_security_number: z.string().optional(),
  dispatch_fee_percent: z.coerce.number().min(4).max(8).optional().nullable(),
  factoring: z.boolean().default(false),
  status_id: z.number().default(1),
});

type Carrier = {
  carrier_id: number;
  company_name: string;
  owner_name: string | null;
  email: string | null;
  phone_number: string | null;
  address: string | null;
  motor_carrier_id: string | null;
  us_department_of_transportation_number: string | null;
  employer_identification_number: string | null;
  social_security_number: string | null;
  dispatch_fee_percent: string | null;
  factoring: boolean;
  mc_number: string | null;
  dot_number: string | null;
  status_id: number;
  record_status: { status_name: string } | null;
};

type CarrierForm = {
  company_name: string;
  owner_name: string;
  email: string;
  phone_number: string;
  address: string;
  motor_carrier_id: string;
  dot_number: string;
  us_department_of_transportation_number: string;
  employer_identification_number: string;
  social_security_number: string;
  dispatch_fee_percent: string;
  factoring: boolean;
  status_id: number;
};

const emptyForm: CarrierForm = {
  company_name: "",
  owner_name: "",
  email: "",
  phone_number: "",
  address: "",
  motor_carrier_id: "",
  dot_number: "",
  us_department_of_transportation_number: "",
  employer_identification_number: "",
  social_security_number: "",
  dispatch_fee_percent: "",
  factoring: false,
  status_id: 1,
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCarrier: Carrier | null;
  onSuccess: () => void;
};

export function CarrierDialogForm({ open, onOpenChange, editingCarrier, onSuccess }: Props) {
  const [form, setForm] = useState<CarrierForm>(emptyForm);
  const [formLoading, setFormLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      if (editingCarrier) {
        setForm({
          company_name: editingCarrier.company_name,
          owner_name: editingCarrier.owner_name || "",
          email: editingCarrier.email || "",
          phone_number: editingCarrier.phone_number || "",
          address: editingCarrier.address || "",
          motor_carrier_id: editingCarrier.motor_carrier_id || "",
          dot_number: editingCarrier.dot_number || "",
          us_department_of_transportation_number: editingCarrier.us_department_of_transportation_number || "",
          employer_identification_number: editingCarrier.employer_identification_number || "",
          social_security_number: editingCarrier.social_security_number || "",
          dispatch_fee_percent: editingCarrier.dispatch_fee_percent ? String(parseFloat(String(editingCarrier.dispatch_fee_percent)) * 100) : "",
          factoring: editingCarrier.factoring || false,
          status_id: editingCarrier.status_id || 1,
        });
      } else {
        setForm(emptyForm);
      }
      setFormErrors({});
    }
  }, [open, editingCarrier]);

  async function handleSubmit() {
    setFormLoading(true);
    setFormErrors({});

    const result = carrierSchema.safeParse(form);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      setFormErrors(
        Object.fromEntries(
          Object.entries(errors).map(([field, messages]) => [field, messages?.[0] || "Invalid value"])
        ) as Record<string, string>
      );
      setFormLoading(false);
      return;
    }

    try {
      const apiData = {
        ...result.data,
        dispatch_fee_percent: result.data.dispatch_fee_percent ? result.data.dispatch_fee_percent / 100 : null,
      };
      if (editingCarrier) {
        await updateCarrier(editingCarrier.carrier_id, apiData as unknown as Record<string, unknown>);
      } else {
        await createCarrier(apiData as unknown as Record<string, unknown>);
      }
      onSuccess();
      onOpenChange(false);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Error al guardar carrier";
      setFormErrors({ form: message });
    }
    setFormLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingCarrier ? "Editar Carrier" : "Nuevo Carrier"}
          </DialogTitle>
          <DialogDescription>
            {editingCarrier
              ? "Modifica los datos del carrier"
              : "Completa los datos para registrar un nuevo carrier"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="grid grid-cols-2 gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="company_name">Nombre de Empresa *</Label>
            <Input
              id="company_name"
              value={form.company_name}
              onChange={(e) => setForm({ ...form, company_name: e.target.value })}
            />
            {formErrors.company_name && (
              <p className="text-xs text-red-500">{formErrors.company_name}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="owner_name">Nombre del Owner</Label>
            <Input
              id="owner_name"
              value={form.owner_name}
              onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="email@ejemplo.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone_number">Teléfono</Label>
            <Input
              id="phone_number"
              value={form.phone_number}
              onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
              placeholder="(555) 123-4567"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Dirección</Label>
            <Input
              id="address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="123 Main St, City, State"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="motor_carrier_id">MC Number *</Label>
            <Input
              id="motor_carrier_id"
              value={form.motor_carrier_id}
              onChange={(e) => setForm({ ...form, motor_carrier_id: e.target.value })}
            />
            {formErrors.motor_carrier_id && (
              <p className="text-xs text-red-500">{formErrors.motor_carrier_id}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="dispatch_fee_percent">Dispatch Fee %</Label>
            <Input
              id="dispatch_fee_percent"
              type="number"
              min="4"
              max="8"
              step="0.01"
              value={form.dispatch_fee_percent}
              onChange={(e) => setForm({ ...form, dispatch_fee_percent: e.target.value })}
              placeholder="5"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dot_number">DOT Number</Label>
            <Input
              id="dot_number"
              value={form.dot_number}
              onChange={(e) => setForm({ ...form, dot_number: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="us_department_of_transportation_number">USDOT Number</Label>
            <Input
              id="us_department_of_transportation_number"
              value={form.us_department_of_transportation_number}
              onChange={(e) => setForm({ ...form, us_department_of_transportation_number: e.target.value })}
              placeholder="ej: 1234567"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="employer_identification_number">EIN</Label>
            <Input
              id="employer_identification_number"
              value={form.employer_identification_number}
              onChange={(e) => setForm({ ...form, employer_identification_number: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="social_security_number">SSN</Label>
            <Input
              id="social_security_number"
              value={form.social_security_number}
              onChange={(e) => setForm({ ...form, social_security_number: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              id="factoring"
              checked={form.factoring}
              onChange={(e) => setForm({ ...form, factoring: e.target.checked })}
              className="h-4 w-4"
            />
            <Label htmlFor="factoring">Usa Factoring</Label>
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
        </form>

        {formErrors.form && (
          <div className="px-4">
            <p className="text-sm text-red-500">{formErrors.form}</p>
          </div>
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
