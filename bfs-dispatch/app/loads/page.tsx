"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { Search, Plus, Edit2, Trash2, Loader2, X, FileText, Upload, Eye } from "lucide-react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { RouteSelector } from "@/components/route-selector";
import { CreatableSelect } from "@/components/creatable-select";
import { TruckSelector } from "@/components/truck-selector";
import { PaginationControls } from "@/components/pagination-controls";
import { TableSkeleton } from "@/components/table-skeleton";
import {
  createCargoType,
  createSpecialRequirement,
  uploadLoadDocument,
  getLoadDocuments,
  getDocumentSignedUrl,
  deleteLoadDocument,
} from "@/lib/actions";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const loadSchema = z.object({
  load_data: z.string().optional().or(z.literal("")),
  load_weight: z.coerce.number().optional().nullable(),
  carrier_id: z.coerce.number().int().positive("Carrier es requerido"),
  truck_id: z.coerce.number().int().positive("Truck es requerido"),
  driver_id: z.coerce.number().int().positive("Driver es requerido"),
  route_id: z.coerce.number().int().positive("Ruta es requerida"),
  cargo_type_id: z.preprocess((val) => val === "" || val === null ? null : Number(val), z.number().int().positive().nullable().optional()),
  special_requirements_id: z.preprocess((val) => val === "" || val === null ? null : Number(val), z.number().int().positive().nullable().optional()),
  rate: z.coerce.number().min(0, "Rate es requerido"),
  dispatch_fee_pct: z.coerce.number().optional().nullable(),
  factoring: z.boolean().default(false),
  load_status: z.string().default("pending"),
  paid_status: z.string().default("unpaid"),
  status_id: z.coerce.number().default(1),
  picked_up_at: z.string().optional().or(z.literal("")),
  delivered_at: z.string().optional().or(z.literal("")),
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
  carrier_id: number | null;
  truck_id: number | null;
  driver_id: number | null;
  route_id: number | null;
  cargo_type_id: number | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  carrier_name: string | null;
  driver_name: string | null;
  unit_number: string | null;
  miles: number | null;
  cargo_type_name: string | null;
  total_count?: number;
};

type LoadForm = {
  load_data: string;
  load_weight: string;
  carrier_id: string;
  truck_id: string;
  driver_id: string;
  route_id: string;
  cargo_type_id: string;
  special_requirements_id: string;
  rate: string;
  dispatch_fee_pct: string;
  factoring: boolean;
  load_status: string;
  paid_status: string;
  status_id: number;
  picked_up_at: string;
  delivered_at: string;
};

const emptyForm: LoadForm = {
  load_data: "",
  load_weight: "",
  carrier_id: "",
  truck_id: "",
  driver_id: "",
  route_id: "",
  cargo_type_id: "",
  special_requirements_id: "",
  rate: "",
  dispatch_fee_pct: "",
  factoring: false,
  load_status: "pending",
  paid_status: "unpaid",
  status_id: 1,
  picked_up_at: "",
  delivered_at: "",
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const documentSchema = z.object({
  rc_file: z.instanceof(File).refine((file) => file.size <= MAX_FILE_SIZE, "RC debe ser menor a 5MB").optional(),
  bol_file: z.instanceof(File).refine((file) => file.size <= MAX_FILE_SIZE, "BOL debe ser menor a 5MB").optional(),
}).optional();

type SelectOption = { id: number; label: string };

export default function LoadsPage() {
  const PAGE_SIZE = 16;
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLoad, setEditingLoad] = useState<Load | null>(null);
  const [form, setForm] = useState<LoadForm>(emptyForm);
  const [formLoading, setFormLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const [carriers, setCarriers] = useState<SelectOption[]>([]);
  const [trucks, setTrucks] = useState<SelectOption[]>([]);
  const [drivers, setDrivers] = useState<SelectOption[]>([]);
  const [cargoTypes, setCargoTypes] = useState<SelectOption[]>([]);
  const [requirements, setRequirements] = useState<SelectOption[]>([]);

  const [rcFile, setRcFile] = useState<File | null>(null);
  const [bolFile, setBolFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [loadDocuments, setLoadDocuments] = useState<{ document_id: number; document_type: string; file_name: string; file_path: string }[]>([]);
  const [selectedLoadForDocs, setSelectedLoadForDocs] = useState<number | null>(null);
  const [docsDialogOpen, setDocsDialogOpen] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [docUrls, setDocUrls] = useState<Record<number, string>>({});

  const estimatedProfit = form.rate && form.dispatch_fee_pct
    ? (parseFloat(form.rate) * parseFloat(form.dispatch_fee_pct)) / 100
    : 0;

  const filteredTrucks = trucks;
  const filteredDrivers = drivers;

  useEffect(() => {
    fetchLoads();
    fetchSelectOptions();
  }, [search, statusFilter, page]);

  async function fetchLoads() {
    setLoading(true);
    const offset = (page - 1) * PAGE_SIZE;

    const { data, error } = await supabase.rpc("search_loads", {
      p_search: search || null,
      p_status: statusFilter !== "all" ? statusFilter : null,
      p_limit: PAGE_SIZE,
      p_offset: offset,
    });

    if (error) {
      setError(error.message);
      setLoads([]);
      setTotalItems(0);
    } else if (data && data.length > 0) {
      setLoads(data as Load[]);
      setTotalItems(data[0].total_count || 0);
    } else {
      setLoads([]);
      setTotalItems(0);
    }
    setLoading(false);
  }

  async function fetchSelectOptions() {
    const [carriersRes, trucksRes, driversRes, cargoRes, reqRes] = await Promise.all([
      supabase.from("carriers").select("carrier_id, first_name, last_name").eq("status_id", 1),
      supabase.from("trucks").select("truck_id, unit_number, carrier_id").eq("status_id", 1),
      supabase.from("drivers").select("driver_id, first_name, last_name, carrier_id").eq("status_id", 1),
      supabase.from("cargo_types").select("cargo_type_id, cargo_type_name").eq("status_id", 1),
      supabase.from("special_requirements").select("special_requirements_id, requirement_description").eq("status_id", 1),
    ]);

    if (carriersRes.data) setCarriers(carriersRes.data.map((c) => ({ id: c.carrier_id, label: `${c.first_name} ${c.last_name}` })));
    if (trucksRes.data) {
      const allTrucks = trucksRes.data.map((t) => ({ id: t.truck_id, label: t.unit_number }));
      setTrucks(allTrucks);
    }
    if (driversRes.data) {
      const allDrivers = driversRes.data.map((d) => ({ id: d.driver_id, label: `${d.first_name} ${d.last_name}` }));
      setDrivers(allDrivers);
    }
    if (cargoRes.data) setCargoTypes(cargoRes.data.map((c) => ({ id: c.cargo_type_id, label: c.cargo_type_name })));
    if (reqRes.data) setRequirements(reqRes.data.map((r) => ({ id: r.special_requirements_id, label: r.requirement_description })));
  }

  async function handleCreateCargoType(name: string): Promise<number> {
    const result = await createCargoType(name);
    const newOption = { id: result, label: name };
    setCargoTypes((prev) => [...prev, newOption]);
    return result;
  }

  async function handleCreateSpecialRequirement(name: string): Promise<number> {
    const result = await createSpecialRequirement(name);
    const newOption = { id: result, label: name };
    setRequirements((prev) => [...prev, newOption]);
    return result;
  }

  function openCreate() {
    setEditingLoad(null);
    setForm(emptyForm);
    setFormErrors({});
    setDialogOpen(true);
  }

  function openEdit(load: Load) {
    setEditingLoad(load);
    const formatDateTime = (ts: string | null) => {
      if (!ts) return "";
      const d = new Date(ts);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const hh = String(d.getHours()).padStart(2, "0");
      const min = String(d.getMinutes()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
    };
    setForm({
      load_data: load.load_data || "",
      load_weight: load.load_weight?.toString() || "",
      carrier_id: load.carrier_id?.toString() || "",
      truck_id: load.truck_id?.toString() || "",
      driver_id: load.driver_id?.toString() || "",
      route_id: load.route_id?.toString() || "",
      cargo_type_id: load.cargo_type_id?.toString() || "",
      special_requirements_id: "",
      rate: load.rate?.toString() || "",
      dispatch_fee_pct: load.dispatch_fee && load.rate && load.rate > 0
        ? ((load.dispatch_fee / load.rate) * 100).toFixed(1)
        : "",
      factoring: load.factoring || false,
      load_status: load.load_status || "pending",
      paid_status: load.paid_status || "unpaid",
      status_id: 1,
      picked_up_at: formatDateTime(load.picked_up_at),
      delivered_at: formatDateTime(load.delivered_at),
    });
    setFormErrors({});
    setDialogOpen(true);
  }

  async function handleSubmit() {
    console.log("handleSubmit called", { form, formErrors });
    try {
      setFormLoading(true);
      setUploadProgress(true);
      setFormErrors({});
      setUploadError(null);

      const result = loadSchema.safeParse(form);
      console.log("parse result", result);
      if (!result.success) {
        const errors: Record<string, string> = {};
        result.error.issues.forEach((issue) => {
          const key = String(issue.path[0]);
          errors[key] = issue.message;
        });
        setFormErrors(errors);
        setFormLoading(false);
        setUploadProgress(false);
        return;
      }

      if (rcFile && rcFile.size > MAX_FILE_SIZE) {
        setUploadError("RC debe ser menor a 5MB");
        setFormLoading(false);
        setUploadProgress(false);
        return;
      }

      if (bolFile && bolFile.size > MAX_FILE_SIZE) {
        setUploadError("BOL debe ser menor a 5MB");
        setFormLoading(false);
        setUploadProgress(false);
        return;
      }

      let dispatcherId: number | null = null;
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.user) {
        const { data: employee } = await supabase
          .from("employees")
          .select("employee_id")
          .eq("auth_user_id", sessionData.session.user.id)
          .maybeSingle();
        if (employee) {
          dispatcherId = employee.employee_id;
        }
      }

      const cleanData: Record<string, unknown> = {
        load_data: result.data.load_data || null,
        load_weight: result.data.load_weight || null,
        carrier_id: result.data.carrier_id,
        truck_id: result.data.truck_id,
        driver_id: result.data.driver_id,
        route_id: result.data.route_id,
        cargo_type_id: result.data.cargo_type_id || null,
        special_requirements_id: result.data.special_requirements_id || null,
        rate: result.data.rate,
        dispatch_fee: result.data.rate * ((result.data.dispatch_fee_pct || 0) / 100),
        factoring: result.data.factoring,
        load_status: result.data.load_status,
        paid_status: result.data.paid_status,
        status_id: result.data.status_id,
        picked_up_at: result.data.picked_up_at || null,
        delivered_at: result.data.delivered_at || null,
      };

      if (dispatcherId) {
        cleanData.dispatcher_id = dispatcherId;
      }

      let createdLoadId: number | null = null;

      if (!editingLoad) {
        const year = new Date().getFullYear();
        const { data: lastLoad } = await supabase
          .from("loads")
          .select("load_number")
          .not("load_number", "is", null)
          .like("load_number", `LD-${year}-%`)
          .order("load_id", { ascending: false })
          .limit(1)
          .single();

        let sequenceNumber = 1;
        if (lastLoad?.load_number) {
          const parts = lastLoad.load_number.split("-");
          const lastSeq = parseInt(parts[2] || "0", 10);
          sequenceNumber = lastSeq + 1;
        }

        const seqStr = sequenceNumber.toString().padStart(4, "0");
        cleanData.load_number = `LD-${year}-${seqStr}`;
      }

      if (editingLoad) {
        const { error } = await supabase
          .from("loads")
          .update(cleanData)
          .eq("load_id", editingLoad.load_id);
        if (error) {
          setError(error.message);
          setFormLoading(false);
          setUploadProgress(false);
          return;
        }
        createdLoadId = editingLoad.load_id;

        const uploadedDocs: { type: "RC" | "BOL"; file: File }[] = [];
        if (rcFile) uploadedDocs.push({ type: "RC", file: rcFile });
        if (bolFile) uploadedDocs.push({ type: "BOL", file: bolFile });
        console.log("Uploading docs:", uploadedDocs.length);

        for (const doc of uploadedDocs) {
          console.log("Uploading", doc.type, "to load", createdLoadId);
          try {
            await uploadLoadDocument(createdLoadId!, doc.type, doc.file, dispatcherId);
            console.log("Upload success:", doc.type);
          } catch (docError) {
            console.error(`Error uploading ${doc.type}:`, docError);
            setUploadError(`Error uploading ${doc.type}. La carga fue creada pero el documento falló.`);
          }
        }
      } else {
        const { data: newLoad, error: insertError } = await supabase.from("loads").insert([cleanData]).select("load_id").single();
        if (insertError) {
          setError(insertError.message);
          setFormLoading(false);
          setUploadProgress(false);
          return;
        }
        createdLoadId = newLoad.load_id;

        const uploadedDocs: { type: "RC" | "BOL"; file: File }[] = [];
        if (rcFile) uploadedDocs.push({ type: "RC", file: rcFile });
        if (bolFile) uploadedDocs.push({ type: "BOL", file: bolFile });
        console.log("Uploading docs:", uploadedDocs.length);

        for (const doc of uploadedDocs) {
          console.log("Uploading", doc.type, "to load", createdLoadId);
          try {
            await uploadLoadDocument(createdLoadId!, doc.type, doc.file, dispatcherId);
            console.log("Upload success:", doc.type);
          } catch (docError) {
            console.error(`Error uploading ${doc.type}:`, docError);
            setUploadError(`Error uploading ${doc.type}. La carga fue creada pero el documento falló.`);
          }
        }
      }

      setRcFile(null);
      setBolFile(null);
      setDialogOpen(false);
      fetchLoads();
    } catch (err) {
      console.error("handleSubmit error:", err);
      setError("Error al guardar la carga");
    } finally {
      setFormLoading(false);
      setUploadProgress(false);
    }
  }

  async function openDocsModal(loadId: number) {
    setSelectedLoadForDocs(loadId);
    setDocsDialogOpen(true);
    setLoadingDocs(true);
    setDocUrls({});
    try {
      const docs = await getLoadDocuments(loadId);
      setLoadDocuments(docs);
      for (const doc of docs) {
        try {
          const url = await getDocumentSignedUrl(doc.file_path);
          setDocUrls(prev => ({ ...prev, [doc.document_id]: url }));
        } catch (err) {
          console.error("Error getting signed url:", err);
        }
      }
    } catch (err) {
      console.error("Error loading documents:", err);
    } finally {
      setLoadingDocs(false);
    }
  }

  async function handleDeleteDoc(documentId: number, filePath: string) {
    if (!confirm("¿Eliminar este documento?")) return;
    try {
      await deleteLoadDocument(documentId, filePath);
      if (selectedLoadForDocs) {
        const docs = await getLoadDocuments(selectedLoadForDocs);
        setLoadDocuments(docs);
      }
    } catch (err) {
      console.error("Error deleting document:", err);
    }
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

  const dollarPerMile = (rate: number | null, miles: number | null | undefined) => {
    if (!rate || !miles || miles === 0) return "—";
    return `$${(rate / miles).toFixed(2)}`;
  };

  const formatTimestamp = (ts: string | null) => {
    if (!ts) return "—";
    const d = new Date(ts);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${mm}/${dd} ${hh}:${min}`;
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
        <TableSkeleton rows={16} columns={12} />
      ) : (
        <>
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
                <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Pickup</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Delivery</th>
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
                    {load.carrier_name || "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {load.driver_name || "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {load.unit_number || "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {load.cargo_type_name || "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {load.miles || "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {load.rate ? `$${load.rate.toLocaleString()}` : "—"}
                  </td>
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                    {dollarPerMile(load.rate, load.miles)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <span className={cn("inline-flex px-2 py-1 rounded-full text-xs font-medium", statusColors[load.load_status || "pending"])}>
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
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 font-mono text-xs">
                    {formatTimestamp(load.picked_up_at)}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 font-mono text-xs">
                    {formatTimestamp(load.delivered_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openDocsModal(load.load_id)} title="Ver documentos">
                        <FileText className="h-4 w-4 text-blue-500" />
                      </Button>
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
                  <td colSpan={12} className="text-center py-12 text-zinc-500">
                    No se encontraron cargas
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
                onChange={(e) => setForm({ ...form, carrier_id: e.target.value, driver_id: "", truck_id: "" })}
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
                {filteredDrivers.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
              </select>
              {formErrors.driver_id && <p className="text-xs text-red-500">{formErrors.driver_id}</p>}
            </div>

            <div className="space-y-2">
              <TruckSelector
                value={form.truck_id ? parseInt(form.truck_id) : null}
                onChange={(id) => setForm({ ...form, truck_id: id?.toString() || "" })}
                carrierId={form.carrier_id ? parseInt(form.carrier_id) : null}
                label="Truck *"
                error={formErrors.truck_id}
              />
            </div>

            <div className="space-y-2 col-span-2">
              <RouteSelector
                value={form.route_id ? parseInt(form.route_id) : null}
                onChange={(id) => setForm({ ...form, route_id: id?.toString() || "" })}
                label="Ruta *"
                error={formErrors.route_id}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="picked_up_at">Fecha/Hora Recogida</Label>
              <Input
                id="picked_up_at"
                type="datetime-local"
                value={form.picked_up_at}
                onChange={(e) => setForm({ ...form, picked_up_at: e.target.value })}
              />
              {formErrors.picked_up_at && <p className="text-xs text-red-500">{formErrors.picked_up_at}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivered_at">Fecha/Hora Entrega</Label>
              <Input
                id="delivered_at"
                type="datetime-local"
                value={form.delivered_at}
                onChange={(e) => setForm({ ...form, delivered_at: e.target.value })}
              />
              {formErrors.delivered_at && <p className="text-xs text-red-500">{formErrors.delivered_at}</p>}
            </div>

            <div className="col-span-2 -mt-2">
              <p className="text-xs text-zinc-400 dark:text-zinc-500">Zona horaria: Costa Rica (UTC-6)</p>
            </div>

            <CreatableSelect
              options={cargoTypes}
              value={form.cargo_type_id ? parseInt(form.cargo_type_id) : null}
              onChange={(id) => setForm({ ...form, cargo_type_id: id?.toString() || "" })}
              onCreateNew={handleCreateCargoType}
              label="Tipo de Carga"
              placeholder="Seleccionar tipo..."
            />

            <CreatableSelect
              options={requirements}
              value={form.special_requirements_id ? parseInt(form.special_requirements_id) : null}
              onChange={(id) => setForm({ ...form, special_requirements_id: id?.toString() || "" })}
              onCreateNew={handleCreateSpecialRequirement}
              label="Requisito Especial"
              placeholder="Seleccionar requisito..."
            />

            <div className="space-y-2">
              <Label htmlFor="rate">Rate ($) *</Label>
              <Input
                id="rate"
                type="number"
                min="0"
                step="0.01"
                value={form.rate}
                onChange={(e) => setForm({ ...form, rate: e.target.value })}
                placeholder="0.00"
              />
              {formErrors.rate && <p className="text-xs text-red-500">{formErrors.rate}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dispatch_fee_pct">Dispatch Fee (%)</Label>
              <Input
                id="dispatch_fee_pct"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={form.dispatch_fee_pct}
                onChange={(e) => setForm({ ...form, dispatch_fee_pct: e.target.value })}
                placeholder="3-8%"
              />
            </div>

            {estimatedProfit > 0 && (
              <div className="col-span-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-md p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-emerald-700 dark:text-emerald-400">Profit Estimado:</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">
                    ${estimatedProfit.toLocaleString("es-CR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            )}

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

            <div className="flex items-center gap-2">
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

            <div className="col-span-2 border-t border-zinc-200 dark:border-zinc-700 pt-4 mt-4">
              <Label className="text-sm font-medium mb-2 block">Documentos (PDF, máx 5MB)</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rc_file" className="text-xs text-zinc-500">Rate Confirmation (RC)</Label>
                  <div className="relative">
                    <input
                      id="rc_file"
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setRcFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <label
                      htmlFor="rc_file"
                      className="flex items-center gap-2 px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-md cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 text-sm"
                    >
                      <Upload className="h-4 w-4" />
                      {rcFile ? rcFile.name : "Seleccionar PDF"}
                    </label>
                  </div>
                  {rcFile && <p className="text-xs text-zinc-500">{ (rcFile.size / 1024 / 1024).toFixed(2) } MB</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bol_file" className="text-xs text-zinc-500">Bill of Lading (BOL)</Label>
                  <div className="relative">
                    <input
                      id="bol_file"
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setBolFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <label
                      htmlFor="bol_file"
                      className="flex items-center gap-2 px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-md cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 text-sm"
                    >
                      <Upload className="h-4 w-4" />
                      {bolFile ? bolFile.name : "Seleccionar PDF"}
                    </label>
                  </div>
                  {bolFile && <p className="text-xs text-zinc-500">{ (bolFile.size / 1024 / 1024).toFixed(2) } MB</p>}
                </div>
              </div>
              {uploadProgress && (
                <div className="mt-2 text-sm text-zinc-500 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Subiendo documentos...
                </div>
              )}
              {uploadError && <p className="text-xs text-red-500 mt-2">{uploadError}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={formLoading}>
              Cancelar
            </Button>
            <Button type="button" onClick={async () => {
                console.log("Button clicked");
                await handleSubmit();
              }} disabled={formLoading}>
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

      <Dialog open={docsDialogOpen} onOpenChange={setDocsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Documentación Adjunta</DialogTitle>
            <DialogDescription>
              Documentos asociados a esta carga. Usa el botón de ver para abrir o descargar.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {loadingDocs ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
              </div>
            ) : loadDocuments.length === 0 ? (
              <p className="text-center text-zinc-500 py-8">No hay documentos adjuntos</p>
            ) : (
              <div className="space-y-3">
                {loadDocuments.map((doc) => (
                  <div key={doc.document_id} className="flex items-center justify-between p-3 border border-zinc-200 dark:border-zinc-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-red-500" />
                      <div>
                        <p className="font-medium text-sm">{doc.document_type}</p>
                        <p className="text-xs text-zinc-500">{doc.file_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {docUrls[doc.document_id] && (
                        <a
                          href={docUrls[doc.document_id]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30"
                        >
                          <Eye className="h-4 w-4" />
                          Ver
                        </a>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteDoc(doc.document_id, doc.file_path)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDocsDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
