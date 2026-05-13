"use server";

import { getSupabaseServerClient } from "./core";

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
