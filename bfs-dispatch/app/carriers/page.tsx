"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const carrierSchema = z.object({
  first_name: z.string().min(1, "Nombre es requerido"),
  last_name: z.string().min(1, "Apellido es requerido"),
  email: z.string().email("Email inválido").or(z.literal("")),
  phone_number: z.string().optional(),
  address: z.string().optional(),
  motor_carrier_id: z.string().min(1, "MC Number es requerido"),
  us_department_of_transportation_number: z.string().optional(),
  employer_identification_number: z.string().optional(),
  social_security_number: z.string().optional(),
  factoring: z.boolean().default(false),
  status_id: z.number().default(1),
});

type Carrier = {
  carrier_id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  phone_number: string | null;
  address: string | null;
  motor_carrier_id: string | null;
  us_department_of_transportation_number: string | null;
  employer_identification_number: string | null;
  social_security_number: string | null;
  factoring: boolean;
  mc_number: string | null;
  status_id: number;
  record_status: { status_name: string } | null;
};

type CarrierForm = {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  address: string;
  motor_carrier_id: string;
  us_department_of_transportation_number: string;
  employer_identification_number: string;
  social_security_number: string;
  factoring: boolean;
  status_id: number;
};

const emptyForm: CarrierForm = {
  first_name: "",
  last_name: "",
  email: "",
  phone_number: "",
  address: "",
  motor_carrier_id: "",
  us_department_of_transportation_number: "",
  employer_identification_number: "",
  social_security_number: "",
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
  const perPage = 25;

  useEffect(() => {
    fetchCarriers();
  }, [search, statusFilter, page]);

  async function fetchCarriers() {
    setLoading(true);
    let query = supabase
      .from("carriers")
      .select("*, record_status:status_id(status_name)", { count: "exact" });

    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,motor_carrier_id.ilike.%${search}%`
      );
    }

    if (statusFilter !== "all") {
      query = query.eq("status_id", parseInt(statusFilter));
    }

    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    const { data, count, error } = await query.range(from, to);

    if (error) {
      setError(error.message);
    } else {
      setCarriers(data as Carrier[]);
      setTotal(count || 0);
    }
    setLoading(false);
  }

  function openCreate() {
    setEditingCarrier(null);
    setForm(emptyForm);
    setFormErrors({});
    setDialogOpen(true);
  }

  function openEdit(carrier: Carrier) {
    setEditingCarrier(carrier);
    setForm({
      first_name: carrier.first_name,
      last_name: carrier.last_name,
      email: carrier.email || "",
      phone_number: carrier.phone_number || "",
      address: carrier.address || "",
      motor_carrier_id: carrier.motor_carrier_id || "",
      us_department_of_transportation_number: carrier.us_department_of_transportation_number || "",
      employer_identification_number: carrier.employer_identification_number || "",
      social_security_number: carrier.social_security_number || "",
      factoring: carrier.factoring || false,
      status_id: carrier.status_id || 1,
    });
    setFormErrors({});
    setDialogOpen(true);
  }

  async function handleSubmit() {
    setFormLoading(true);
    setFormErrors({});

    const result = carrierSchema.safeParse(form);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        errors[issue.path[0]] = issue.message;
      });
      setFormErrors(errors);
      setFormLoading(false);
      return;
    }

    if (editingCarrier) {
      const { error } = await supabase
        .from("carriers")
        .update(result.data)
        .eq("carrier_id", editingCarrier.carrier_id);

      if (error) {
        setError(error.message);
      } else {
        setDialogOpen(false);
        fetchCarriers();
      }
    } else {
      const { error } = await supabase.from("carriers").insert([result.data]);

      if (error) {
        setError(error.message);
      } else {
        setDialogOpen(false);
        fetchCarriers();
      }
    }
    setFormLoading(false);
  }

  async function handleDelete(carrierId: number) {
    if (!confirm("¿Estás seguro de eliminar este carrier?")) return;

    const { error } = await supabase
      .from("carriers")
      .update({ status_id: 2 })
      .eq("carrier_id", carrierId);

    if (error) {
      setError(error.message);
    } else {
      fetchCarriers();
    }
  }

  const totalPages = Math.ceil(total / perPage);

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
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Nombre</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">MC Number</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Teléfono</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Factoring</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Estado</th>
                  <th className="text-right px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {carriers.map((carrier) => (
                  <tr key={carrier.carrier_id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900">
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                      {carrier.first_name} {carrier.last_name}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 font-mono">
                      {carrier.motor_carrier_id || "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {carrier.email || "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {carrier.phone_number || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {carrier.factoring ? (
                        <Badge variant="secondary">Sí</Badge>
                      ) : (
                        <span className="text-zinc-400">No</span>
                      )}
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
                ))}
                {carriers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-zinc-500">
                      No se encontraron carriers
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-zinc-500">
                Mostrando {((page - 1) * perPage) + 1} - {Math.min(page * perPage, total)} de {total}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
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
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              {formErrors.email && (
                <p className="text-xs text-red-500">{formErrors.email}</p>
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
              <Label htmlFor="address">Dirección</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="us_department_of_transportation_number">DOT Number</Label>
              <Input
                id="us_department_of_transportation_number"
                value={form.us_department_of_transportation_number}
                onChange={(e) => setForm({ ...form, us_department_of_transportation_number: e.target.value })}
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
          </div>

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
