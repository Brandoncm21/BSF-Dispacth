"use server";

import { getSupabaseServerClient } from "./core";

export type RouteWithDetails = {
  route_id: number;
  miles: number | null;
  origin_address_id: number;
  destination_address_id: number;
  origin: {
    city_id: number;
    city_name: string;
    state_id: number;
    state_name: string;
  };
  destination: {
    city_id: number;
    city_name: string;
    state_id: number;
    state_name: string;
  };
};

export type AddressWithDetails = {
  address_id: number;
  address_description: string | null;
  street_id: number | null;
  state_id: number;
  city_id: number;
  city_name: string;
  state_name: string;
  street_name: string | null;
};

export async function getRoutesWithDetails() {
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from("routes")
    .select(`
      route_id,
      miles,
      origin_address_id,
      destination_address_id,
      origin:addresses!routes_origin_address_id_fkey(
        address_id,
        address_description,
        state_id,
        streets(
          street_id,
          street_name,
          city_id,
          cities(
            city_id,
            city_name,
            state_id,
            states(
              state_id,
              state_name
            )
          )
        )
      ),
      destination:addresses!routes_destination_address_id_fkey(
        address_id,
        address_description,
        state_id,
        streets(
          street_id,
          street_name,
          city_id,
          cities(
            city_id,
            city_name,
            state_id,
            states(
              state_id,
              state_name
            )
          )
        )
      )
    `)
    .eq("status_id", 1);

  if (error) throw error;

  const routes: RouteWithDetails[] = (data || []).map((r) => {
    const originData = r.origin as { streets?: { cities?: { city_id: number; city_name: string; states?: { state_id: number; state_name: string } } } };
    const destData = r.destination as { streets?: { cities?: { city_id: number; city_name: string; states?: { state_id: number; state_name: string } } } };
    return {
      route_id: r.route_id as number,
      miles: r.miles as number | null,
      origin_address_id: r.origin_address_id as number,
      destination_address_id: r.destination_address_id as number,
      origin: {
        city_id: originData?.streets?.cities?.city_id ?? 0,
        city_name: originData?.streets?.cities?.city_name ?? "",
        state_id: originData?.streets?.cities?.states?.state_id ?? 0,
        state_name: originData?.streets?.cities?.states?.state_name ?? "",
      },
      destination: {
        city_id: destData?.streets?.cities?.city_id ?? 0,
        city_name: destData?.streets?.cities?.city_name ?? "",
        state_id: destData?.streets?.cities?.states?.state_id ?? 0,
        state_name: destData?.streets?.cities?.states?.state_name ?? "",
      },
    };
  });

  return routes;
}

export async function getOrCreateAddress(street: string, cityId: number, stateId: number) {
  const supabase = await getSupabaseServerClient();

  let { data: existingStreet } = await supabase
    .from("streets")
    .select("street_id")
    .eq("street_name", street)
    .eq("city_id", cityId)
    .eq("state_id", stateId)
    .single();

  if (!existingStreet) {
    const { data: newStreet, error: streetError } = await supabase
      .from("streets")
      .insert({ street_name: street, city_id: cityId, state_id: stateId })
      .select("street_id")
      .single();

    if (streetError) throw streetError;
    existingStreet = newStreet;
  }

  let { data: existingAddress } = await supabase
    .from("addresses")
    .select("address_id")
    .eq("street_id", existingStreet.street_id)
    .eq("state_id", stateId)
    .single();

  if (!existingAddress) {
    const { data: newAddress, error: addressError } = await supabase
      .from("addresses")
      .insert({ street_id: existingStreet.street_id, state_id: stateId, address_description: street })
      .select("address_id")
      .single();

    if (addressError) throw addressError;
    existingAddress = newAddress;
  }

  return existingAddress.address_id;
}

export async function getOrCreateRoute(originAddressId: number, destinationAddressId: number, miles?: number) {
  const supabase = await getSupabaseServerClient();

  let { data: existingRoute } = await supabase
    .from("routes")
    .select("route_id, miles")
    .eq("origin_address_id", originAddressId)
    .eq("destination_address_id", destinationAddressId)
    .single();

  if (!existingRoute) {
    const { data: newRoute, error: routeError } = await supabase
      .from("routes")
      .insert({
        origin_address_id: originAddressId,
        destination_address_id: destinationAddressId,
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

export async function createRoute(
  originStreet: string,
  originCityId: number,
  originStateId: number,
  destStreet: string,
  destCityId: number,
  destStateId: number,
  miles: number
) {
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase.rpc("create_route_full", {
    p_origin_street: originStreet,
    p_origin_city_id: originCityId,
    p_origin_state_id: originStateId,
    p_dest_street: destStreet,
    p_dest_city_id: destCityId,
    p_dest_state_id: destStateId,
    p_miles: miles,
  });

  if (error) throw error;
  return data;
}

export async function getOrCreateCity(cityName: string, stateId: number) {
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase.rpc("get_or_create_city", {
    p_city_name: cityName,
    p_state_id: stateId,
  });

  if (error) throw error;
  return data;
}

export async function searchStreets(query: string, cityId?: number, stateId?: number) {
  const supabase = await getSupabaseServerClient();

  let request = supabase
    .from("streets")
    .select("street_id, street_name, city_id, state_id")
    .ilike("street_name", `%${query}%`)
    .limit(20);

  if (cityId) {
    request = request.eq("city_id", cityId);
  }

  if (stateId) {
    request = request.eq("state_id", stateId);
  }

  const { data, error } = await request;
  if (error) throw error;
  return data;
}

export async function getOrCreateStreet(streetName: string, cityId: number, stateId: number) {
  const supabase = await getSupabaseServerClient();

  let { data: existing } = await supabase
    .from("streets")
    .select("street_id")
    .eq("street_name", streetName)
    .eq("city_id", cityId)
    .eq("state_id", stateId)
    .single();

  if (!existing) {
    const { data: newStreet, error: streetError } = await supabase
      .from("streets")
      .insert({ street_name: streetName, city_id: cityId, state_id: stateId })
      .select("street_id")
      .single();

    if (streetError) throw streetError;
    existing = newStreet;
  }

  return existing.street_id;
}
