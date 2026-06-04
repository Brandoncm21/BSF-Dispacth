"use client";

import { useState, useEffect, useCallback, useRef, Fragment } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, Plus, Edit2, Trash2, X } from "lucide-react";
import { PaginationControls } from "@/components/pagination-controls";
import { TableSkeleton } from "@/components/table-skeleton";
import { searchCarriers, softDeleteCarrier } from "@/lib/actions";
import { CarrierDialogForm } from "./carrier-dialog-form";

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

type Props = {
  initialCarriers: Carrier[];
  initialTotal: number;
  initialSearch: string;
  initialStatusFilter: string;
  initialPage: number;
};

export function CarriersTableClient({
  initialCarriers,
  initialTotal,
  initialSearch,
  initialStatusFilter,
  initialPage,
}: Props) {
  const [carriers, setCarriers] = useState<Carrier[]>(initialCarriers);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCarrier, setEditingCarrier] = useState<Carrier | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(initialPage);
  const [total, setTotal] = useState(initialTotal);
  const [expandedCarrierId, setExpandedCarrierId] = useState<number | null>(null);
  const perPage = 16;

  const isFirstRender = useRef(true);

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
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    fetchCarriers();
  }, [fetchCarriers]);

  function openCreate() {
    setEditingCarrier(null);
    setDialogOpen(true);
  }

  function openEdit(carrier: Carrier) {
    setEditingCarrier(carrier);
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

  return (
    <>
      <div className="flex justify-end mb-6">
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

      <CarrierDialogForm
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingCarrier={editingCarrier}
        onSuccess={() => fetchCarriers()}
      />
    </>
  );
}
