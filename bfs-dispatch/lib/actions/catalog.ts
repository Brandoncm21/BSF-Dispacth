"use server";

import { getSupabaseServerClient } from "./core";

export async function searchCarriers(
  search: string,
  statusFilter: string,
  page: number,
  pageSize: number
) {
  const supabase = await getSupabaseServerClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("carriers")
    .select("*, record_status:status_id(status_name)", { count: "exact" });

  if (search) {
    query = query.or(
      `first_name.ilike.%${search}%,last_name.ilike.%${search}%,motor_carrier_id.ilike.%${search}%`
    );
  }

  if (statusFilter !== "all") {
    query = query.eq("status_id", parseInt(statusFilter));
  }

  const { data, count, error } = await query.range(from, to);

  if (error) throw error;
  return { data: data || [], count: count || 0 };
}

export async function getStates() {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("states")
    .select("state_id, state_name")
    .eq("status_id", 1)
    .order("state_name");

  if (error) throw error;
  return data;
}

export async function getCities(stateId: number) {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("cities")
    .select("city_id, city_name, state_id")
    .eq("state_id", stateId)
    .order("city_name");

  if (error) throw error;
  return data;
}

export async function searchAddresses(query: string, cityId?: number) {
  const supabase = await getSupabaseServerClient();
  let request = supabase
    .from("addresses")
    .select(`
      address_id,
      address_description,
      street_id,
      state_id,
      cities(city_id, city_name, state_id, states(state_id, state_name))
    `)
    .ilike("address_description", `%${query}%`)
    .limit(20);

  if (cityId) {
    request = request.eq("cities.city_id", cityId);
  }

  const { data, error } = await request;
  if (error) throw error;
  return data;
}

export async function searchDrivers(
  search: string,
  page: number,
  pageSize: number
) {
  const supabase = await getSupabaseServerClient();
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from("drivers")
    .select("*, carriers(first_name, last_name), record_status:status_id(status_name)", { count: "exact" });

  if (search) {
    query = query.or(
      `first_name.ilike.%${search}%,last_name.ilike.%${search}%,cdl_number.ilike.%${search}%`
    );
  }

  const { data, count, error } = await query.range(offset, offset + pageSize - 1);

  if (error) throw error;
  return { data: data || [], count: count || 0 };
}

export async function createCarrier(data: Record<string, unknown>) {
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from("carriers").insert([data]);
  if (error) throw error;
}

export async function updateCarrier(carrierId: number, data: Record<string, unknown>) {
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from("carriers").update(data).eq("carrier_id", carrierId);
  if (error) throw error;
}

export async function softDeleteCarrier(carrierId: number) {
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from("carriers").update({ status_id: 2 }).eq("carrier_id", carrierId);
  if (error) throw error;
}

export async function getActiveCarriers() {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("carriers")
    .select("carrier_id, first_name, last_name, mc_number")
    .eq("status_id", 1)
    .order("first_name");

  if (error) throw error;
  return data;
}

export async function getActiveDrivers() {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("drivers")
    .select("driver_id, first_name, last_name, carrier_id")
    .eq("status_id", 1)
    .order("first_name");

  if (error) throw error;
  return data;
}

export async function getActiveTrucks() {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("trucks")
    .select("truck_id, unit_number, capacity")
    .eq("status_id", 1)
    .order("unit_number");

  if (error) throw error;
  return data;
}

export async function getActiveBrokers() {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("brokers")
    .select("broker_id, first_name, last_name")
    .eq("status_id", 1)
    .order("first_name");

  if (error) throw error;
  return data;
}

export async function getRoles() {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("roles")
    .select("role_id, role_name, role_type")
    .eq("status_id", 1)
    .order("role_name");

  if (error) throw error;
  return data;
}

export async function getActiveCargoTypes() {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("cargo_types")
    .select("cargo_type_id, cargo_type_name")
    .eq("status_id", 1)
    .order("cargo_type_name");

  if (error) throw error;
  return data;
}

export async function getActiveSpecialRequirements() {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("special_requirements")
    .select("special_requirements_id, requirement_description")
    .eq("status_id", 1)
    .order("requirement_description");

  if (error) throw error;
  return data;
}

export async function getCarriersSimple() {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("carriers")
    .select("carrier_id, first_name, last_name")
    .eq("status_id", 1)
    .order("first_name");

  if (error) throw error;
  return data;
}

export async function createDriver(data: Record<string, unknown>) {
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from("drivers").insert([data]);
  if (error) throw error;
}

export async function updateDriver(driverId: number, data: Record<string, unknown>) {
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from("drivers").update(data).eq("driver_id", driverId);
  if (error) throw error;
}

export async function softDeleteDriver(driverId: number) {
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from("drivers").update({ status_id: 2 }).eq("driver_id", driverId);
  if (error) throw error;
}

export async function createCargoType(name: string) {
  const supabase = await getSupabaseServerClient();

  const { data: existing } = await supabase
    .from("cargo_types")
    .select("cargo_type_id")
    .eq("cargo_type_name", name)
    .eq("status_id", 1)
    .single();

  if (existing) {
    return existing.cargo_type_id;
  }

  const { data, error } = await supabase
    .from("cargo_types")
    .insert({ cargo_type_name: name, status_id: 1 })
    .select("cargo_type_id")
    .single();

  if (error) throw error;
  return data.cargo_type_id;
}

export async function createSpecialRequirement(description: string) {
  const supabase = await getSupabaseServerClient();

  const { data: existing } = await supabase
    .from("special_requirements")
    .select("special_requirements_id")
    .eq("requirement_description", description)
    .eq("status_id", 1)
    .single();

  if (existing) {
    return existing.special_requirements_id;
  }

  const { data, error } = await supabase
    .from("special_requirements")
    .insert({ requirement_description: description, status_id: 1 })
    .select("special_requirements_id")
    .single();

  if (error) throw error;
  return data.special_requirements_id;
}
