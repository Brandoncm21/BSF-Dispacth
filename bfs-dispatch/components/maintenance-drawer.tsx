"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Plus, Wrench, AlertTriangle, Calendar, DollarSign } from "lucide-react";
import { TruckWithSmartStatus, getMaintenanceRecords, createMaintenanceRecord, deleteMaintenanceRecord } from "@/lib/actions";
import { cn } from "@/lib/utils";

const MAINTENANCE_TYPES = [
  "Cambio de Aceite",
  "Rotación de Llantas",
  "Revisión de Frenos",
  "Cambio de Filtro",
  "Revisión de Motor",
  "Inspección Anual (FMCSA)",
  "Servicio de Refrigeración",
  "Reparación General",
  "Otro",
];

interface MaintenanceDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  truck: TruckWithSmartStatus;
}

interface MaintenanceRecordData {
  maintenance_id: number;
  truck_id: number;
  maintenance_type: string;
  maintenance_date: string;
  mileage: number | null;
  description: string | null;
  cost: number | null;
  mechanic_notes: string | null;
  status_id: number | null;
}

export function MaintenanceDrawer({ open, onOpenChange, truck }: MaintenanceDrawerProps) {
  const [records, setRecords] = useState<MaintenanceRecordData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    maintenance_type: "",
    maintenance_date: new Date().toISOString().split("T")[0],
    mileage: "",
    description: "",
    cost: "",
    mechanic_notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMaintenanceRecords(truck.truck_id);
      setRecords(data);
    } catch (e) {
      console.error("Error fetching maintenance records:", e);
    }
    setLoading(false);
  }, [truck.truck_id]);

  useEffect(() => {
    if (open) {
      fetchRecords();
      setShowAddForm(false);
    }
  }, [open, fetchRecords]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    if (!form.maintenance_type) {
      setErrors({ maintenance_type: "Tipo de mantenimiento es requerido" });
      return;
    }

    setSaving(true);
    try {
      await createMaintenanceRecord({
        truck_id: truck.truck_id,
        maintenance_type: form.maintenance_type,
        maintenance_date: form.maintenance_date,
        mileage: form.mileage ? parseInt(form.mileage) : undefined,
        description: form.description || undefined,
        cost: form.cost ? parseFloat(form.cost) : undefined,
        mechanic_notes: form.mechanic_notes || undefined,
      });
      setForm({
        maintenance_type: "",
        maintenance_date: new Date().toISOString().split("T")[0],
        mileage: "",
        description: "",
        cost: "",
        mechanic_notes: "",
      });
      setShowAddForm(false);
      fetchRecords();
    } catch (e) {
      console.error("Error creating maintenance record:", e);
      setErrors({ general: "Error al guardar el registro" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(recordId: number) {
    if (!confirm("¿Eliminar este registro de mantenimiento?")) return;
    try {
      await deleteMaintenanceRecord(recordId);
      fetchRecords();
    } catch (e) {
      console.error("Error deleting maintenance record:", e);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Mantenimiento - {truck.unit_number}</SheetTitle>
          <SheetDescription>
            {truck.truck_name ? `${truck.truck_name} • ` : ""}
            {truck.plate_number ? `Placa: ${truck.plate_number}` : ""}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {truck.smart_status === "maintenance" && (
            <Alert variant="default" className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertDescription className="text-amber-700 dark:text-amber-400 text-sm">
                Este camión está marcado como &quot;En mantenimiento&quot;
              </AlertDescription>
            </Alert>
          )}

          <div className="flex items-center justify-between">
            <h3 className="font-medium text-zinc-900 dark:text-zinc-50">
              Historial de Mantenimiento
            </h3>
            {!showAddForm && (
              <Button size="sm" onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Agregar
              </Button>
            )}
          </div>

          {showAddForm && (
            <form onSubmit={handleSubmit} className="p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg space-y-4">
              <h4 className="font-medium text-sm">Nuevo Registro</h4>

              {errors.general && (
                <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                  {errors.general}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maintenance_type">Tipo *</Label>
                  <select
                    id="maintenance_type"
                    value={form.maintenance_type}
                    onChange={(e) => setForm({ ...form, maintenance_type: e.target.value })}
                    className={cn(
                      "flex w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-2 text-sm",
                      errors.maintenance_type && "border-red-500"
                    )}
                  >
                    <option value="">Seleccionar</option>
                    {MAINTENANCE_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maintenance_date">Fecha</Label>
                  <Input
                    id="maintenance_date"
                    type="date"
                    value={form.maintenance_date}
                    onChange={(e) => setForm({ ...form, maintenance_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mileage">Millaje</Label>
                  <Input
                    id="mileage"
                    type="number"
                    value={form.mileage}
                    onChange={(e) => setForm({ ...form, mileage: e.target.value })}
                    placeholder="ej: 150000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cost">Costo ($)</Label>
                  <Input
                    id="cost"
                    type="number"
                    step="0.01"
                    value={form.cost}
                    onChange={(e) => setForm({ ...form, cost: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Input
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Descripción del trabajo realizado"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mechanic_notes">Notas del Mecánico</Label>
                <Input
                  id="mechanic_notes"
                  value={form.mechanic_notes}
                  onChange={(e) => setForm({ ...form, mechanic_notes: e.target.value })}
                  placeholder="Notas adicionales..."
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAddForm(false)}>
                  Cancelar
                </Button>
                <Button type="submit" size="sm" disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Wrench className="h-4 w-4 mr-1" />}
                  Guardar
                </Button>
              </div>
            </form>
          )}

          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-zinc-400" />
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 text-sm">
              No hay registros de mantenimiento
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((record) => (
                <div
                  key={record.maintenance_id}
                  className="p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        record.maintenance_type.includes("FMCSA") || record.maintenance_type.includes("Inspección")
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                          : record.maintenance_type.includes("Aceite") || record.maintenance_type.includes("Filtro")
                          ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                      )}>
                        <Wrench className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{record.maintenance_type}</div>
                        <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(record.maintenance_date).toLocaleDateString("es-CR")}
                          </span>
                          {record.mileage && (
                            <span>{record.mileage.toLocaleString()} mi</span>
                          )}
                          {record.cost && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {record.cost.toLocaleString("es-CR", { minimumFractionDigits: 2 })}
                            </span>
                          )}
                        </div>
                        {record.description && (
                          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">{record.description}</p>
                        )}
                        {record.mechanic_notes && (
                          <p className="text-xs text-zinc-500 mt-1 italic">Nota: {record.mechanic_notes}</p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => handleDelete(record.maintenance_id)}
                    >
                      ×
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Recordatorio FMCSA</span>
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              La inspección anual de DOT es requerida. Asegúrate de mantener los registros
              por al menos 12 meses después de la inspección.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}