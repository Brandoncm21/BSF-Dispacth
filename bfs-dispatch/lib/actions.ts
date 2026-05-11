"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { z } from "zod";

async function getSupabaseServerClient() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // ignore errors in server actions
          }
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("No authenticated user");
  }

  return supabase;
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

const loadSchema = z.object({
  carrier_id: z.coerce.number().min(1, "Carrier es requerido"),
  truck_id: z.coerce.number().min(1, "Truck es requerido"),
  driver_id: z.coerce.number().min(1, "Driver es requerido"),
  cargo_type_id: z.coerce.number().optional(),
  special_requirements_id: z.coerce.number().optional(),
  origin_address_id: z.coerce.number().min(1, "Dirección de origen es requerida"),
  destination_address_id: z.coerce.number().min(1, "Dirección de destino es requerida"),
  rate: z.coerce.number().min(0, "Rate es requerido"),
  dispatch_fee: z.coerce.number().min(0).default(0),
  load_weight: z.coerce.number().optional(),
  load_data: z.string().optional(),
  factoring: z.boolean().default(false),
});

export async function createLoad(formData: z.infer<typeof loadSchema>) {
  const supabase = await getSupabaseServerClient();

  const result = loadSchema.safeParse(formData);
  if (!result.success) {
    const errors: Record<string, string> = {};
    result.error.issues.forEach((issue) => {
      const key = String(issue.path[0]);
      errors[key] = issue.message;
    });
    return { error: "Validation failed", errors };
  }

  const data = result.data;

  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    return { error: "No authenticated session" };
  }

  const { data: userData } = await supabase
    .from("employees")
    .select("employee_id")
    .eq("auth_user_id", sessionData.session.user.id)
    .maybeSingle();

  const dispatcherId = userData?.employee_id ?? null;

  const year = new Date().getFullYear();

  const { data: lastLoad } = await supabase
    .from("loads")
    .select("load_number")
    .filter("load_number", "like", `LD-${year}-%`)
    .order("load_id", { ascending: false })
    .limit(1)
    .single();

  let sequenceNumber = 1;
  if (lastLoad?.load_number) {
    const parts = lastLoad.load_number.split("-");
    const lastSeq = parseInt(parts[2] || "0", 10);
    sequenceNumber = lastSeq + 1;
  }

  const seqStr = sequenceNumber.toString().padStart(4, "0");
  const loadNumber = `LD-${year}-${seqStr}`;

  const dispatchFee = data.rate * 0.2;

  const insertData: Record<string, unknown> = {
    load_number: loadNumber,
    carrier_id: data.carrier_id,
    truck_id: data.truck_id,
    driver_id: data.driver_id,
    cargo_type_id: data.cargo_type_id,
    special_requirements_id: data.special_requirements_id,
    origin_address_id: data.origin_address_id,
    destination_address_id: data.destination_address_id,
    rate: data.rate,
    dispatch_fee: dispatchFee,
    load_weight: data.load_weight,
    load_data: data.load_data,
    factoring: data.factoring,
    load_status: "pending",
    paid_status: "unpaid",
    status_id: 1,
  };

  if (dispatcherId) {
    insertData.dispatcher_id = dispatcherId;
  }

  const { data: newLoad, error: loadError } = await supabase
    .from("loads")
    .insert(insertData)
    .select()
    .single();

  if (loadError) {
    return { error: loadError.message };
  }

  return { success: true, load: newLoad };
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

export type SalesByMonth = {
  month: string;
  total_profit: number;
  total_revenue: number;
  load_count: number;
};

export type SalesByBroker = {
  broker_name: string;
  total_profit: number;
  total_revenue: number;
  load_count: number;
};

export type SalesByState = {
  state_name: string;
  total_profit: number;
  total_revenue: number;
  load_count: number;
};

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

