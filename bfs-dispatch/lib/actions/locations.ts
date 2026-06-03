"use server";

import { getSupabaseServerClient } from "./core";

export type Location = {
  location_id: number;
  formatted_address: string;
  street: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  lat: number | null;
  lng: number | null;
  mapbox_place_id: string | null;
  source: string;
  status_id: number;
  created_at: string;
};

export type MapboxPlaceData = {
  place_name: string;
  center: [number, number]; // [lng, lat]
  id: string; // mapbox_place_id
  context?: Array<{
    id: string;
    text: string;
  }>;
  address?: string;
};

/**
 * Search locations by formatted address (ILIKE)
 */
export async function searchLocations(query: string, limit: number = 20): Promise<Location[]> {
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .ilike("formatted_address", `%${query}%`)
    .eq("status_id", 1)
    .order("formatted_address")
    .limit(limit);

  if (error) throw error;
  return data || [];
}

/**
 * Get a single location by ID
 */
export async function getLocationById(locationId: number): Promise<Location | null> {
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .eq("location_id", locationId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // not found
    throw error;
  }
  return data;
}

/**
 * Upsert a location from Mapbox place data
 * Uses mapbox_place_id as unique key for deduplication
 */
export async function getOrCreateLocation(placeData: MapboxPlaceData): Promise<number> {
  const supabase = await getSupabaseServerClient();

  // Try to find existing location by mapbox_place_id
  const { data: existing } = await supabase
    .from("locations")
    .select("location_id")
    .eq("mapbox_place_id", placeData.id)
    .single();

  if (existing) {
    return existing.location_id;
  }

  // Extract components from Mapbox context
  let city = null;
  let state = null;
  let zip = null;

  if (placeData.context) {
    for (const ctx of placeData.context) {
      if (ctx.id.startsWith("place.")) city = ctx.text;
      if (ctx.id.startsWith("region.")) state = ctx.text;
      if (ctx.id.startsWith("postcode.")) zip = ctx.text;
    }
  }

  const [lng, lat] = placeData.center;

  const { data: newLocation, error } = await supabase
    .from("locations")
    .insert({
      formatted_address: placeData.place_name,
      street: placeData.address || null,
      city,
      state,
      zip,
      lat,
      lng,
      mapbox_place_id: placeData.id,
      source: "mapbox",
      status_id: 1,
    })
    .select("location_id")
    .single();

  if (error) throw error;
  if (!newLocation) throw new Error("Failed to create location");

  return newLocation.location_id;
}
