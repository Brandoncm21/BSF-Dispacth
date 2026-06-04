"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, Plus, Edit2, Trash2, X, User } from "lucide-react";
import { PaginationControls } from "@/components/pagination-controls";
import { TableSkeleton } from "@/components/table-skeleton";
import { searchDrivers, softDeleteDriver } from "@/lib/actions";
import { DriverDialogForm } from "./driver-dialog-form";
import { DriverSheetDetails } from "./driver-sheet-details";

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
  initialDrivers: Driver[];
  initialTotal: number;
  initialCarriers: Carrier[];
  initialSearch: string;
  initialPage: number;
};

export function DriversTableClient({
  initialDrivers,
  initialTotal,
  initialCarriers,
  initialSearch,
  initialPage,
}: Props) {
  const [drivers, setDrivers] = useState<Driver[]>(initialDrivers);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState(initialSearch);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(initialPage);
  const [total, setTotal] = useState(initialTotal);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const perPage = 16;

  const isFirstRender = useRef(true);

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

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    fetchDrivers();
  }, [fetchDrivers]);

  function openCreate() {
    setEditingDriver(null);
    setDialogOpen(true);
  }

  function openEdit(driver: Driver) {
    setEditingDriver(driver);
    setDialogOpen(true);
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
    <>
      <div className="flex justify-end mb-6">
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
                        <Button variant="ghost" size="icon" onClick={() => setSelectedDriver(driver)} title="Ver detalles">
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

      <DriverDialogForm
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingDriver={editingDriver}
        carriers={initialCarriers}
        onSuccess={() => fetchDrivers()}
      />

      <DriverSheetDetails
        driver={selectedDriver}
        onOpenChange={(open) => { if (!open) setSelectedDriver(null); }}
        onEdit={(driver) => { setSelectedDriver(null); openEdit(driver); }}
      />
    </>
  );
}
