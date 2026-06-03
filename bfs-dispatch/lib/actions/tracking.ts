"use server";

import { z } from "zod";
import { getSupabaseServerClient } from "./core";

const reportCheckpointSchema = z.object({
  load_id: z.coerce.number().min(1, "Load es requerido"),
  driver_id: z.coerce.number().min(1, "Driver es requerido"),
  lat: z.coerce.number().min(-90).max(90, "Latitud inválida"),
  lng: z.coerce.number().min(-180).max(180, "Longitud inválida"),
  status_at_checkpoint: z.string().optional(),
  notes: z.string().optional(),
});

export async function reportCheckpoint(
  formData: z.infer<typeof reportCheckpointSchema>
) {
  const supabase = await getSupabaseServerClient();

  const result = reportCheckpointSchema.safeParse(formData);
  if (!result.success) {
    console.error("[reportCheckpoint] Validation:", result.error.issues);
    return { error: "Datos inválidos" };
  }

  const data = result.data;

  const { data: { user } } = await supabase.auth.getUser();
  let employeeId: number | null = null;
  if (user) {
    const { data: emp } = await supabase
      .from("employees")
      .select("employee_id")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    if (emp) employeeId = emp.employee_id;
  }

  // Insert checkpoint
  const { data: checkpoint, error: cpError } = await supabase
    .from("driver_checkpoints")
    .insert({
      load_id: data.load_id,
      driver_id: data.driver_id,
      lat: data.lat,
      lng: data.lng,
      status_at_checkpoint: data.status_at_checkpoint || null,
      notes: data.notes || null,
      created_by: employeeId,
    })
    .select("*")
    .single();

  if (cpError) {
    console.error("[reportCheckpoint]", cpError.message);
    return { error: cpError.message };
  }

  // Auto-transition load status if checkpoint signals pickup or delivery
  if (data.status_at_checkpoint === "picked_up") {
    await supabase
      .from("loads")
      .update({ load_status: "picked_up", picked_up_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("load_id", data.load_id);
  } else if (data.status_at_checkpoint === "delivered") {
    await supabase
      .from("loads")
      .update({ load_status: "delivered", delivered_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("load_id", data.load_id);
  }

  // Broadcast via Realtime
  await supabase.channel(`load-tracking:${data.load_id}`).send({
    type: "broadcast",
    event: "checkpoint",
    payload: checkpoint,
  });

  return { success: true, checkpoint };
}

export async function getCheckpointHistory(loadId: number) {
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from("driver_checkpoints")
    .select("*, drivers!inner(first_name, last_name)")
    .eq("load_id", loadId)
    .order("recorded_at", { ascending: false });

  if (error) {
    console.error("[getCheckpointHistory]", error.message);
    throw error;
  }

  return data || [];
}

export async function getLoadTrack(token: string) {
  const supabase = await getSupabaseServerClient();

  if (!token || token.length < 10) {
    return null;
  }

  const { data, error } = await supabase
    .from("loads")
    .select(`
      load_id, load_number, load_status, rate,
      picked_up_at, delivered_at, booked_at, created_at,
      carrier_id,
      driver_id,
      drivers!left(first_name, last_name, phone_number),
      carriers!left(company_name),
      tracking_token
    `)
    .eq("tracking_token", token)
    .maybeSingle();

  if (error) {
    console.error("[getLoadTrack]", error.message);
    return null;
  }

  if (!data) return null;

  // Get latest checkpoint for the map
  const { data: checkpoints } = await supabase
    .from("driver_checkpoints")
    .select("*")
    .eq("load_id", data.load_id)
    .order("recorded_at", { ascending: false })
    .limit(20);

  // Get route info
  const { data: route } = await supabase
    .from("routes_v")
    .select("origin_state_name, destination_state_name, miles, estimated_time")
    .eq("load_id", data.load_id)
    .maybeSingle();

  return {
    load: data,
    checkpoints: checkpoints || [],
    route,
  };
}
