"use server";

import { z } from "zod";
import { LOAD_STATUS, PAID_STATUS } from "@/lib/constants";
import { getSupabaseServerClient } from "./core";

const createLoadSchema = z.object({
  carrier_id: z.coerce.number().min(1, "Carrier es requerido"),
  truck_id: z.coerce.number().min(1, "Truck es requerido"),
  driver_id: z.coerce.number().min(1, "Driver es requerido"),
  route_id: z.coerce.number().min(1, "Ruta es requerida"),
  cargo_type_id: z.preprocess(
    (val) => val === "" || val === null ? null : Number(val),
    z.number().int().positive().nullable().optional()
  ),
  special_requirements_id: z.preprocess(
    (val) => val === "" || val === null ? null : Number(val),
    z.number().int().positive().nullable().optional()
  ),
  broker_id: z.coerce.number().optional().nullable(),
  rate: z.coerce.number().optional().nullable(),
  dispatch_fee_pct: z.coerce.number().min(0).max(100).optional().nullable(),
  weight_lbs: z.coerce.number().optional().nullable(),
  load_data: z.string().optional().nullable(),
  factoring: z.boolean().default(false),
  load_status: z.string().default(LOAD_STATUS.PENDING),
  paid_status: z.string().default(PAID_STATUS.UNPAID),
  picked_up_at: z.string().min(1, "Fecha de recogida es requerida"),
  delivered_at: z.string().min(1, "Fecha de entrega es requerida"),
});

export async function createLoad(formData: z.infer<typeof createLoadSchema>) {
  const supabase = await getSupabaseServerClient();

  const result = createLoadSchema.safeParse(formData);
  if (!result.success) {
    const errors: Record<string, string> = {};
    result.error.issues.forEach((issue) => {
      const key = String(issue.path[0]);
      errors[key] = issue.message;
    });
    return { error: "Validation failed", errors };
  }

  const data = result.data;

  const { data: { user } } = await supabase.auth.getUser();

  let dispatcherId: number | null = null;
  if (user) {
    const { data: employee } = await supabase
      .from("employees")
      .select("employee_id")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    if (employee) {
      dispatcherId = employee.employee_id;
    }
  }

  const insertData: Record<string, unknown> = {
    carrier_id: data.carrier_id,
    truck_id: data.truck_id,
    driver_id: data.driver_id,
    route_id: data.route_id,
    cargo_type_id: data.cargo_type_id || null,
    special_requirements_id: data.special_requirements_id || null,
    broker_id: data.broker_id || null,
    rate: data.rate,
    dispatch_fee_pct: data.dispatch_fee_pct,
    weight_lbs: data.weight_lbs || null,
    load_data: data.load_data || null,
    factoring: data.factoring,
    load_status: data.load_status,
    paid_status: data.paid_status,
    status_id: 1,
    picked_up_at: data.picked_up_at || null,
    delivered_at: data.delivered_at || null,
  };

  if (dispatcherId) {
    insertData.dispatcher_id = dispatcherId;
  }

  insertData.confirmed_at = new Date().toISOString();

  const { data: newLoad, error: loadError } = await supabase
    .from("loads")
    .insert(insertData)
    .select("load_id")
    .single();

  if (loadError) {
    console.error("[createLoad]", loadError.message, loadError.hint);
    return { error: loadError.message };
  }

  if (dispatcherId) {
    await supabase.from("load_status_history").insert({
      load_id: newLoad.load_id,
      old_status: null,
      new_status: data.load_status || LOAD_STATUS.PENDING,
      changed_by: dispatcherId,
      changed_at: new Date().toISOString(),
      notes: "Carga creada",
    });
  }

  return { success: true, load_id: newLoad.load_id };
}

const updateLoadSchema = z.object({
  carrier_id: z.coerce.number().min(1, "Carrier es requerido").optional(),
  truck_id: z.coerce.number().min(1, "Truck es requerido").optional(),
  driver_id: z.coerce.number().min(1, "Driver es requerido").optional(),
  route_id: z.coerce.number().min(1, "Ruta es requerida").optional(),
  cargo_type_id: z.preprocess(
    (val) => val === "" || val === null ? null : Number(val),
    z.number().int().positive().nullable().optional()
  ),
  special_requirements_id: z.preprocess(
    (val) => val === "" || val === null ? null : Number(val),
    z.number().int().positive().nullable().optional()
  ),
  broker_id: z.coerce.number().optional().nullable(),
  rate: z.coerce.number().optional().nullable(),
  dispatch_fee_pct: z.coerce.number().min(0).max(100).optional().nullable(),
  weight_lbs: z.coerce.number().optional().nullable(),
  load_data: z.string().optional().nullable(),
  factoring: z.boolean().optional(),
  load_status: z.string().optional(),
  paid_status: z.string().optional(),
  picked_up_at: z.string().min(1, "Fecha de recogida es requerida").optional(),
  delivered_at: z.string().min(1, "Fecha de entrega es requerida").optional(),
});

