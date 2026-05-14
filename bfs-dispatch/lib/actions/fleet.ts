"use server";

import { getSupabaseServerClient } from "./core";

export type AvailabilityStatus = 'disponible' | 'en_ruta' | 'maintenance';

export interface TruckWithAvailability {
  truck_id: number;
  unit_number: string;
  vehicle_type: string | null;
  capacity: string | null;
  operational_status: string | null;
  carrier_id: number | null;
  carrier_name: string;
  record_status: string | null;
  availability_status: AvailabilityStatus;
  current_route: string | null;
  current_load_status: string | null;
  current_load_id: number | null;
  current_load_number: string | null;
  current_load_created_at: string | null;
}

export interface TruckLoadHistory {
  load_id: number;
  load_number: string;
  load_date: string;
  origin: string;
  destination: string;
  load_status: string;
  rate: number;
  driver_id?: number;
}

export interface FleetAlert {
  truck_id: number;
  unit_number: string;
  carrier_name: string;
  alert_type: 'maintenance' | 'delay' | 'available';
  message: string;
  current_route?: string;
}

export type TruckStatus = 'active' | 'inactive' | 'maintenance' | 'in_route';

export interface TruckWithSmartStatus {
  truck_id: number;
  unit_number: string;
  truck_type: string;
  carrier_id: number;
  carrier_name: string;
  operational_status: string;
  current_load_id: number | null;
  current_load_number: string | null;
  smart_status: TruckStatus;
  status_reason: string | null;
  plate_number: string | null;
  vin: string | null;
  truck_name: string | null;
  empty_weight: number | null;
  driver_id: number | null;
  driver_first_name: string | null;
  driver_last_name: string | null;
}

export interface MaintenanceRecord {
  maintenance_id: number;
  truck_id: number;
  maintenance_type: string;
  maintenance_date: string;
  mileage: number | null;
  description: string | null;
  cost: number | null;
  mechanic_notes: string | null;
  status_id: number | null;
  created_at: string | null;
}

export interface BrokerContact {
  contact_id: number;
  broker_id: number;
  contact_name: string;
  email: string | null;
  phone: string | null;
  is_primary: boolean;
  status_id: number | null;
}

export async function getMaintenanceRecords(truckId: number): Promise<MaintenanceRecord[]> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("maintenance_records")
    .select("*")
    .eq("truck_id", truckId)
    .order("maintenance_date", { ascending: false });

  if (error) {
    console.error("[getMaintenanceRecords]", error.message, error.hint);
    throw error;
  }
  return data as MaintenanceRecord[];
}

export async function createMaintenanceRecord(data: {
  truck_id: number;
  maintenance_type: string;
  maintenance_date: string;
  mileage?: number;
  description?: string;
  cost?: number;
  mechanic_notes?: string;
}) {
  const supabase = await getSupabaseServerClient();
  const { data: result, error } = await supabase
    .from("maintenance_records")
    .insert({ ...data, status_id: 1 })
    .select("maintenance_id")
    .single();

  if (error) {
    console.error("[createMaintenanceRecord]", error.message, error.hint);
    throw error;
  }
  return result.maintenance_id;
}

export async function updateMaintenanceRecord(
  maintenanceId: number,
  data: Partial<{
    maintenance_type: string;
    maintenance_date: string;
    mileage: number;
    description: string;
    cost: number;
    mechanic_notes: string;
  }>
) {
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase
    .from("maintenance_records")
    .update(data)
    .eq("maintenance_id", maintenanceId);

  if (error) {
    console.error("[updateMaintenanceRecord]", error.message, error.hint);
    throw error;
  }
}

export async function deleteMaintenanceRecord(maintenanceId: number) {
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase
    .from("maintenance_records")
    .update({ status_id: 2 })
    .eq("maintenance_id", maintenanceId);

  if (error) {
    console.error("[deleteMaintenanceRecord]", error.message, error.hint);
    throw error;
  }
}

export async function getBrokerContacts(brokerId: number): Promise<BrokerContact[]> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("broker_contacts")
    .select("*")
    .eq("broker_id", brokerId)
    .eq("status_id", 1)
    .order("is_primary", { ascending: false });

  if (error) {
    console.error("[getBrokerContacts]", error.message, error.hint);
    throw error;
  }
  return data as BrokerContact[];
}

