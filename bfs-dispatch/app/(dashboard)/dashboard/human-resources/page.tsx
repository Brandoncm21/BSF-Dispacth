"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, X, UserCog, Power, Shield } from "lucide-react";
import { PaginationControls } from "@/components/pagination-controls";
import { TableSkeleton } from "@/components/table-skeleton";
import { useHasAccess } from "@/hooks/use-has-access";
import { getRoles } from "@/lib/actions";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { cn } from "@/lib/utils";

const supabase = createSupabaseBrowserClient();

type Employee = {
  employee_id: number;
  first_name: string;
  last_name: string;
  role_id: number;
  role_name: string;
  role_type: string;
  status_id: number;
  status_name: string;
  auth_user_id: string | null;
  dispatch_vendor: string | null;
  total_count?: number;
};

type Role = {
  role_id: number;
  role_name: string;
  role_type: string;
};

export default function HumanResourcesPage() {
  const PAGE_SIZE = 16;
  const { allowed: canManage } = useHasAccess("human_resources");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedRole, setSelectedRole] = useState<number | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchEmployees();
    fetchRoles();
  }, [search, statusFilter, page]);

  async function fetchEmployees() {
    setLoading(true);
    const offset = (page - 1) * PAGE_SIZE;

    const { data, error } = await supabase.rpc("search_employees", {
      p_search: search || null,
      p_status: statusFilter,
      p_limit: PAGE_SIZE,
      p_offset: offset,
    });

    if (error) {
      setError(error.message);
      setEmployees([]);
      setTotalItems(0);
    } else if (data && data.length > 0) {
      setEmployees(data as Employee[]);
      setTotalItems(Number(data[0].total_count) || 0);
    } else {
      setEmployees([]);
      setTotalItems(0);
    }
    setLoading(false);
  }

  async function fetchRoles() {
    try {
      const data = await getRoles();
      setRoles(data as Role[]);
    } catch { /* ignore */ }
  }

  async function handleToggleStatus(employeeId: number) {
    setActionLoading(employeeId);
    const { data, error } = await supabase.rpc("toggle_employee_status", {
      p_employee_id: employeeId,
    });

    if (error) {
      setError(error.message);
    } else if (!data) {
      setError("No tienes permisos para realizar esta acción");
    } else {
      fetchEmployees();
    }
    setActionLoading(null);
  }

  function openEditDialog(employee: Employee) {
    setSelectedEmployee(employee);
    setSelectedRole(employee.role_id);
    setEditDialogOpen(true);
  }

  async function handleSaveRole() {
    if (!selectedEmployee || !selectedRole) return;

    setActionLoading(selectedEmployee.employee_id);
    const { data, error } = await supabase.rpc("update_employee_role", {
      p_employee_id: selectedEmployee.employee_id,
      p_new_role_id: selectedRole,
    });

    if (error) {
      setError(error.message);
    } else if (!data) {
      setError("No tienes permisos para realizar esta acción");
    } else {
      setEditDialogOpen(false);
      fetchEmployees();
    }
    setActionLoading(null);
  }

  const roleBadgeColors: Record<string, string> = {
    admin: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    dispatcher: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    logistics: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    sales: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    back_office: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
            <UserCog className="h-8 w-8" />
            Staff Management
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Gestión de personal y control de accesos
          </p>
        </div>
      </div>

      {!canManage && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>
            No tienes acceso a este módulo. Se requiere rol de Administrador.
          </AlertDescription>
        </Alert>
      )}

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
            placeholder="Buscar por nombre o rol..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={statusFilter ?? "all"}
          onChange={(e) => setStatusFilter(e.target.value === "all" ? null : Number(e.target.value))}
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
                  <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Nombre</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Rol</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Tipo</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Estado</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Vendor</th>
                  <th className="text-right px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {employees.map((emp) => (
                  <tr key={emp.employee_id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900">
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                      {emp.first_name} {emp.last_name}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className={cn(
                          "inline-flex px-2 py-1 rounded-full text-xs font-medium",
                          roleBadgeColors[emp.role_type] ?? "bg-zinc-100 text-zinc-700"
                        )}
                      >
                        {emp.role_name}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 font-mono text-xs">
                      {emp.role_type}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex px-2 py-1 rounded-full text-xs font-medium",
                          emp.status_id === 1
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : emp.status_id === 2
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                        )}
                      >
                        {emp.status_name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {emp.dispatch_vendor || "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(emp)}
                          title="Editar rol"
                        >
                          <Shield className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleStatus(emp.employee_id)}
                          disabled={actionLoading === emp.employee_id}
                          title={emp.status_id === 1 ? "Desactivar" : "Activar"}
                        >
                          {actionLoading === emp.employee_id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Power
                              className={cn(
                                "h-4 w-4",
                                emp.status_id === 1
                                  ? "text-red-500"
                                  : "text-green-500"
                              )}
                            />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {employees.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-zinc-500">
                      No se encontraron empleados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <PaginationControls
            currentPage={page}
            totalItems={totalItems}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </>
      )}

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Rol de Empleado</DialogTitle>
            <DialogDescription>
              {selectedEmployee && `${selectedEmployee.first_name} ${selectedEmployee.last_name}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="role">Nuevo Rol</Label>
              <select
                id="role"
                value={selectedRole ?? ""}
                onChange={(e) => setSelectedRole(Number(e.target.value))}
                className="flex w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-2 text-sm"
              >
                <option value="">Seleccionar rol</option>
                {roles.map((r) => (
                  <option key={r.role_id} value={r.role_id}>
                    {r.role_name} ({r.role_type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={actionLoading !== null}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSaveRole}
              disabled={actionLoading !== null || !selectedRole}
            >
              {actionLoading !== null ? (
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
