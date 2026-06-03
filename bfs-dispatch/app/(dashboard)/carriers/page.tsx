"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, Plus, Edit2, Trash2, Loader2, X } from "lucide-react";
import { z } from "zod";
import { PaginationControls } from "@/components/pagination-controls";
import { TableSkeleton } from "@/components/table-skeleton";
import { searchCarriers, createCarrier, updateCarrier, softDeleteCarrier } from "@/lib/actions";

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

export default function CarriersPage() {
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCarrier, setEditingCarrier] = useState<Carrier | null>(null);
  const [form, setForm] = useState<CarrierForm>(emptyForm);
  const [formLoading, setFormLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [expandedCarrierId, setExpandedCarrierId] = useState<number | null>(null);
  const perPage = 16;

  const fetchCarriers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await searchCarriers(search, statusFilter, page, perPage);
      setCarriers(result.data as Carrier[]);
      setTotal(result.count);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar carriers");
    }
    setLoading(false);
  }, [search, statusFilter, page]);

useEffect(() => {
    fetchCarriers();
  }, [fetchCarriers]);

  function openCreate() {
    setEditingCarrier(null);
    setForm(emptyForm);
    setFormErrors({});
    setDialogOpen(true);
  }

  function openEdit(carrier: Carrier) {
    setEditingCarrier(carrier);
    setForm({
      company_name: carrier.company_name,
      owner_name: carrier.owner_name || "",
      email: carrier.email || "",
      phone_number: carrier.phone_number || "",
      address: carrier.address || "",
      motor_carrier_id: carrier.motor_carrier_id || "",
      dot_number: carrier.dot_number || "",
      us_department_of_transportation_number: carrier.us_department_of_transportation_number || "",
      employer_identification_number: carrier.employer_identification_number || "",
      social_security_number: carrier.social_security_number || "",
      dispatch_fee_percent: carrier.dispatch_fee_percent ? String(parseFloat(String(carrier.dispatch_fee_percent)) * 100) : "",
      factoring: carrier.factoring || false,
      status_id: carrier.status_id || 1,
    });
    setFormErrors({});
    setDialogOpen(true);
  }

  async function handleDelete(id: number) {
    if (!confirm("¿Estás seguro de eliminar este carrier?")) return;
    try {
      await softDeleteCarrier(id);
      await fetchCarriers();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al eliminar carrier");
    }
  }

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
      await fetchCarriers();
      setDialogOpen(false);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Error al guardar carrier";
      setFormErrors({ form: message });
    }
    setFormLoading(false);
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Carriers</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Gestiona los carriers del sistema
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Carrier
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="h-4 w-4" />
          </button>
        </Alert>
      )}

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Buscar por nombre o MC Number..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-sm"
        >
          <option value="all">Todos los estados</option>
          <option value="1">Activo</option>
          <option value="2">Inactivo</option>
          <option value="3">Pendiente</option>
        </select>
      </div>

      {loading ? (
        <TableSkeleton rows={16} columns={7} />
      ) : (
        <>
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Compañía</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Owner</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">MC Number</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Fee %</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Estado</th>
                  <th className="text-right px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {carriers.map((carrier) => (
                  <Fragment key={carrier.carrier_id}>
                    <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-900">
                      <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                        {carrier.company_name}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {carrier.owner_name || "—"}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 font-mono">
                        {carrier.motor_carrier_id || "—"}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {carrier.dispatch_fee_percent != null ? `${(Number(carrier.dispatch_fee_percent) * 100).toFixed(1)}%` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            carrier.record_status?.status_name === "Activo"
                              ? "default"
                              : carrier.record_status?.status_name === "Pendiente"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {carrier.record_status?.status_name || "—"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedCarrierId(expandedCarrierId === carrier.carrier_id ? null : carrier.carrier_id)}
                          >
                            {expandedCarrierId === carrier.carrier_id ? "Ocultar" : "Detalles"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(carrier)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(carrier.carrier_id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                    {expandedCarrierId === carrier.carrier_id && (
                      <tr className="bg-zinc-50 dark:bg-zinc-900/50">
                        <td colSpan={6} className="px-4 py-4">
                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">DOT Number</p>
                              <p className="text-zinc-700 dark:text-zinc-300">{carrier.dot_number || "—"}</p>
                            </div>
                            <div>
                              <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">USDOT</p>
                              <p className="text-zinc-700 dark:text-zinc-300">{carrier.us_department_of_transportation_number || "—"}</p>
                            </div>
                            <div>
                              <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">EIN</p>
                              <p className="text-zinc-700 dark:text-zinc-300">{carrier.employer_identification_number || "—"}</p>
                            </div>
                            <div>
                              <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">SSN</p>
                              <p className="text-zinc-700 dark:text-zinc-300">{carrier.social_security_number || "—"}</p>
                            </div>
                            <div>
                              <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Dirección</p>
                              <p className="text-zinc-700 dark:text-zinc-300">{carrier.address || "—"}</p>
                            </div>
                            <div>
                              <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Email</p>
                              <p className="text-zinc-700 dark:text-zinc-300">{carrier.email || "—"}</p>
                            </div>
                            <div>
                              <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Teléfono</p>
                              <p className="text-zinc-700 dark:text-zinc-300">{carrier.phone_number || "—"}</p>
                            </div>
                            <div>
                              <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Factoring</p>
                              <p className="text-zinc-700 dark:text-zinc-300">{carrier.factoring ? "Sí" : "No"}</p>
                            </div>
                            <div>
                              <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Dispatch Fee</p>
                              <p className="text-zinc-700 dark:text-zinc-300">
                                {carrier.dispatch_fee_percent != null ? `${(Number(carrier.dispatch_fee_percent) * 100).toFixed(1)}%` : "—"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">MC Number</p>
                              <p className="text-zinc-700 dark:text-zinc-300">{carrier.motor_carrier_id || "—"}</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
                {carriers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-zinc-500">
                      No se encontraron carriers
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <PaginationControls currentPage={page} totalItems={total} pageSize={perPage} onPageChange={setPage} />
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={formLoading}>
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
    </div>
  );
}
