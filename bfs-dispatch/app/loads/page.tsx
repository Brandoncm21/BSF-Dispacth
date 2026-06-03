"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
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
import { Search, Plus, Edit2, Trash2, Loader2, X, FileText } from "lucide-react";
import { z } from "zod";

const loadSchema = z.object({
  load_data: z.string().optional(),
  load_weight: z.coerce.number().optional(),
  carrier_id: z.coerce.number().min(1, "Carrier es requerido"),
  truck_id: z.coerce.number().min(1, "Truck es requerido"),
  driver_id: z.coerce.number().min(1, "Driver es requerido"),
  dispatcher_id: z.coerce.number().optional(),
  route_id: z.coerce.number().optional(),
  cargo_type_id: z.coerce.number().optional(),
  special_requirements_id: z.coerce.number().optional(),
  rate: z.coerce.number().min(0, "Rate es requerido"),
  dispatch_fee: z.coerce.number().default(0),
  factoring: z.boolean().default(false),
  load_status: z.string().default("pending"),
  paid_status: z.string().default("unpaid"),
  status_id: z.number().default(1),
});

type Load = {
  load_id: number;
  load_number: string | null;
  load_data: string | null;
  load_weight: number | null;
  rate: number | null;
  dispatch_fee: number | null;
  load_status: string | null;
  paid_status: string | null;
  factoring: boolean;
  carriers: { first_name: string; last_name: string } | null;
  drivers: { first_name: string; last_name: string } | null;
  trucks: { unit_number: string } | null;
  routes: { estimated_time: string | null; miles: number | null } | null;
  cargo_types: { cargo_type_name: string } | null;
  record_status: { status_name: string } | null;
};

type LoadForm = {
  load_data: string;
  load_weight: string;
  carrier_id: string;
  truck_id: string;
  driver_id: string;
  dispatcher_id: string;
  route_id: string;
  cargo_type_id: string;
  special_requirements_id: string;
  rate: string;
  dispatch_fee: string;
  factoring: boolean;
  load_status: string;
  paid_status: string;
  status_id: number;
};

const emptyForm: LoadForm = {
  load_data: "",
  load_weight: "",
  carrier_id: "",
  truck_id: "",
  driver_id: "",
  dispatcher_id: "",
  route_id: "",
  cargo_type_id: "",
  special_requirements_id: "",
  rate: "",
  dispatch_fee: "0",
  factoring: false,
  load_status: "pending",
  paid_status: "unpaid",
  status_id: 1,
};

type SelectOption = { id: number; label: string };