export async function getOrCreateCity(cityName: string, stateId: number) {
  const supabase = await getSupabaseServerClient();

  const { data: existing } = await supabase
    .from("cities")
    .select("city_id")
    .eq("city_name", cityName)
    .eq("state_id", stateId)
    .single();

  if (existing) {
    return existing.city_id;
  }

  const { data, error } = await supabase
    .from("cities")
    .insert({ city_name: cityName, state_id: stateId })
    .select("city_id")
    .single();

  if (error) throw error;
  return data.city_id;
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

  const originStreetId = await getOrCreateStreet(originStreet, originCityId, originStateId);

  const { data: originAddress, error: originAddrError } = await supabase
    .from("addresses")
    .select("address_id")
    .eq("street_id", originStreetId)
    .eq("state_id", originStateId)
    .single();

  let originAddressId: number;

  if (!originAddress) {
    const { data: newOrigin, error: newOriginError } = await supabase
      .from("addresses")
      .insert({
        street_id: originStreetId,
        state_id: originStateId,
        address_description: originStreet,
      })
      .select("address_id")
      .single();

    if (newOriginError) throw newOriginError;
    originAddressId = newOrigin.address_id;
  } else {
    originAddressId = originAddress.address_id;
  }

  const destStreetId = await getOrCreateStreet(destStreet, destCityId, destStateId);

  const { data: destAddress, error: destAddrError } = await supabase
    .from("addresses")
    .select("address_id")
    .eq("street_id", destStreetId)
    .eq("state_id", destStateId)
    .single();

  let destAddressId: number;

  if (!destAddress) {
    const { data: newDest, error: newDestError } = await supabase
      .from("addresses")
      .insert({
        street_id: destStreetId,
        state_id: destStateId,
        address_description: destStreet,
      })
      .select("address_id")
      .single();

    if (newDestError) throw newDestError;
    destAddressId = newDest.address_id;
  } else {
    destAddressId = destAddress.address_id;
  }

  const { data: existingRoute } = await supabase
    .from("routes")
    .select("route_id")
    .eq("origin_address_id", originAddressId)
    .eq("destination_address_id", destAddressId)
    .single();

  if (existingRoute) {
    return existingRoute.route_id;
  }

  const { data: newRoute, error: routeError } = await supabase
    .from("routes")
    .insert({
      origin_address_id: originAddressId,
      destination_address_id: destAddressId,
      miles: miles,
      status_id: 1,
    })
    .select("route_id")
    .single();

  if (routeError) throw routeError;
  return newRoute.route_id;
}

export type LoadDocument = {
  document_id: number;
  load_id: number;
  document_type: "RC" | "BOL" | "POD";
  file_path: string;
  file_name: string;
  file_size: number | null;
  uploaded_at: string | null;
  uploaded_by: number | null;
};

export async function uploadLoadDocument(
  loadId: number,
  documentType: "RC" | "BOL" | "POD",
  file: File,
  uploadedBy: number | null
) {
  const supabase = await getSupabaseServerClient();

  const timestamp = Date.now();
  const fileName = `${documentType}_${timestamp}.pdf`;
  const filePath = `loads/${loadId}/${fileName}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const { error: uploadError } = await supabase.storage
    .from("load_documents")
    .upload(filePath, buffer, {
      contentType: "application/pdf",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Error uploading file: ${uploadError.message}`);
  }

  const { data: docData, error: docError } = await supabase
    .from("load_documents")
    .insert({
      load_id: loadId,
      document_type: documentType,
      file_path: filePath,
      file_name: file.name,
      file_size: file.size,
      uploaded_by: uploadedBy,
    })
    .select("document_id")
    .single();

  if (docError) {
    await supabase.storage.from("load_documents").remove([filePath]);
    throw new Error(`Error saving document record: ${docError.message}`);
  }

  return docData.document_id;
}

export async function getLoadDocuments(loadId: number) {
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from("load_documents")
    .select("*")
    .eq("load_id", loadId)
    .order("uploaded_at", { ascending: false });

  if (error) throw error;
  return data as LoadDocument[];
}