export async function createBrokerContact(data: {
  broker_id: number;
  contact_name: string;
  email?: string;
  phone?: string;
  is_primary?: boolean;
}) {
  const supabase = await getSupabaseServerClient();
  const { data: result, error } = await supabase
    .from("broker_contacts")
    .insert({ ...data, status_id: 1 })
    .select("contact_id")
    .single();

  if (error) {
    console.error("[createBrokerContact]", error.message, error.hint);
    throw error;
  }
  return result.contact_id;
}

export async function updateBrokerContact(
  contactId: number,
  data: Partial<{
    contact_name: string;
    email: string;
    phone: string;
    is_primary: boolean;
  }>
) {
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase
    .from("broker_contacts")
    .update(data)
    .eq("contact_id", contactId);

  if (error) {
    console.error("[updateBrokerContact]", error.message, error.hint);
    throw error;
  }
}

export async function deleteBrokerContact(contactId: number) {
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase
    .from("broker_contacts")
    .update({ status_id: 2 })
    .eq("contact_id", contactId);

  if (error) {
    console.error("[deleteBrokerContact]", error.message, error.hint);
    throw error;
  }
}

export async function setPrimaryContact(contactId: number, brokerId: number) {
  const supabase = await getSupabaseServerClient();

  await supabase
    .from("broker_contacts")
    .update({ is_primary: false })
    .eq("broker_id", brokerId);

  const { error } = await supabase
    .from("broker_contacts")
    .update({ is_primary: true })
    .eq("contact_id", contactId);

  if (error) {
    console.error("[setPrimaryContact]", error.message, error.hint);
    throw error;
  }
}

export async function getTruckById(truckId: number) {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("trucks")
    .select("*")
    .eq("truck_id", truckId)
    .single();

  if (error) {
    console.error("[getTruckById]", error.message, error.hint);
    throw error;
  }
  return data;
}

export async function getTrucksWithAvailability() {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("trucks_with_availability")
    .select("*")
    .eq("record_status", "Activo")
    .order("unit_number");

  if (error) {
    console.error("[getTrucksWithAvailability]", error.message, error.hint);
    throw error;
  }
  return data as TruckWithAvailability[];
}

export async function getTruckLoadHistory(truckId: number, days: number = 30): Promise<TruckLoadHistory[]> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_truck_load_history", {
    p_truck_id: truckId,
    p_days: days,
  });

  if (error) {
    console.error("[getTruckLoadHistory]", error.message, error.hint);
    throw error;
  }
  return data as TruckLoadHistory[];
}

export async function getFleetOverview() {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("trucks_with_availability")
    .select("*")
    .eq("record_status", "Activo")
    .order("carrier_name, unit_number");

  if (error) {
    console.error("[getFleetOverview]", error.message, error.hint);
    throw error;
  }

  const grouped: Record<string, TruckWithAvailability[]> = {};
  (data as TruckWithAvailability[]).forEach((truck) => {
    if (!grouped[truck.carrier_name]) {
      grouped[truck.carrier_name] = [];
    }
    grouped[truck.carrier_name].push(truck);
  });

  return grouped;
}

export async function getFleetAlerts(): Promise<FleetAlert[]> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("trucks_with_availability")
    .select("*")
    .eq("record_status", "Activo");

  if (error) {
    console.error("[getFleetAlerts]", error.message, error.hint);
    throw error;
  }

  const alerts: FleetAlert[] = [];
  const now = new Date();

  (data as TruckWithAvailability[]).forEach((truck) => {
    if (truck.availability_status === 'maintenance') {
      alerts.push({
        truck_id: truck.truck_id,
        unit_number: truck.unit_number,
        carrier_name: truck.carrier_name,
        alert_type: 'maintenance',
        message: `${truck.unit_number} está en mantenimiento`,
        current_route: truck.current_route || undefined,
      });
    } else if (truck.availability_status === 'en_ruta' && truck.current_load_status) {
      const statusAge = truck.current_load_created_at
        ? now.getTime() - new Date(truck.current_load_created_at).getTime()
        : 0;
      if (statusAge > 48 * 60 * 60 * 1000) {
        alerts.push({
          truck_id: truck.truck_id,
          unit_number: truck.unit_number,
          carrier_name: truck.carrier_name,
          alert_type: 'delay',
          message: `${truck.unit_number} en ruta hace más de 48h`,
          current_route: truck.current_route || undefined,
        });
      }
    } else if (truck.availability_status === 'disponible') {
      alerts.push({
        truck_id: truck.truck_id,
        unit_number: truck.unit_number,
        carrier_name: truck.carrier_name,
        alert_type: 'available',
        message: `${truck.unit_number} disponible`,
      });
    }
  });

  return alerts;
}

