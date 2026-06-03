"use server";

import { getSupabaseServerClient } from "./core";

export type RouteWithDetails = {
  route_id: number;
  miles: number | null;
  is_frequent: boolean;
  origin_location_id: number;
  destination_location_id: number;
  origin: {
    location_id: number;
    formatted_address: string;
    city: string | null;
    state: string | null;
  };
  destination: {
    location_id: number;
    formatted_address: string;
    city: string | null;
    state: string | null;
  };
};

/**
 * Get all active routes with origin/destination location details
 * Replaces 5-level nested join (addresses→streets→cities→states)
 * with a simple join to locations
 */
export async function getRoutesWithDetails(onlyFrequent?: boolean) {
  const supabase = await getSupabaseServerClient();

  let query = supabase
    .from("routes")
    .select(`
      route_id,
      miles,
      is_frequent,
      origin_location_id,
      destination_location_id,
      origin:locations!routes_origin_location_id_fkey(
        location_id,
        formatted_address,
        city,
        state
      ),
      destination:locations!routes_destination_location_id_fkey(
        location_id,
        formatted_address,
        city,
        state
      )
    `)
    .eq("status_id", 1);

  if (onlyFrequent) {
    query = query.eq("is_frequent", true);
  }

  const { data, error } = await query;

  if (error) throw error;

  const routes: RouteWithDetails[] = (data || []).map((r) => {
    const originArr = r.origin as unknown as Array<{ location_id: number; formatted_address: string; city: string | null; state: string | null }>;
    const destArr = r.destination as unknown as Array<{ location_id: number; formatted_address: string; city: string | null; state: string | null }>;
    const originData = originArr?.[0];
    const destData = destArr?.[0];
    return {
      route_id: r.route_id as number,
      miles: r.miles as number | null,
      is_frequent: (r.is_frequent as boolean) ?? false,
      origin_location_id: r.origin_location_id as number,
      destination_location_id: r.destination_location_id as number,
      origin: {
        location_id: originData?.location_id ?? 0,
        formatted_address: originData?.formatted_address ?? "",
        city: originData?.city ?? null,
        state: originData?.state ?? null,
      },
      destination: {
        location_id: destData?.location_id ?? 0,
        formatted_address: destData?.formatted_address ?? "",
        city: destData?.city ?? null,
        state: destData?.state ?? null,
      },
    };
  });

  return routes;
}

/**
 * Check if a route already exists between two locations, or create it
 */
export async function getOrCreateRoute(
  originLocationId: number,
  destinationLocationId: number,
  miles?: number
) {
  const supabase = await getSupabaseServerClient();

  let { data: existingRoute } = await supabase
    .from("routes")
    .select("route_id, miles")
    .eq("origin_location_id", originLocationId)
    .eq("destination_location_id", destinationLocationId)
    .single();

  if (!existingRoute) {
    const { data: newRoute, error: routeError } = await supabase
      .from("routes")
      .insert({
        origin_location_id: originLocationId,
        destination_location_id: destinationLocationId,
        miles: miles || 0,
        status_id: 1,
      })
      .select("route_id, miles")
      .single();

    if (routeError) throw routeError;
    existingRoute = newRoute;
  } else if (miles && miles > 0 && (!existingRoute.miles || existingRoute.miles === 0)) {
    const { data: updatedRoute, error: updateError } = await supabase
      .from("routes")
      .update({ miles })
      .eq("route_id", existingRoute.route_id)
      .select("route_id, miles")
      .single();

    if (updateError) throw updateError;
    existingRoute = updatedRoute;
  }

  return existingRoute.route_id;
}

/**
 * Create a new route with location IDs and miles
 */
export async function createRoute(
  originLocationId: number,
  destinationLocationId: number,
  miles: number,
  isFrequent?: boolean
) {
  const supabase = await getSupabaseServerClient();

  const { data: newRoute, error } = await supabase
    .from("routes")
    .insert({
      origin_location_id: originLocationId,
      destination_location_id: destinationLocationId,
      miles,
      is_frequent: isFrequent ?? false,
      status_id: 1,
    })
    .select("route_id")
    .single();

  if (error) throw error;
  if (!newRoute) throw new Error("Failed to create route");

  return newRoute.route_id;
}

/**
 * Update an existing route (miles, is_frequent, etc.)
 */
export async function updateRoute(
  routeId: number,
  updates: { miles?: number; is_frequent?: boolean }
) {
  const supabase = await getSupabaseServerClient();

  const updateData: Record<string, unknown> = {};
  if (updates.miles !== undefined) updateData.miles = updates.miles;
  if (updates.is_frequent !== undefined) updateData.is_frequent = updates.is_frequent;

  const { error } = await supabase
    .from("routes")
    .update(updateData)
    .eq("route_id", routeId);

  if (error) throw error;
  return true;
}

/**
 * Calculate route miles using Mapbox Directions API with exact lat/lng.
 * Supports waypoints for multi-stop routes.
 * Returns the driving distance and full route geometry (polyline over roads).
 */
export async function calculateRouteMiles(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
  waypoints?: Array<{ lat: number; lng: number }>
) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) return { error: "Mapbox no configurado", miles: null, geometry: null };

  // Build coordinates string: origin;waypoint1;...;waypointN;destination
  const coords = [`${originLng},${originLat}`];
  if (waypoints && waypoints.length > 0) {
    const sorted = [...waypoints].filter((wp) => wp.lat != null && wp.lng != null);
    sorted.forEach((wp) => coords.push(`${wp.lng},${wp.lat}`));
  }
  coords.push(`${destLng},${destLat}`);

  const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${coords.join(";")}?access_token=${token}&geometries=geojson&overview=full`;
  const dirRes = await fetch(directionsUrl);
  if (!dirRes.ok) {
    return { error: "Error al calcular la ruta", miles: null, geometry: null };
  }

  const dirData = await dirRes.json();
  const route = dirData.routes?.[0];
  if (!route || !route.distance) {
    return { error: "No se encontró una ruta", miles: null, geometry: null };
  }

  const miles = Math.round(route.distance * 0.000621371 * 10) / 10;

  return {
    miles,
    geometry: route.geometry || null,
    error: null,
  };
}

// ============================================================
// DEPRECATED — kept for backward compatibility during transition
// These functions reference tables that will be dropped (addresses, streets, cities)
// Remove after confirming no consumers remain
// ============================================================

/** @deprecated Use getOrCreateLocation from locations.ts instead */
export async function getOrCreateAddress(street: string, cityId: number, stateId: number) {
  throw new Error("getOrCreateAddress is deprecated. Use getOrCreateLocation from locations.ts");
}

/** @deprecated No longer needed with locations-based routes */
export async function getOrCreateCity(cityName: string, stateId: number) {
  throw new Error("getOrCreateCity is deprecated. Use getOrCreateLocation from locations.ts");
}

/** @deprecated No longer needed with locations-based routes */
export async function searchStreets(_query: string, _cityId?: number, _stateId?: number) {
  throw new Error("searchStreets is deprecated. Use searchLocations from locations.ts");
}

/** @deprecated No longer needed with locations-based routes */
export async function getOrCreateStreet(_streetName: string, _cityId: number, _stateId: number) {
  throw new Error("getOrCreateStreet is deprecated. Use getOrCreateLocation from locations.ts");
}
