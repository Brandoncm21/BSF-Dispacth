"use server";

import { getSupabaseServerClient } from "./core";

export async function getCarrierById(carrierId: number) {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("carriers")
    .select("*")
    .eq("carrier_id", carrierId)
    .single();

  if (error) {
    console.error("[getCarrierById]", error.message, error.hint);
    throw error;
  }
  return data;
}

export async function searchCarriers(
  search: string,
  statusFilter: string,
  page: number,
  pageSize: number
) {
  const supabase = await getSupabaseServerClient();
  const offset = (page - 1) * pageSize;

  const { data, error } = await supabase.rpc("search_carriers", {
    p_search: search || null,
    p_status_id: statusFilter === "all" ? null : Number(statusFilter),
    p_limit: pageSize,
    p_offset: offset,
  });

  if (error) {
    console.error("[searchCarriers]", error.message, error.hint);
    throw error;
  }
  const rows = data || [];
  const total = rows.length > 0 ? Number(rows[0].total_count) : 0;
  const mapped = rows.map((r: Record<string, unknown>) => ({
    ...r,
    company_name: r.company_name || r.first_name,
    owner_name: r.owner_name || r.last_name,
    record_status: r.status_name ? { status_name: r.status_name } : null,
  }));
  return { data: mapped, count: total };
}

export async function getCarrierDispatchFee(carrierId: number): Promise<number> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_carrier_dispatch_fee", {
    p_carrier_id: carrierId,
  });

  if (error) {
    console.error("[getCarrierDispatchFee]", error.message, error.hint);
    throw error;
  }
  return Number(data) || 0.05;
}

export async function getStates() {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("states")
    .select("state_id, state_name")
    .eq("status_id", 1)
    .order("state_name");

  if (error) {
    console.error("[getStates]", error.message, error.hint);
    throw error;
  }
  return data;
}

export async function getCities(stateId: number) {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("cities")
    .select("city_id, city_name, state_id")
    .eq("state_id", stateId)
    .order("city_name");

  if (error) {
    console.error("[getCities]", error.message, error.hint);
    throw error;
  }
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
  if (error) {
    console.error("[searchAddresses]", error.message, error.hint);
    throw error;
  }
  return data;
}

export async function getDriverById(driverId: number) {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("drivers")
    .select("*")
    .eq("driver_id", driverId)
    .single();

  if (error) {
    console.error("[getDriverById]", error.message, error.hint);
    throw error;
  }
  return data;
}

export async function searchDrivers(
  search: string,
  page: number,
  pageSize: number,
  statusFilter?: string
) {
  const supabase = await getSupabaseServerClient();
  const offset = (page - 1) * pageSize;

  const { data, error } = await supabase.rpc("search_drivers", {
    p_search: search || null,
    p_status_id: statusFilter && statusFilter !== "all" ? Number(statusFilter) : null,
    p_limit: pageSize,
    p_offset: offset,
  });

  if (error) {
    console.error("[searchDrivers]", error.message, error.hint);
    throw error;
  }
  const rows = data || [];
  const total = rows.length > 0 ? Number(rows[0].total_count) : 0;
  const mapped = rows.map((r: Record<string, unknown>) => ({
    driver_id: r.driver_id,
    first_name: r.first_name,
    last_name: r.last_name,
    phone_number: r.phone_number,
    license_type: r.license_type,
    cdl_number: r.cdl_number,
    carrier_id: r.carrier_id,
    carriers: r.carrier_first_name
      ? { first_name: r.carrier_first_name as string, last_name: r.carrier_last_name as string }
      : null,
    status_id: r.status_id,
    record_status: r.status_name ? { status_name: r.status_name as string } : null,
  }));
  return { data: mapped, count: total };
}

export async function createCarrier(data: Record<string, unknown>) {
  const supabase = await getSupabaseServerClient();

  const insertData: Record<string, unknown> = {
    company_name: data.company_name || data.first_name || "",
    owner_name: data.owner_name || data.last_name || "",
    first_name: data.company_name || data.first_name || "",
    last_name: data.owner_name || data.last_name || "",
    email: data.email || null,
    phone_number: data.phone_number || null,
    address: data.address || null,
    motor_carrier_id: data.motor_carrier_id || null,
    us_department_of_transportation_number: data.us_department_of_transportation_number || null,
    employer_identification_number: data.employer_identification_number || null,
    social_security_number: data.social_security_number || null,
    factoring: data.factoring ?? false,
    status_id: data.status_id ?? 1,
  };

  if (data.mc_number !== undefined) insertData.mc_number = data.mc_number;
  if (data.dispatch_fee_percent !== undefined) insertData.dispatch_fee_percent = data.dispatch_fee_percent;
  if (data.dot_number !== undefined) insertData.dot_number = data.dot_number;

  const { error } = await supabase.from("carriers").insert([insertData]);
  if (error) {
    console.error("[createCarrier]", error.message, error.hint);
    throw error;
  }
}

