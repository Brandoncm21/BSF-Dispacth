"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Plus, Edit2, Trash2, Loader2, X } from "lucide-react";
import { z } from "zod";
import { PaginationControls } from "@/components/pagination-controls";
import { TableSkeleton } from "@/components/table-skeleton";

const driverSchema = z.object({
  first_name: z.string().min(1, "Nombre es requerido"),
  last_name: z.string().min(1, "Apellido es requerido"),
  phone_number: z.string().optional(),
  license_type: z.string().optional(),
  cdl_number: z.string().optional(),
  carrier_id: z.number().min(1, "Carrier es requerido"),
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
  status_id: number;
  carriers: { first_name: string; last_name: string } | null;
  record_status: { status_name: string } | null;
};

type DriverForm = {
  first_name: string;
  last_name: string;
  phone_number: string;
  license_type: string;
  cdl_number: string;
  carrier_id: number;
  status_id: number;
};

const emptyForm: DriverForm = {
  first_name: "",
  last_name: "",
  phone_number: "",
  license_type: "",
  cdl_number: "",
  carrier_id: 0,
  status_id: 1,
};

type Carrier = {
  carrier_id: number;
  first_name: string;
  last_name: string;
};

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [form, setForm] = useState<DriverForm>(emptyForm);
  const [formLoading, setFormLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 16;

  useEffect(() => {
    fetchDrivers();
    fetchCarriers();
  }, [search, page]);

  async function fetchDrivers() {
    setLoading(true);
    const offset = (page - 1) * perPage;

    let query = supabase
      .from("drivers")
      .select("*, carriers(first_name, last_name), record_status:status_id(status_name)", { count: "exact" });

    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,cdl_number.ilike.%${search}%`
      );
    }

    const { data, count, error } = await query.range(offset, offset + perPage - 1);

    if (error) {
      setError(error.message);
    } else {
      setDrivers(data as Driver[]);
      setTotal(count || 0);
    }
    setLoading(false);
  }

  async function fetchCarriers() {
    const { data } = await supabase
      .from("carriers")
      .select("carrier_id, first_name, last_name")
      .eq("status_id", 1);

    if (data) setCarriers(data);
  }

  function openCreate() {
    setEditingDriver(null);
    setForm(emptyForm);
    setFormErrors({});
    setDialogOpen(true);
  }

  function openEdit(driver: Driver) {
    setEditingDriver(driver);
    setForm({
      first_name: driver.first_name,
      last_name: driver.last_name,
      phone_number: driver.phone_number || "",
      license_type: driver.license_type || "",
      cdl_number: driver.cdl_number || "",
      carrier_id: driver.carrier_id,
      status_id: driver.status_id || 1,
    });
    setFormErrors({});
    setDialogOpen(true);
  }

  async function handleSubmit() {
    setFormLoading(true);
    setFormErrors({});

    const result = driverSchema.safeParse(form);
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

    if (editingDriver) {
      const { error } = await supabase
        .from("drivers")
        .update(result.data)
        .eq("driver_id", editingDriver.driver_id);

      if (error) setError(error.message);
      else {
        setDialogOpen(false);
        fetchDrivers();
      }
    } else {
      const { error } = await supabase.from("drivers").insert([result.data]);

      if (error) setError(error.message);
      else {
        setDialogOpen(false);
        fetchDrivers();
      }
    }
    setFormLoading(false);
  }

  async function handleDelete(driverId: number) {
    if (!confirm("¿Estás seguro de eliminar este driver?")) return;

    const { error } = await supabase
      .from("drivers")
      .update({ status_id: 2 })
      .eq("driver_id", driverId);

    if (error) setError(error.message);
    else fetchDrivers();
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Drivers</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Gestiona los drivers del sistema
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Driver
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

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Buscar por nombre o CDL..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10"
          />
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={16} columns={7} />
      ) : (
        <>
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Nombre</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Teléfono</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Licencia</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">CDL</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Carrier</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Estado</th>
                <th className="text-right px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {drivers.map((driver) => (
                <tr key={driver.driver_id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900">
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                    {driver.first_name} {driver.last_name}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {driver.phone_number || "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {driver.license_type || "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 font-mono">
                    {driver.cdl_number || "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {driver.carriers
                      ? `${driver.carriers.first_name} ${driver.carriers.last_name}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        driver.record_status?.status_name === "Activo"
                          ? "default"
                          : driver.record_status?.status_name === "Pendiente"
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {driver.record_status?.status_name || "—"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(driver)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(driver.driver_id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {drivers.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-zinc-500">
                    No se encontraron drivers
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
                    {c.first_name} {c.last_name}
                  </option>
                ))}
              </select>
              {formErrors.carrier_id && (
                <p className="text-xs text-red-500">{formErrors.carrier_id}</p>
              )}
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
