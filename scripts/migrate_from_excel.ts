import XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

const envPath = resolve(process.cwd(), ".env.local");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const [key, ...rest] = line.split("=");
  if (key && rest.length) {
    process.env[key.trim()] = rest.join("=").trim();
  }
}

const EXCEL_EPOCH = new Date("1899-12-30").getTime();
const MS_PER_DAY = 86400000;

function excelSerialToDate(serial: number): Date {
  return new Date(Math.round((serial - 25569) * MS_PER_DAY));
}

function parseRate(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    return parseFloat(value.replace(/[$,\s]/g, "")) || 0;
  }
  return 0;
}

function parseOwnerName(owner: string): { first_name: string; last_name: string } {
  const t = (owner || "").trim();
  if (!t) return { first_name: "", last_name: "" };
  const parts = t.split(/\s+/);
  if (parts.length === 1) return { first_name: parts[0], last_name: "" };
  return { first_name: parts[0], last_name: parts.slice(1).join(" ") };
}

function extractUnitNumber(name: string): string {
  const m = String(name || "").match(/#?\s*(\d+)/);
  return m ? m[1] : String(name || "").replace(/[^a-zA-Z0-9-]/g, "").slice(0, 20);
}

function inferVehicleType(name: string): string | null {
  const n = (name || "").toLowerCase();
  if (n.includes("hotshot")) return "Hotshot";
  if (n.includes("reefer")) return "Reefer";
  if (n.includes("flatbed")) return "Flatbed";
  if (n.includes("dry van") || n.includes("dryvan")) return "Dry Van";
  if (n.includes("step deck") || n.includes("stepdeck")) return "Step Deck";
  if (n.includes("lowboy")) return "Lowboy";
  return null;
}

function normalize(str: string): string {
  return (str || "").trim().toLowerCase();
}

async function geocodeLocation(
  city: string,
  state: string,
  supabase: SupabaseClient,
  cache: Map<string, number>
): Promise<number | null> {
  const key = `${normalize(city)}|${normalize(state)}`;
  if (cache.has(key)) return cache.get(key)!;

  const token = process.env.MAPBOX_TOKEN;
  if (!token) throw new Error("MAPBOX_TOKEN not set");

  await new Promise((r) => setTimeout(r, 250));

  const query = encodeURIComponent(`${city}, ${state}`);
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${token}&country=us&limit=1`;

  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`  Geocoding failed for ${city}, ${state}: ${res.status}`);
    return null;
  }

  const data = (await res.json()) as { features?: Array<{ place_name: string; center: [number, number]; id: string }> };
  const feature = data.features?.[0];
  if (!feature) {
    console.warn(`  No results for ${city}, ${state}`);
    return null;
  }

  const [lng, lat] = feature.center;
  const placeId = feature.id;
  const placeName = feature.place_name;

  const parts = placeName.split(", ");
  const cityPart = parts[0] || city;
  const statePart = parts[parts.length - 2] || state;
  const zipPart = parts[parts.length - 1]?.match(/\d{5}/)?.[0] || "";

  const { data: loc } = await supabase
    .from("locations")
    .upsert(
      {
        formatted_address: placeName,
        city: cityPart,
        state: statePart,
        zip: zipPart,
        lat,
        lng,
        mapbox_place_id: placeId,
        source: "mapbox",
        status_id: 1,
      },
      { onConflict: "mapbox_place_id" }
    )
    .select("location_id")
    .single();

  if (loc) cache.set(key, (loc as { location_id: number }).location_id);
  return (loc as { location_id: number } | null)?.location_id ?? null;
}

async function main() {
  console.log("=== BFS Dispatch: Excel Data Migration ===\n");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!supabaseUrl || !serviceKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const FILE_PATH = "C:\\Users\\malum\\Downloads\\Loadboard.xlsx";
  console.log("Reading Excel file...");
  const wb = XLSX.readFile(FILE_PATH);

  const infoSheet = wb.Sheets["Info"];
  const infoData = XLSX.utils.sheet_to_json<string[]>(infoSheet, { header: 1 });
  const loadsSheet = wb.Sheets["Loads"];
  const loadsData = XLSX.utils.sheet_to_json<unknown[]>(loadsSheet, { header: 1 });
  const headers = (loadsData[0] as string[]) || [];

  const colIndex: Record<string, number> = {};
  for (let i = 0; i < headers.length; i++) {
    const h = String(headers[i] || "").trim();
    if (h) colIndex[h] = i;
  }

  console.log(`Info sheet: ${infoData.length} rows, ${infoData[0]?.length} cols`);
  console.log(`Loads sheet: ${loadsData.length} rows, ${loadsData[0]?.length} cols`);

  console.log("\n[PHASE 1] Truncating test data...\n");

  const truncateOrder = [
    "load_status_history",
    "load_documents",
    "notifications",
    "driver_checkpoints",
    "sales_details",
    "sales",
    "billing",
    "loads",
    "broker_contacts",
    "brokers",
    "trucks",
    "drivers",
    "carriers",
  ];

  for (const table of truncateOrder) {
    const { error } = await supabase.from(table).delete().neq("pk", "never_match_ignore");
    if (error) {
      console.warn(`  Warning: could not delete from ${table}: ${error.message}`);
    } else {
      console.log(`  Cleared: ${table}`);
    }
  }

  console.log("\n[PHASE 2] Parsing Info sheet (transposed) -> carriers, drivers, trucks...\n");

  const numCols = infoData[0]?.length ?? 0;
  const carrierMap = new Map<string, number>();
  const driverMap = new Map<string, number>();
  const truckMap = new Map<string, number>();

  const companyNames: string[] = [];
  for (let c = 1; c < numCols; c++) {
    const h = String(infoData[0]?.[c] || "").trim();
    if (h) companyNames.push(h);
  }

  for (let c = 1; c < numCols; c++) {
    const ownerRaw = String(infoData[2]?.[c] || "").trim();
    if (!ownerRaw) continue;

    const companyName = companyNames[c - 1] || ownerRaw;
    const ownerParsed = parseOwnerName(ownerRaw);
    const { first_name: ownerFirst, last_name: ownerLast } = ownerParsed;

    const address = String(infoData[1]?.[c] || "").trim();
    const phone = String(infoData[3]?.[c] || "").trim();
    const email = String(infoData[4]?.[c] || "").trim();
    const mcNumber = String(infoData[24]?.[c] || "").trim();
    const dotNumber = String(infoData[25]?.[c] || "").trim();
    const einRaw = String(infoData[26]?.[c] || "").trim();
    const ein = einRaw === "" || einRaw === "-" ? null : einRaw;
    const ssnRaw = String(infoData[28]?.[c] || "").trim();
    const ssn = ssnRaw === "" || ssnRaw === "-" ? null : ssnRaw;
    const factoryRaw = String(infoData[29]?.[c] || "").trim();
    const factoring = !!factoryRaw;

    const { data: carrier, error: cErr } = await supabase
      .from("carriers")
      .insert({
        company_name: companyName,
        owner_name: ownerRaw,
        first_name: ownerFirst || null,
        last_name: ownerLast || null,
        address: address || null,
        phone_number: phone || null,
        email: email || null,
        mc_number: mcNumber || null,
        dot_number: dotNumber || null,
        employer_identification_number: ein,
        social_security_number: ssn,
        factoring,
        status_id: 1,
        dispatch_fee_percent: 0.05,
      } as Record<string, unknown>)
      .select("carrier_id")
      .single();

    if (cErr || !carrier) {
      console.warn(`  Skipped carrier col ${c} (${ownerRaw}): ${cErr?.message}`);
      continue;
    }

    const carrierId = carrier.carrier_id as number;
    carrierMap.set(String(c), carrierId);
    console.log(`  Carrier [${c}]: ${companyName} (id=${carrierId})`);

    const driverNameRows = [8, 10, 12, 14, 16, 18, 20, 22];
    const driverPhoneRows = [9, 11, 13, 15, 17, 19, 21, 23];
    const carrierDriverIds: number[] = [];

    for (let d = 0; d < driverNameRows.length; d++) {
      const nameRaw = String(infoData[driverNameRows[d]]?.[c] || "").trim();
      if (!nameRaw || nameRaw === "-" || nameRaw === "") continue;

      const phoneD = String(infoData[driverPhoneRows[d]]?.[c] || "").trim();
      const nameParsed = parseOwnerName(nameRaw);

      const { data: driver, error: dErr } = await supabase
        .from("drivers")
        .insert({
          first_name: nameParsed.first_name,
          last_name: nameParsed.last_name,
          phone_number: phoneD || null,
          carrier_id: carrierId,
          status_id: 1,
          cdl_number: null,
          license_type: null,
          has_twic_card: false,
        } as Record<string, unknown>)
        .select("driver_id")
        .single();

      if (dErr || !driver) {
        console.warn(`    Driver ${d + 1} skipped: ${dErr?.message}`);
        continue;
      }

      const driverId = driver.driver_id as number;
      carrierDriverIds.push(driverId);
      driverMap.set(`${c}-${d}`, driverId);
    }

    const truckRows = [41, 43, 45, 47];
    const firstDriverId = carrierDriverIds[0] ?? null;

    for (let t = 0; t < truckRows.length; t++) {
      const truckNameRaw = String(infoData[truckRows[t]]?.[c] || "").trim();
      if (!truckNameRaw || truckNameRaw === "-" || truckNameRaw === "") continue;

      const unitNum = extractUnitNumber(truckNameRaw);
      const vehicleType = inferVehicleType(truckNameRaw);

      const { data: truck, error: tErr } = await supabase
        .from("trucks")
        .insert({
          truck_name: truckNameRaw,
          unit_number: unitNum || null,
          vehicle_type: vehicleType,
          carrier_id: carrierId,
          driver_id: firstDriverId,
          status_id: 1,
          operational_status: "disponible",
        } as Record<string, unknown>)
        .select("truck_id")
        .single();

      if (tErr || !truck) {
        console.warn(`    Truck ${t + 1} skipped: ${tErr?.message}`);
        continue;
      }

      truckMap.set(`${c}-${t}`, truck.truck_id as number);
    }
  }

  const totalCarriers = carrierMap.size;
  const totalDrivers = driverMap.size;
  const totalTrucks = truckMap.size;
  console.log(`\n  Phase 2 summary: ${totalCarriers} carriers, ${totalDrivers} drivers, ${totalTrucks} trucks`);

  console.log("\n[PHASE 3] Parsing Loads sheet -> brokers, contacts...\n");

  const brokerMcSet = new Map<string, number>();
  const ci = colIndex;
  const brokerCol = ci["Broker load #"];
  const carrierCol = ci["Carrier"];
  const driverCol = ci["Driver"];
  const pickupCol = ci["Pick up Date"];
  const dropCol = ci["Drop Date"];
  const mcBrokerCol = ci["MC Broker"];
  const brokerNameCol = ci["Broker"];
  const contactCol = ci["Contact"];
  const phoneCol = ci["Phone"];
  const mailCol = ci["Mail"];
  const originCityCol = ci["Origin City"];
  const originStateCol = ci["Origin State"];
  const destCityCol = ci["Destination City"];
  const destStateCol = ci["Destination State"];
  const rateCol = ci["Rate"];
  const vendorCol = ci["Vendor"];

  const brokerUnique = new Map<string, { name: string; mc: string; contact: string; phone: string; mail: string }>();
  for (let r = 1; r < loadsData.length; r++) {
    const row = loadsData[r] as unknown[];
    if (!row) continue;
    const bNum = String(row[brokerCol] ?? "").trim();
    if (!bNum) continue;

    const mcBroker = String(row[mcBrokerCol] ?? "").trim();
    const brokerName = String(row[brokerNameCol] ?? "").trim();
    const contact = String(row[contactCol] ?? "").trim();
    const phoneB = String(row[phoneCol] ?? "").trim();
    const mailB = String(row[mailCol] ?? "").trim();

    if (mcBroker && !brokerUnique.has(mcBroker)) {
      brokerUnique.set(mcBroker, {
        name: brokerName,
        mc: mcBroker,
        contact,
        phone: phoneB,
        mail: mailB,
      });
    }
  }

  const employeeMap = new Map<string, number>();
  const { data: employees } = await supabase.from("employees").select("employee_id, first_name, last_name");
  if (employees) {
    for (const emp of employees) {
      const key = normalize(`${emp.first_name} ${emp.last_name}`);
      employeeMap.set(key, emp.employee_id);
    }
  }

  const getDispatcherId = (vendorName: string): number | null => {
    const v = normalize(vendorName);
    if (v && employeeMap.has(v)) return employeeMap.get(v)!;
    const fallback = normalize("Anthony Navarro");
    return employeeMap.get(fallback) ?? null;
  };

  for (const [, b] of brokerUnique) {
    const parsed = parseOwnerName(b.name);
    const { data: broker, error: bErr } = await supabase
      .from("brokers")
      .upsert(
        {
          first_name: parsed.first_name || null,
          last_name: parsed.last_name || null,
          mc_number: b.mc || null,
          status_id: 1,
        } as Record<string, unknown>,
        { onConflict: "mc_number" }
      )
      .select("broker_id")
      .single();

    if (bErr || !broker) {
      console.warn(`  Broker skipped: ${bErr?.message}`);
      continue;
    }

    const brokerId = broker.broker_id as number;
    brokerMcSet.set(b.mc, brokerId);

    if (b.contact) {
      await supabase.from("broker_contacts").insert({
        broker_id: brokerId,
        contact_name: b.contact || null,
        email: b.mail || null,
        phone: b.phone || null,
        is_primary: true,
        status_id: 1,
      } as Record<string, unknown>);
    }
  }

  console.log(`  Phase 3 summary: ${brokerMcSet.size} brokers, ${brokerUnique.size} broker contacts`);

  console.log("\n[PHASE 4] Inserting loads with geocoding...\n");

  const geocodeCache = new Map<string, number>();
  let loadedCount = 0;
  let skippedCarrier = 0;
  let skippedDriver = 0;
  let geocodeFailed = 0;

  const carrierNameToCol = new Map<string, string>();
  for (let c = 1; c < numCols; c++) {
    const ownerRaw = String(infoData[2]?.[c] || "").trim();
    if (ownerRaw) {
      carrierNameToCol.set(normalize(ownerRaw), String(c));
    }
  }

  const carrierNameSet = new Set<string>();
  for (let r = 1; r < loadsData.length; r++) {
    const row = loadsData[r] as unknown[];
    if (!row) continue;
    const bNum = String(row[brokerCol] ?? "").trim();
    if (!bNum) continue;
    const cName = String(row[carrierCol] ?? "").trim();
    if (cName) carrierNameSet.add(normalize(cName));
  }

  const carrierNameToId = new Map<string, number>();
  const { data: allCarriers } = await supabase
    .from("carriers")
    .select("carrier_id, owner_name, company_name");

  if (allCarriers) {
    for (const c of allCarriers) {
      const compKey = normalize(c.company_name || "");
      if (compKey) carrierNameToId.set(compKey, c.carrier_id);
      const ownerKey = normalize(c.owner_name || "");
      if (ownerKey) carrierNameToId.set(ownerKey, c.carrier_id);
      const noLlC = compKey.replace(/[\s,]*llc\.?$/i, "").trim();
      if (noLlC !== compKey) carrierNameToId.set(noLlC, c.carrier_id);
      const noLLC = compKey.replace(/[\s,]*llc$/i, "").trim();
      if (noLLC !== compKey) carrierNameToId.set(noLLC, c.carrier_id);
    }
  }

  const driverNameToId = new Map<string, number>();
  const { data: allDrivers } = await supabase
    .from("drivers")
    .select("driver_id, first_name, last_name, carrier_id");

  if (allDrivers) {
    for (const d of allDrivers) {
      const nameKey = normalize(`${d.first_name} ${d.last_name}`);
      if (nameKey) driverNameToId.set(nameKey, d.driver_id);
    }
  }

  const { data: allTrucks } = await supabase
    .from("trucks")
    .select("truck_id, carrier_id");

  const truckByCarrier = new Map<number, number>();
  if (allTrucks) {
    for (const t of allTrucks) {
      if (!truckByCarrier.has(t.carrier_id)) {
        truckByCarrier.set(t.carrier_id, t.truck_id);
      }
    }
  }

  const statusId = 1;

  for (let r = 1; r < loadsData.length; r++) {
    const row = loadsData[r] as unknown[];
    if (!row) continue;

    const bNum = String(row[brokerCol] ?? "").trim();
    if (!bNum) continue;

    const carrierNameRaw = String(row[carrierCol] ?? "").trim();
    const carrierId = carrierNameRaw ? carrierNameToId.get(normalize(carrierNameRaw)) : null;
    if (!carrierId) {
      skippedCarrier++;
      console.warn(`  [Row ${r + 1}] No carrier found for: ${carrierNameRaw}`);
      continue;
    }

    const driverNameRaw = String(row[driverCol] ?? "").trim();
    const driverId = driverNameRaw ? driverNameToId.get(normalize(driverNameRaw)) : null;
    if (!driverId) {
      skippedDriver++;
    }

    const truckId = truckByCarrier.get(carrierId) ?? null;

    const pickupSerial = Number(row[pickupCol] ?? 0);
    const dropSerial = Number(row[dropCol] ?? 0);
    const pickupDate = pickupSerial > 0 ? excelSerialToDate(pickupSerial) : null;
    const dropDate = dropSerial > 0 ? excelSerialToDate(dropSerial) : null;

    const originCity = String(row[originCityCol] ?? "").trim();
    const originState = String(row[originStateCol] ?? "").trim();
    const destCity = String(row[destCityCol] ?? "").trim();
    const destState = String(row[destStateCol] ?? "").trim();

    let originLocationId: number | null = null;
    let destLocationId: number | null = null;

    if (originCity && originState) {
      try {
        originLocationId = await geocodeLocation(originCity, originState, supabase, geocodeCache);
      } catch {
        geocodeFailed++;
      }
    }

    if (destCity && destState) {
      try {
        destLocationId = await geocodeLocation(destCity, destState, supabase, geocodeCache);
      } catch {
        geocodeFailed++;
      }
    }

    let routeId: number | null = null;
    if (originLocationId || destLocationId) {
      const milesRaw = String(row[ci["Miles"] ?? -1] ?? "").trim();
      const miles = milesRaw === "N/A" || !milesRaw ? null : parseFloat(milesRaw);
      const { data: route } = await supabase
        .from("routes")
        .insert({
          origin_location_id: originLocationId,
          destination_location_id: destLocationId,
          miles,
          status_id: statusId,
        } as Record<string, unknown>)
        .select("route_id")
        .single();
      routeId = route?.route_id ?? null;
    }

    const rate = parseRate(row[rateCol]);
    const vendorName = String(row[vendorCol] ?? "").trim();
    const dispatcherId = getDispatcherId(vendorName);

    const { data: load, error: lErr } = await supabase
      .from("loads")
      .insert({
        load_data: bNum,
        carrier_id: carrierId,
        driver_id: driverId,
        truck_id: truckId,
        route_id: routeId,
        dispatcher_id: dispatcherId,
        rate,
        dispatch_fee_pct: 0.05,
        booked_at: pickupDate ?? null,
        picked_up_at: pickupDate ?? null,
        delivered_at: dropDate ?? null,
        load_status: "delivered",
        paid_status: "paid",
        status_id: statusId,
        load_weight: null,
        cargo_type_id: null,
        special_requirements_id: null,
        factoring: null,
      } as Record<string, unknown>)
      .select("load_id")
      .single();

    if (lErr || !load) {
      console.warn(`  [Row ${r + 1}] Load insert failed: ${lErr?.message}`);
      continue;
    }

    loadedCount++;
    if (loadedCount % 100 === 0) {
      console.log(`  Inserted ${loadedCount} loads...`);
    }
  }

  console.log("\n=== Migration Complete ===");
  console.log(`Carriers:  ${totalCarriers}`);
  console.log(`Drivers:   ${totalDrivers}`);
  console.log(`Trucks:    ${totalTrucks}`);
  console.log(`Brokers:   ${brokerMcSet.size}`);
  console.log(`Loads:     ${loadedCount}`);
  console.log(`Skipped (no carrier): ${skippedCarrier}`);
  console.log(`Skipped (no driver):  ${skippedDriver}`);
  console.log(`Geocode failures:     ${geocodeFailed}`);
  console.log(`Unique locations cached: ${geocodeCache.size}`);
}

main().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});