export async function updateLoad(loadId: number, formData: z.infer<typeof updateLoadSchema>) {
  const supabase = await getSupabaseServerClient();

  const result = updateLoadSchema.safeParse(formData);
  if (!result.success) {
    const errors: Record<string, string> = {};
    result.error.issues.forEach((issue) => {
      const key = String(issue.path[0]);
      errors[key] = issue.message;
    });
    return { error: "Validation failed", errors };
  }

  const data = result.data;

  const { data: { user } } = await supabase.auth.getUser();

  let dispatcherId: number | null = null;
  if (user) {
    const { data: employee } = await supabase
      .from("employees")
      .select("employee_id")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    if (employee) {
      dispatcherId = employee.employee_id;
    }
  }

  const updateData: Record<string, unknown> = {};
  if (data.carrier_id !== undefined) updateData.carrier_id = data.carrier_id;
  if (data.truck_id !== undefined) updateData.truck_id = data.truck_id;
  if (data.driver_id !== undefined) updateData.driver_id = data.driver_id;
  if (data.route_id !== undefined) updateData.route_id = data.route_id;
  if (data.cargo_type_id !== undefined) updateData.cargo_type_id = data.cargo_type_id || null;
  if (data.special_requirements_id !== undefined) updateData.special_requirements_id = data.special_requirements_id || null;
  if (data.broker_id !== undefined) updateData.broker_id = data.broker_id || null;
  if (data.rate !== undefined) updateData.rate = data.rate;
  if (data.dispatch_fee_pct !== undefined) updateData.dispatch_fee_pct = data.dispatch_fee_pct;
  if (data.weight_lbs !== undefined) updateData.weight_lbs = data.weight_lbs || null;
  if (data.load_data !== undefined) updateData.load_data = data.load_data || null;
  if (data.factoring !== undefined) updateData.factoring = data.factoring;
  if (data.load_status !== undefined) updateData.load_status = data.load_status;
  if (data.paid_status !== undefined) updateData.paid_status = data.paid_status;
  if (data.picked_up_at !== undefined) updateData.picked_up_at = data.picked_up_at || null;
  if (data.delivered_at !== undefined) updateData.delivered_at = data.delivered_at || null;

  updateData.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from("loads")
    .update(updateData)
    .eq("load_id", loadId);

  if (error) {
    console.error("[updateLoad]", error.message, error.hint);
    return { error: error.message };
  }

  if (data.load_status && dispatcherId) {
    const { data: oldLoad } = await supabase
      .from("loads")
      .select("load_status")
      .eq("load_id", loadId)
      .single();

    await supabase.from("load_status_history").insert({
      load_id: loadId,
      old_status: oldLoad?.load_status || null,
      new_status: data.load_status,
      changed_by: dispatcherId,
      changed_at: new Date().toISOString(),
      notes: null,
    });
  }

  return { success: true };
}

export async function deleteLoad(loadId: number) {
  const supabase = await getSupabaseServerClient();

  const { error } = await supabase
    .from("loads")
    .update({ status_id: 2 })
    .eq("load_id", loadId);

  if (error) {
    console.error("[deleteLoad]", error.message, error.hint);
    return { error: error.message };
  }
  return { success: true };
}

export async function updateLoadStatus(loadId: number, status: string) {
  const supabase = await getSupabaseServerClient();

  const { data: oldLoad } = await supabase
    .from("loads")
    .select("load_status")
    .eq("load_id", loadId)
    .single();

  const { error } = await supabase
    .from("loads")
    .update({ load_status: status, updated_at: new Date().toISOString() })
    .eq("load_id", loadId);

  if (error) {
    console.error("[updateLoadStatus]", error.message, error.hint);
    return { error: error.message };
  }

  const { data: { user } } = await supabase.auth.getUser();
  let changedBy: number | null = null;
  if (user) {
    const { data: employee } = await supabase
      .from("employees")
      .select("employee_id")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    if (employee) changedBy = employee.employee_id;
  }

  await supabase.from("load_status_history").insert({
    load_id: loadId,
    old_status: oldLoad?.load_status || null,
    new_status: status,
    changed_by: changedBy,
    changed_at: new Date().toISOString(),
    notes: null,
  });

  return { success: true };
}

export async function searchLoads(
  search: string,
  statusFilter: string,
  page: number,
  pageSize: number
) {
  const supabase = await getSupabaseServerClient();
  const offset = (page - 1) * pageSize;

  const { data, error } = await supabase.rpc("search_loads", {
    p_search: search || null,
    p_status: statusFilter !== "all" ? statusFilter : null,
    p_limit: pageSize,
    p_offset: offset,
  });

  if (error) {
    console.error("[searchLoads]", error.message, error.hint);
    throw error;
  }
  const rows = data || [];
  const total = rows.length > 0 ? Number(rows[0].total_count) : 0;
  return { data: rows, count: total };
}