export async function updateCarrier(carrierId: number, data: Record<string, unknown>) {
  const supabase = await getSupabaseServerClient();

  const updateData: Record<string, unknown> = {};
  const companyName = data.company_name ?? data.first_name;
  const ownerName = data.owner_name ?? data.last_name;

  if (companyName !== undefined) {
    updateData.company_name = companyName;
    updateData.first_name = companyName;
  }
  if (ownerName !== undefined) {
    updateData.owner_name = ownerName;
    updateData.last_name = ownerName;
  }
  if (data.email !== undefined) updateData.email = data.email || null;
  if (data.phone_number !== undefined) updateData.phone_number = data.phone_number || null;
  if (data.address !== undefined) updateData.address = data.address || null;
  if (data.motor_carrier_id !== undefined) updateData.motor_carrier_id = data.motor_carrier_id || null;
  if (data.us_department_of_transportation_number !== undefined) updateData.us_department_of_transportation_number = data.us_department_of_transportation_number || null;
  if (data.employer_identification_number !== undefined) updateData.employer_identification_number = data.employer_identification_number || null;
  if (data.social_security_number !== undefined) updateData.social_security_number = data.social_security_number || null;
  if (data.factoring !== undefined) updateData.factoring = data.factoring;
  if (data.status_id !== undefined) updateData.status_id = data.status_id;
  if (data.mc_number !== undefined) updateData.mc_number = data.mc_number;
  if (data.dispatch_fee_percent !== undefined) updateData.dispatch_fee_percent = data.dispatch_fee_percent;
  if (data.dot_number !== undefined) updateData.dot_number = data.dot_number;

  const { error } = await supabase.from("carriers").update(updateData).eq("carrier_id", carrierId);
  if (error) {
    console.error("[updateCarrier]", error.message, error.hint);
    throw error;
  }
}

export async function softDeleteCarrier(carrierId: number) {
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from("carriers").update({ status_id: 2 }).eq("carrier_id", carrierId);
  if (error) {
    console.error("[softDeleteCarrier]", error.message, error.hint);
    throw error;
  }
}

export async function getActiveCarriers() {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("carriers")
    .select("carrier_id, company_name, mc_number, dispatch_fee_percent")
    .eq("status_id", 1)
    .order("company_name");

  if (error) {
    console.error("[getActiveCarriers]", error.message, error.hint);
    throw error;
  }
  return data;
}

export async function getActiveDrivers() {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("drivers")
    .select("driver_id, first_name, last_name, carrier_id, has_twic_card")
    .eq("status_id", 1)
    .order("first_name");

  if (error) {
    console.error("[getActiveDrivers]", error.message, error.hint);
    throw error;
  }
  return data;
}

export async function getActiveTrucks() {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("trucks")
    .select("truck_id, unit_number, capacity, carrier_id, driver_id")
    .eq("status_id", 1)
    .order("unit_number");

  if (error) {
    console.error("[getActiveTrucks]", error.message, error.hint);
    throw error;
  }
  return data;
}

export async function getActiveBrokers() {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("brokers")
    .select("broker_id, first_name, last_name")
    .eq("status_id", 1)
    .order("first_name");

  if (error) {
    console.error("[getActiveBrokers]", error.message, error.hint);
    throw error;
  }
  return data;
}

export type BrokerSearchResult = {
  broker_id: number;
  first_name: string;
  last_name: string;
  mc_number: string | null;
  status_id: number;
  status_name: string;
};

export async function searchActiveBrokers(search: string): Promise<BrokerSearchResult[]> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("search_brokers", {
    p_search: search || null,
    p_status_id: 1,
    p_limit: 20,
    p_offset: 0,
  });

  if (error) {
    console.error("[searchActiveBrokers]", error.message, error.hint);
    throw error;
  }
  return (data || []) as BrokerSearchResult[];
}

export async function getRoles() {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("roles")
    .select("role_id, role_name, role_type")
    .eq("status_id", 1)
    .order("role_name");

  if (error) {
    console.error("[getRoles]", error.message, error.hint);
    throw error;
  }
  return data;
}

export async function getActiveCargoTypes() {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("cargo_types")
    .select("cargo_type_id, cargo_type_name")
    .eq("status_id", 1)
    .order("cargo_type_name");

  if (error) {
    console.error("[getActiveCargoTypes]", error.message, error.hint);
    throw error;
  }
  return data;
}

export async function getActiveSpecialRequirements() {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("special_requirements")
    .select("special_requirements_id, requirement_description")
    .eq("status_id", 1)
    .order("requirement_description");

  if (error) {
    console.error("[getActiveSpecialRequirements]", error.message, error.hint);
    throw error;
  }
  return data;
}

export async function getCarriersSimple() {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("carriers")
    .select("carrier_id, company_name, dispatch_fee_percent")
    .eq("status_id", 1)
    .order("company_name");

  if (error) {
    console.error("[getCarriersSimple]", error.message, error.hint);
    throw error;
  }
  return data;
}

export async function getDriversByCarrier(carrierId: number) {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_drivers_by_carrier", {
    p_carrier_id: carrierId,
  });

  if (error) {
    console.error("[getDriversByCarrier]", error.message, error.hint);
    throw error;
  }
  return data || [];
}

export async function createDriver(data: Record<string, unknown>) {
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from("drivers").insert([data]);
  if (error) {
    console.error("[createDriver]", error.message, error.hint);
    throw error;
  }
}

export async function updateDriver(driverId: number, data: Record<string, unknown>) {
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from("drivers").update(data).eq("driver_id", driverId);
  if (error) {
    console.error("[updateDriver]", error.message, error.hint);
    throw error;
  }
}

export async function softDeleteDriver(driverId: number) {
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from("drivers").update({ status_id: 2 }).eq("driver_id", driverId);
  if (error) {
    console.error("[softDeleteDriver]", error.message, error.hint);
    throw error;
  }
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

  if (error) {
    console.error("[createCargoType]", error.message, error.hint);
    throw error;
  }
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

  if (error) {
    console.error("[createSpecialRequirement]", error.message, error.hint);
    throw error;
  }
  return data.special_requirements_id;
}