export async function getTrucksWithSmartStatus() {
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase.rpc("get_trucks_with_smart_status");

  if (error) {
    console.error("[getTrucksWithSmartStatus]", error.message, error.hint);
    throw error;
  }
  return data as TruckWithSmartStatus[];
}

export async function getTrucksByCarrier(carrierId: number) {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_trucks_by_carrier", {
    p_carrier_id: carrierId,
  });

  if (error) {
    console.error("[getTrucksByCarrier]", error.message, error.hint);
    throw error;
  }
  return data || [];
}

export async function searchTrucks(
  search: string,
  page: number,
  pageSize: number
) {
  const supabase = await getSupabaseServerClient();
  const offset = (page - 1) * pageSize;

  const { data, error } = await supabase.rpc("search_trucks", {
    p_search: search || null,
    p_status_id: 1,
    p_limit: pageSize,
    p_offset: offset,
  });

  if (error) {
    console.error("[searchTrucks]", error.message, error.hint);
    throw error;
  }
  const rows = data || [];
  const total = rows.length > 0 ? Number(rows[0].total_count) : 0;
  const mapped = rows.map((r: Record<string, unknown>) => ({
    truck_id: r.truck_id,
    unit_number: r.unit_number,
    plate_number: r.plate_number,
    vin: r.vin,
    truck_name: r.truck_name,
    vehicle_type: r.vehicle_type,
    capacity: r.capacity,
    empty_weight: r.empty_weight,
    operational_status: r.operational_status,
    carrier_id: r.carrier_id,
    driver_id: r.driver_id,
    driver_first_name: r.driver_first_name,
    driver_last_name: r.driver_last_name,
    carrier_company_name: r.carrier_company_name,
    status_id: r.status_id,
    record_status: r.status_name ? { status_name: r.status_name as string } : null,
  }));
  return { data: mapped, count: total };
}

export async function updateTruckStatus(truckId: number, operationalStatus: string) {
  const supabase = await getSupabaseServerClient();

  const { error } = await supabase
    .from("trucks")
    .update({ operational_status: operationalStatus })
    .eq("truck_id", truckId);

  if (error) {
    console.error("[updateTruckStatus]", error.message, error.hint);
    throw error;
  }
}

export async function createTruck(data: {
  unit_number: string;
  carrier_id: number;
  truck_type: string;
  capacity?: string;
  operational_status?: string;
  plate_number?: string;
  vin?: string;
  truck_name?: string;
  empty_weight?: number;
  driver_id?: number;
}) {
  const supabase = await getSupabaseServerClient();

  const { data: newTruck, error } = await supabase
    .from("trucks")
    .insert({
      unit_number: data.unit_number,
      carrier_id: data.carrier_id,
      vehicle_type: data.truck_type,
      capacity: data.capacity || null,
      operational_status: data.operational_status || "Activo",
      status_id: 1,
      plate_number: data.plate_number || null,
      vin: data.vin || null,
      truck_name: data.truck_name || null,
      empty_weight: data.empty_weight || null,
      driver_id: data.driver_id || null,
    })
    .select("truck_id")
    .single();

  if (error) {
    console.error("[createTruck]", error.message, error.hint);
    throw error;
  }
  return newTruck.truck_id;
}

