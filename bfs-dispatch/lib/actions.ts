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