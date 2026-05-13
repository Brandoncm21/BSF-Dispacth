"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, Plus, X } from "lucide-react";
import { PaginationControls } from "@/components/pagination-controls";
import { TableSkeleton } from "@/components/table-skeleton";
import { LoadsTable } from "@/components/loads-table";
import { LoadFormDialog } from "@/components/load-form-dialog";
import { LoadDocsDialog } from "@/components/load-docs-dialog";
import { createLoad, updateLoad, uploadLoadDocument } from "@/lib/actions";
import { parseSupabaseError } from "@/lib/errors";
import { LOAD_STATUS, LOAD_STATUS_LABELS } from "@/lib/constants";
import { useLoads } from "@/hooks/use-loads";
import type { Load, LoadFormSubmitData } from "@/types/load";

export default function LoadsPage() {
  const {
    loads, loading, error, page, totalItems,
    search, statusFilter,
    setSearch, setStatusFilter, setPage, setError,
    carriers, trucks, drivers, cargoTypes, requirements,
    fetchLoads, updateStatus, handleDelete,
    handleCreateCargoType, handleCreateSpecialRequirement,
  } = useLoads();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLoad, setEditingLoad] = useState<Load | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [docsLoadId, setDocsLoadId] = useState<number | null>(null);

  async function handleSubmit(data: LoadFormSubmitData) {
    setFormLoading(true);
    try {
      let loadId: number;
      if (editingLoad) {
        const result = await updateLoad(editingLoad.load_id, data.formData);
        if (result.error) {
          setError(parseSupabaseError({ message: result.error }));
          return;
        }
        loadId = editingLoad.load_id;
      } else {
        const result = await createLoad(data.formData);
        if (result.error) {
          setError(parseSupabaseError({ message: result.error }));
          return;
        }
        loadId = result.load_id!;
      }

      const docs: { type: "RC" | "BOL"; file: File }[] = [];
      if (data.rcFile) docs.push({ type: "RC", file: data.rcFile });
      if (data.bolFile) docs.push({ type: "BOL", file: data.bolFile });
      for (const doc of docs) {
        try { await uploadLoadDocument(loadId, doc.type, doc.file, null); } catch { /* form shows error */ }
      }

      setDialogOpen(false);
      fetchLoads();
    } catch (err) {
      setError(parseSupabaseError(err));
    } finally {
      setFormLoading(false);
    }
  }

  function openCreate() { setEditingLoad(null); setDialogOpen(true); }

  function openEdit(load: Load) { setEditingLoad(load); setDialogOpen(true); }

  function openDocs(loadId: number) { setDocsLoadId(loadId); }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Cargas</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Gestiona todas las cargas del sistema</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Carga
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error.message}</AlertDescription>
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
          <option value={LOAD_STATUS.PENDING}>{LOAD_STATUS_LABELS[LOAD_STATUS.PENDING]}</option>
          <option value={LOAD_STATUS.BOOKED}>{LOAD_STATUS_LABELS[LOAD_STATUS.BOOKED]}</option>
          <option value={LOAD_STATUS.PICKED_UP}>{LOAD_STATUS_LABELS[LOAD_STATUS.PICKED_UP]}</option>
          <option value={LOAD_STATUS.DELIVERED}>{LOAD_STATUS_LABELS[LOAD_STATUS.DELIVERED]}</option>
          <option value={LOAD_STATUS.PAID}>{LOAD_STATUS_LABELS[LOAD_STATUS.PAID]}</option>
        </select>
      </div>

      {loading ? (
        <TableSkeleton rows={16} columns={12} />
      ) : (
        <>
          <LoadsTable
            loads={loads}
            onEdit={openEdit}
            onDelete={handleDelete}
            onViewDocs={openDocs}
            onStatusChange={updateStatus}
          />
          <PaginationControls
            currentPage={page}
            totalItems={totalItems}
            pageSize={16}
            onPageChange={setPage}
          />
        </>
      )}

      <LoadFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingLoad={editingLoad}
        onSubmit={handleSubmit}
        isLoading={formLoading}
        carriers={carriers}
        trucks={trucks}
        drivers={drivers}
        cargoTypes={cargoTypes}
        requirements={requirements}
        onCreateCargoType={handleCreateCargoType}
        onCreateSpecialRequirement={handleCreateSpecialRequirement}
      />

      <LoadDocsDialog
        open={docsLoadId !== null}
        onOpenChange={(open) => { if (!open) setDocsLoadId(null); }}
        loadId={docsLoadId}
      />
    </div>
  );
}
