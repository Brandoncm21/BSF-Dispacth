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
  dispatch_fee: number;
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
}

export async function getTrucksWithAvailability() {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("trucks_with_availability")
    .select("*")
    .eq("record_status", "Activo")
    .order("unit_number");

  if (error) throw error;
  return data as TruckWithAvailability[];
}

export async function getTruckLoadHistory(truckId: number, days: number = 30): Promise<TruckLoadHistory[]> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_truck_load_history", {
    p_truck_id: truckId,
    p_days: days,
  });

  if (error) throw error;
  return data as TruckLoadHistory[];
}

export async function getFleetOverview() {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("trucks_with_availability")
    .select("*")
    .eq("record_status", "Activo")
    .order("carrier_name, unit_number");

  if (error) throw error;

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

  if (error) throw error;

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

  if (error) throw error;
  return data as TruckWithSmartStatus[];
}

export async function updateTruckStatus(truckId: number, operationalStatus: string) {
  const supabase = await getSupabaseServerClient();

  const { error } = await supabase
    .from("trucks")
    .update({ operational_status: operationalStatus })
    .eq("truck_id", truckId);

  if (error) throw error;
}

export async function createTruck(data: {
  unit_number: string;
  carrier_id: number;
  truck_type: string;
  capacity?: string;
  operational_status?: string;
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
    })
    .select("truck_id")
    .single();

  if (error) throw error;
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
  }
) {
  const supabase = await getSupabaseServerClient();

  const updates: Record<string, unknown> = {};
  if (data.unit_number) updates.unit_number = data.unit_number;
  if (data.carrier_id) updates.carrier_id = data.carrier_id;
  if (data.truck_type) updates.vehicle_type = data.truck_type;
  if (data.capacity) updates.capacity = data.capacity;
  if (data.operational_status) updates.operational_status = data.operational_status;

  const { error } = await supabase
    .from("trucks")
    .update(updates)
    .eq("truck_id", truckId);

  if (error) throw error;
}

export interface Broker {
  broker_id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  phone_number: string | null;
  status_id: number;
}

export async function getBrokers() {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("brokers")
    .select("*")
    .eq("status_id", 1)
    .order("first_name");

  if (error) throw error;
  return data as Broker[];
}

export async function createBroker(data: {
  first_name: string;
  last_name: string;
  email?: string;
  phone_number?: string;
}) {
  const supabase = await getSupabaseServerClient();

  const { data: newBroker, error } = await supabase
    .from("brokers")
    .insert({
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email || null,
      phone_number: data.phone_number || null,
      status_id: 1,
    })
    .select("broker_id")
    .single();

  if (error) throw error;
  return newBroker.broker_id;
}

export async function updateBroker(
  brokerId: number,
  data: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone_number?: string;
  }
) {
  const supabase = await getSupabaseServerClient();

  const updates: Record<string, unknown> = {};
  if (data.first_name) updates.first_name = data.first_name;
  if (data.last_name) updates.last_name = data.last_name;
  if (data.email !== undefined) updates.email = data.email;
  if (data.phone_number !== undefined) updates.phone_number = data.phone_number;

  const { error } = await supabase
    .from("brokers")
    .update(updates)
    .eq("broker_id", brokerId);

  if (error) throw error;
}