export async function updateTruck(
  truckId: number,
  data: {
    unit_number?: string;
    carrier_id?: number;
    truck_type?: string;
    capacity?: string;
    operational_status?: string;
    plate_number?: string;
    vin?: string;
    truck_name?: string;
    empty_weight?: number;
    driver_id?: number;
  }
) {
  const supabase = await getSupabaseServerClient();

  const updates: Record<string, unknown> = {};
  if (data.unit_number) updates.unit_number = data.unit_number;
  if (data.carrier_id) updates.carrier_id = data.carrier_id;
  if (data.truck_type) updates.vehicle_type = data.truck_type;
  if (data.capacity) updates.capacity = data.capacity;
  if (data.operational_status) updates.operational_status = data.operational_status;
  if (data.plate_number !== undefined) updates.plate_number = data.plate_number || null;
  if (data.vin !== undefined) updates.vin = data.vin || null;
  if (data.truck_name !== undefined) updates.truck_name = data.truck_name || null;
  if (data.empty_weight !== undefined) updates.empty_weight = data.empty_weight || null;
  if (data.driver_id !== undefined) updates.driver_id = data.driver_id || null;

  const { error } = await supabase
    .from("trucks")
    .update(updates)
    .eq("truck_id", truckId);

  if (error) {
    console.error("[updateTruck]", error.message, error.hint);
    throw error;
  }
}

export interface Broker {
  broker_id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  phone_number: string | null;
  mc_number?: string | null;
  usdot_number?: string | null;
  status_id: number;
}

export async function getBrokerById(brokerId: number) {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("brokers")
    .select("*")
    .eq("broker_id", brokerId)
    .single();

  if (error) {
    console.error("[getBrokerById]", error.message, error.hint);
    throw error;
  }
  return data;
}

export async function getBrokers() {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("brokers")
    .select("*")
    .eq("status_id", 1)
    .order("first_name");

  if (error) {
    console.error("[getBrokers]", error.message, error.hint);
    throw error;
  }
  return data as Broker[];
}

export async function searchBrokers(
  search: string,
  statusFilter: string,
  page: number,
  pageSize: number
) {
  const supabase = await getSupabaseServerClient();
  const offset = (page - 1) * pageSize;

  const { data, error } = await supabase.rpc("search_brokers", {
    p_search: search || null,
    p_status_id: statusFilter === "all" ? null : Number(statusFilter),
    p_limit: pageSize,
    p_offset: offset,
  });

  if (error) {
    console.error("[searchBrokers]", error.message, error.hint);
    throw error;
  }
  const rows = data || [];
  const total = rows.length > 0 ? Number(rows[0].total_count) : 0;
  return { data: rows as Broker[], count: total };
}

export async function createBroker(data: {
  first_name: string;
  last_name: string;
  email?: string;
  phone_number?: string;
  mc_number?: string;
  usdot_number?: string;
}) {
  const supabase = await getSupabaseServerClient();

  const insertData: Record<string, unknown> = {
    first_name: data.first_name,
    last_name: data.last_name,
    email: data.email || null,
    phone_number: data.phone_number || null,
    status_id: 1,
  };
  if (data.mc_number !== undefined) insertData.mc_number = data.mc_number;
  if (data.usdot_number !== undefined) insertData.usdot_number = data.usdot_number;

  const { data: newBroker, error } = await supabase
    .from("brokers")
    .insert(insertData)
    .select("broker_id")
    .single();

  if (error) {
    console.error("[createBroker]", error.message, error.hint);
    throw error;
  }
  return newBroker.broker_id;
}

export async function updateBroker(
  brokerId: number,
  data: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone_number?: string;
    mc_number?: string;
    usdot_number?: string;
  }
) {
  const supabase = await getSupabaseServerClient();

  const updates: Record<string, unknown> = {};
  if (data.first_name) updates.first_name = data.first_name;
  if (data.last_name) updates.last_name = data.last_name;
  if (data.email !== undefined) updates.email = data.email;
  if (data.phone_number !== undefined) updates.phone_number = data.phone_number;
  if (data.mc_number !== undefined) updates.mc_number = data.mc_number;
  if (data.usdot_number !== undefined) updates.usdot_number = data.usdot_number;

  const { error } = await supabase
    .from("brokers")
    .update(updates)
    .eq("broker_id", brokerId);

  if (error) {
    console.error("[updateBroker]", error.message, error.hint);
    throw error;
  }
}
