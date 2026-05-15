"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Search, Plus, Edit2, Trash2, Loader2, X, User, MapPin, Clock } from "lucide-react";
import { z } from "zod";
import { PaginationControls } from "@/components/pagination-controls";
import { TableSkeleton } from "@/components/table-skeleton";
import { searchDrivers, createDriver, updateDriver, softDeleteDriver, getActiveCarriers, getTruckLoadHistory } from "@/lib/actions";

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

type DriverForm = {
  first_name: string;
  last_name: string;
  phone_number: string;
  license_type: string;
  cdl_number: string;
  carrier_id: number;
  has_twic_card: boolean;
  status_id: number;
};

const emptyForm: DriverForm = {
  first_name: "",
  last_name: "",
  phone_number: "",
  license_type: "",
  cdl_number: "",
  carrier_id: 0,
  has_twic_card: false,
  status_id: 1,
};

type Carrier = {
  carrier_id: number;
  company_name: string;
  mc_number?: string | null;
  dispatch_fee_percent: number;
};

interface DriverHistoryItem {
  load_id: number;
  load_number: string;
  load_date: string;
  origin: string;
  destination: string;
  load_status: string;
  rate: number;
  driver_id?: number;
}

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

  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [driverHistory, setDriverHistory] = useState<DriverHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await searchDrivers(search, page, perPage);
      setDrivers(result.data as Driver[]);
      setTotal(result.count);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar drivers");
    }
    setLoading(false);
  }, [search, page]);

  const fetchCarriers = useCallback(async () => {
    try {
      const data = await getActiveCarriers();
      setCarriers(data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchDrivers();
    fetchCarriers();
  }, [fetchDrivers, fetchCarriers]);

  async function handleViewDetails(driver: Driver) {
    setSelectedDriver(driver);
    setLoadingHistory(true);
    try {
      const driverLoads = await getTruckLoadHistory(driver.carrier_id, 30);
      setDriverHistory(driverLoads.slice(0, 5) as DriverHistoryItem[]);
    } catch (e) {
      console.error("Error fetching driver history:", e);
      setDriverHistory([]);
    }
    setLoadingHistory(false);
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
      has_twic_card: driver.has_twic_card || false,
      status_id: driver.status_id || 1,
    });
    setFormErrors({});
    setDialogOpen(true);
  }

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
      setDialogOpen(false);
      fetchDrivers();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar driver");
    }
    setFormLoading(false);
  }

  async function handleDelete(driverId: number) {
    if (!confirm("¿Estás seguro de eliminar este driver?")) return;

    try {
      await softDeleteDriver(driverId);
      fetchDrivers();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al eliminar driver");
    }
  }

  function getCarrierName(carrier: Driver["carriers"]) {
    return carrier?.company_name || (carrier?.first_name ? `${carrier.first_name} ${carrier.last_name}` : "—");
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
                <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">TWIC</th>
                <th className="text-right px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {drivers.map((driver) => (
                <tr key={driver.driver_id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div>
                        <span className="font-medium text-zinc-900 dark:text-zinc-50">
                          {driver.first_name} {driver.last_name}
                        </span>
                        {driver.has_twic_card && (
                          <Badge variant="secondary" className="ml-2 text-xs">TWIC</Badge>
                        )}
                      </div>
                    </div>
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
                    {getCarrierName(driver.carriers)}
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
                  <td className="px-4 py-3">
                    {driver.has_twic_card ? (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Sí</span>
                    ) : (
                      <span className="text-xs text-zinc-400">No</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleViewDetails(driver)} title="Ver detalles">
                        <User className="h-4 w-4" />
                      </Button>
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
                  <td colSpan={8} className="text-center py-12 text-zinc-500">
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

      {selectedDriver && (
        <Sheet open={!!selectedDriver} onOpenChange={(open) => !open && setSelectedDriver(null)}>
          <SheetContent className="sm:max-w-[500px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Detalles del Driver</SheetTitle>
              <SheetDescription>
                {selectedDriver.first_name} {selectedDriver.last_name}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-zinc-500">Teléfono</p>
                  <p className="text-sm font-medium">{selectedDriver.phone_number || "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-zinc-500">Licencia</p>
                  <p className="text-sm font-medium">{selectedDriver.license_type || "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-zinc-500">CDL</p>
                  <p className="text-sm font-medium font-mono">{selectedDriver.cdl_number || "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-zinc-500">TWIC Card</p>
                  <p className="text-sm">
                    {selectedDriver.has_twic_card ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">Sí posee</span>
                    ) : (
                      <span className="text-zinc-400">No posee</span>
                    )}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-zinc-500">Carrier</p>
                  <p className="text-sm font-medium">{getCarrierName(selectedDriver.carriers)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-zinc-500">Estado</p>
                  <Badge
                    variant={
                      selectedDriver.record_status?.status_name === "Activo"
                        ? "default"
                        : selectedDriver.record_status?.status_name === "Pendiente"
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {selectedDriver.record_status?.status_name || "—"}
                  </Badge>
                </div>
              </div>

              <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4">
                <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Últimos Viajes
                </h3>

                {loadingHistory ? (
                  <div className="text-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-zinc-400" />
                  </div>
                ) : driverHistory.length === 0 ? (
                  <p className="text-sm text-zinc-500 text-center py-4">No hay viajes recientes</p>
                ) : (
                  <div className="space-y-2">
                    {driverHistory.map((trip) => (
                      <div key={trip.load_id} className="p-3 border border-zinc-200 dark:border-zinc-700 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-sm text-blue-600 dark:text-blue-400">{trip.load_number}</span>
                          <Badge variant={trip.load_status === "delivered" ? "default" : "secondary"} className="text-xs">
                            {trip.load_status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-zinc-500">
                          <MapPin className="h-3 w-3" />
                          {trip.origin} → {trip.destination}
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-zinc-400">{new Date(trip.load_date).toLocaleDateString("es-CR")}</span>
                          <span className="text-sm font-medium">${trip.rate?.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4 flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setSelectedDriver(null); openEdit(selectedDriver); }}>
                  <Edit2 className="h-4 w-4 mr-1" />
                  Editar
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}