export default function LoadsPage() {
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLoad, setEditingLoad] = useState<Load | null>(null);
  const [form, setForm] = useState<LoadForm>(emptyForm);
  const [formLoading, setFormLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const [carriers, setCarriers] = useState<SelectOption[]>([]);
  const [trucks, setTrucks] = useState<SelectOption[]>([]);
  const [drivers, setDrivers] = useState<SelectOption[]>([]);
  const [routes, setRoutes] = useState<SelectOption[]>([]);
  const [cargoTypes, setCargoTypes] = useState<SelectOption[]>([]);
  const [requirements, setRequirements] = useState<SelectOption[]>([]);

  useEffect(() => {
    fetchLoads();
    fetchSelectOptions();
  }, [search, statusFilter]);

  async function fetchLoads() {
    setLoading(true);
    let query = supabase
      .from("loads")
      .select(`
        *, carriers(first_name, last_name), drivers(first_name, last_name),
        trucks(unit_number), routes(estimated_time, miles),
        cargo_types(cargo_type_name), record_status:status_id(status_name)
      `);

    if (search) {
      query = query.or(
        `load_number.ilike.%${search}%,load_data.ilike.%${search}%`
      );
    }

    if (statusFilter !== "all") {
      query = query.eq("load_status", statusFilter);
    }

    const { data, error } = await query.order("load_id", { ascending: false });

    if (error) setError(error.message);
    else setLoads(data as Load[]);
    setLoading(false);
  }

  async function fetchSelectOptions() {
    const [carriersRes, trucksRes, driversRes, routesRes, cargoRes, reqRes] = await Promise.all([
      supabase.from("carriers").select("carrier_id, first_name, last_name").eq("status_id", 1),
      supabase.from("trucks").select("truck_id, unit_number").eq("status_id", 1),
      supabase.from("drivers").select("driver_id, first_name, last_name").eq("status_id", 1),
      supabase.from("routes").select("route_id, estimated_time, miles").eq("status_id", 1),
      supabase.from("cargo_types").select("cargo_type_id, cargo_type_name").eq("status_id", 1),
      supabase.from("special_requirements").select("special_requirements_id, requirement_description").eq("status_id", 1),
    ]);

    if (carriersRes.data) setCarriers(carriersRes.data.map((c) => ({ id: c.carrier_id, label: `${c.first_name} ${c.last_name}` })));
    if (trucksRes.data) setTrucks(trucksRes.data.map((t) => ({ id: t.truck_id, label: t.unit_number })));
    if (driversRes.data) setDrivers(driversRes.data.map((d) => ({ id: d.driver_id, label: `${d.first_name} ${d.last_name}` })));
    if (routesRes.data) setRoutes(routesRes.data.map((r) => ({ id: r.route_id, label: `${r.estimated_time || ""} (${r.miles || 0} mi)` })));
    if (cargoRes.data) setCargoTypes(cargoRes.data.map((c) => ({ id: c.cargo_type_id, label: c.cargo_type_name })));
    if (reqRes.data) setRequirements(reqRes.data.map((r) => ({ id: r.special_requirements_id, label: r.requirement_description })));
  }

  function openCreate() {
    setEditingLoad(null);
    setForm(emptyForm);
    setFormErrors({});
    setDialogOpen(true);
  }

  function openEdit(load: Load) {
    setEditingLoad(load);
    setForm({
      load_data: load.load_data || "",
      load_weight: load.load_weight?.toString() || "",
      carrier_id: load.carrier_id?.toString() || "",
      truck_id: load.truck_id?.toString() || "",
      driver_id: load.driver_id?.toString() || "",
      dispatcher_id: "",
      route_id: load.route_id?.toString() || "",
      cargo_type_id: "",
      special_requirements_id: "",
      rate: load.rate?.toString() || "",
      dispatch_fee: load.dispatch_fee?.toString() || "0",
      factoring: load.factoring || false,
      load_status: load.load_status || "pending",
      paid_status: load.paid_status || "unpaid",
      status_id: 1,
    });
    setFormErrors({});
    setDialogOpen(true);
  }

  async function handleSubmit() {
    setFormLoading(true);
    setFormErrors({});

    const result = loadSchema.safeParse(form);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        errors[issue.path[0]] = issue.message;
      });
      setFormErrors(errors);
      setFormLoading(false);
      return;
    }

    if (editingLoad) {
      const { error } = await supabase
        .from("loads")
        .update(result.data)
        .eq("load_id", editingLoad.load_id);
      if (error) setError(error.message);
      else { setDialogOpen(false); fetchLoads(); }
    } else {
      const { error } = await supabase.from("loads").insert([result.data]);
      if (error) setError(error.message);
      else { setDialogOpen(false); fetchLoads(); }
    }
    setFormLoading(false);
  }

  async function updateStatus(loadId: number, newStatus: string) {
    const { error } = await supabase
      .from("loads")
      .update({ load_status: newStatus })
      .eq("load_id", loadId);

    if (error) setError(error.message);
    else fetchLoads();
  }

  async function handleDelete(loadId: number) {
    if (!confirm("¿Eliminar esta carga?")) return;
    const { error } = await supabase.from("loads").update({ status_id: 2 }).eq("load_id", loadId);
    if (error) setError(error.message);
    else fetchLoads();
  }

  const dollarPerMile = (rate: number | null, miles: number | null) => {
    if (!rate || !miles || miles === 0) return "—";
    return `$${(rate / miles).toFixed(2)}`;
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    booked: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    picked_up: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    delivered: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Cargas</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Gestiona todas las cargas del sistema
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Carga
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
            placeholder="Buscar por load# o descripción..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-sm"
        >
          <option value="all">Todos los estados</option>
          <option value="pending">Pending</option>
          <option value="booked">Booked</option>
          <option value="picked_up">Picked Up</option>
          <option value="delivered">Delivered</option>
          <option value="paid">Paid</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Load#</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Carrier</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Driver</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Truck</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Cargo</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Miles</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Rate</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">$/Mile</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Status</th>
                <th className="text-right px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {loads.map((load) => (
                <tr key={load.load_id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900">
                  <td className="px-4 py-3 font-mono font-medium text-zinc-900 dark:text-zinc-50">
                    {load.load_number || `#${load.load_id}`}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {load.carriers ? `${load.carriers.first_name} ${load.carriers.last_name}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {load.drivers ? `${load.drivers.first_name} ${load.drivers.last_name}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {load.trucks?.unit_number || "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {load.cargo_types?.cargo_type_name || "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {load.routes?.miles || "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {load.rate ? `$${load.rate.toLocaleString()}` : "—"}
                  </td>
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                    {dollarPerMile(load.rate, load.routes?.miles)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${statusColors[load.load_status || "pending"]}`}>
                        {load.load_status || "pending"}
                      </span>
                      {load.load_status !== "paid" && (
                        <select
                          value=""
                          onChange={(e) => updateStatus(load.load_id, e.target.value)}
                          className="text-xs border rounded px-1 py-0.5 bg-transparent"
                        >
                          <option value="">→</option>
                          {load.load_status === "pending" && <option value="booked">Booked</option>}
                          {load.load_status === "booked" && <option value="picked_up">Picked Up</option>}
                          {load.load_status === "picked_up" && <option value="delivered">Delivered</option>}
                          {load.load_status === "delivered" && <option value="paid">Paid</option>}
                        </select>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(load)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(load.load_id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {loads.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-zinc-500">
                    No se encontraron cargas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingLoad ? "Editar Carga" : "Nueva Carga"}</DialogTitle>
            <DialogDescription>
              {editingLoad ? "Modifica los datos de la carga" : "Completa los datos para registrar una nueva carga"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="carrier_id">Carrier *</Label>
              <select
                id="carrier_id"
                value={form.carrier_id}
                onChange={(e) => setForm({ ...form, carrier_id: e.target.value })}
                className="flex w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-2 text-sm"
              >
                <option value="">Seleccionar</option>
                {carriers.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
              {formErrors.carrier_id && <p className="text-xs text-red-500">{formErrors.carrier_id}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="driver_id">Driver *</Label>
              <select
                id="driver_id"
                value={form.driver_id}
                onChange={(e) => setForm({ ...form, driver_id: e.target.value })}
                className="flex w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-2 text-sm"
              >
                <option value="">Seleccionar</option>
                {drivers.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
              </select>
              {formErrors.driver_id && <p className="text-xs text-red-500">{formErrors.driver_id}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="truck_id">Truck *</Label>
              <select
                id="truck_id"
                value={form.truck_id}
                onChange={(e) => setForm({ ...form, truck_id: e.target.value })}
                className="flex w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-2 text-sm"
              >
                <option value="">Seleccionar</option>
                {trucks.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
              {formErrors.truck_id && <p className="text-xs text-red-500">{formErrors.truck_id}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="route_id">Ruta</Label>
              <select
                id="route_id"
                value={form.route_id}
                onChange={(e) => setForm({ ...form, route_id: e.target.value })}
                className="flex w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-2 text-sm"
              >
                <option value="">Seleccionar</option>
                {routes.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cargo_type_id">Tipo de Carga</Label>
              <select
                id="cargo_type_id"
                value={form.cargo_type_id}
                onChange={(e) => setForm({ ...form, cargo_type_id: e.target.value })}
                className="flex w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-2 text-sm"
              >
                <option value="">Seleccionar</option>
                {cargoTypes.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="special_requirements_id">Requisito Especial</Label>
              <select
                id="special_requirements_id"
                value={form.special_requirements_id}
                onChange={(e) => setForm({ ...form, special_requirements_id: e.target.value })}
                className="flex w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-2 text-sm"
              >
                <option value="">Seleccionar</option>
                {requirements.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rate">Rate ($) *</Label>
              <Input
                id="rate"
                type="number"
                value={form.rate}
                onChange={(e) => setForm({ ...form, rate: e.target.value })}
              />
              {formErrors.rate && <p className="text-xs text-red-500">{formErrors.rate}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="dispatch_fee">Dispatch Fee ($)</Label>
              <Input
                id="dispatch_fee"
                type="number"
                value={form.dispatch_fee}
                onChange={(e) => setForm({ ...form, dispatch_fee: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="load_weight">Peso (kg)</Label>
              <Input
                id="load_weight"
                type="number"
                value={form.load_weight}
                onChange={(e) => setForm({ ...form, load_weight: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="load_data">Descripción</Label>
              <Input
                id="load_data"
                value={form.load_data}
                onChange={(e) => setForm({ ...form, load_data: e.target.value })}
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
              <Label htmlFor="load_status">Status</Label>
              <select
                id="load_status"
                value={form.load_status}
                onChange={(e) => setForm({ ...form, load_status: e.target.value })}
                className="flex w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-2 text-sm"
              >
                <option value="pending">Pending</option>
                <option value="booked">Booked</option>
                <option value="picked_up">Picked Up</option>
                <option value="delivered">Delivered</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>

          {form.rate && form.route_id && (
            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-md p-3 text-sm">
              <span className="text-zinc-500">$/Mile estimado: </span>
              <span className="font-bold">
                {dollarPerMile(parseFloat(form.rate), routes.find(r => r.id === parseInt(form.route_id))?.id ? 0 : null)}
              </span>
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