export async function getDocumentSignedUrl(filePath: string) {
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase.storage
    .from("load_documents")
    .createSignedUrl(filePath, 3600);

  if (error) throw error;
  return data.signedUrl;
}

export async function deleteLoadDocument(documentId: number, filePath: string) {
  const supabase = await getSupabaseServerClient();

  const { error: storageError } = await supabase.storage
    .from("load_documents")
    .remove([filePath]);

  if (storageError) {
    console.error("Error deleting file from storage:", storageError);
  }

  const { error: dbError } = await supabase
    .from("load_documents")
    .delete()
    .eq("document_id", documentId);

  if (dbError) throw dbError;
}

export async function getSalesAnalytics() {
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from("v_sales_performance")
    .select("sale_date, total_profit, total_amount, broker_name, origin_state_name, destination_state_name, load_number");

  if (error) throw error;

  const salesByMonth: Record<string, SalesByMonth> = {};
  const salesByBroker: Record<string, SalesByBroker> = {};
  const salesByOriginState: Record<string, SalesByState> = {};
  const salesByDestState: Record<string, SalesByState> = {};

  data.forEach((sale) => {
    const month = sale.sale_date ? sale.sale_date.slice(0, 7) : "Sin Fecha";

    if (!salesByMonth[month]) {
      salesByMonth[month] = { month, total_profit: 0, total_revenue: 0, load_count: 0 };
    }
    salesByMonth[month].total_profit += Number(sale.total_profit) || 0;
    salesByMonth[month].total_revenue += Number(sale.total_amount) || 0;
    salesByMonth[month].load_count += 1;

    const broker = sale.broker_name || "Sin Broker";
    if (!salesByBroker[broker]) {
      salesByBroker[broker] = { broker_name: broker, total_profit: 0, total_revenue: 0, load_count: 0 };
    }
    salesByBroker[broker].total_profit += Number(sale.total_profit) || 0;
    salesByBroker[broker].total_revenue += Number(sale.total_amount) || 0;
    salesByBroker[broker].load_count += 1;

    const originState = sale.origin_state_name || "N/A";
    if (!salesByOriginState[originState]) {
      salesByOriginState[originState] = { state_name: originState, total_profit: 0, total_revenue: 0, load_count: 0 };
    }
    salesByOriginState[originState].total_profit += Number(sale.total_profit) || 0;
    salesByOriginState[originState].total_revenue += Number(sale.total_amount) || 0;
    salesByOriginState[originState].load_count += 1;

    const destState = sale.destination_state_name || "N/A";
    if (!salesByDestState[destState]) {
      salesByDestState[destState] = { state_name: destState, total_profit: 0, total_revenue: 0, load_count: 0 };
    }
    salesByDestState[destState].total_profit += Number(sale.total_profit) || 0;
    salesByDestState[destState].total_revenue += Number(sale.total_amount) || 0;
    salesByDestState[destState].load_count += 1;
  });

  return {
    salesByMonth: Object.values(salesByMonth).sort((a, b) => a.month.localeCompare(b.month)),
    salesByBroker: Object.values(salesByBroker).sort((a, b) => b.total_profit - a.total_profit),
    salesByOriginState: Object.values(salesByOriginState).sort((a, b) => b.total_profit - a.total_profit),
    salesByDestState: Object.values(salesByDestState).sort((a, b) => b.total_profit - a.total_profit),
  };
}

export type AvailabilityStatus = 'disponible' | 'en_ruta' | 'maintenance';

export interface TruckWithAvailability {
  truck_id: number;
  unit_number: string;
  vehicle_type: string;
  capacity: string;
  operational_status: string;
  carrier_id: number;
  carrier_name: string;
  record_status: string;
  availability_status: AvailabilityStatus;
  current_route: string | null;
  current_load_status: string | null;
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

export interface FleetAlert {
  truck_id: number;
  unit_number: string;
  carrier_name: string;
  alert_type: 'maintenance' | 'delay' | 'available';
  message: string;
  current_route?: string;
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
      const statusAge = now.getTime() - now.getTime();
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