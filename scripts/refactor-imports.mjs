import fs from "fs";
import path from "path";

const mapping = {
  createLoad: "loads", updateLoad: "loads", deleteLoad: "loads", updateLoadStatus: "loads", searchLoads: "loads",
  getStates: "catalog", getCities: "catalog", searchAddresses: "catalog", getCarrierById: "catalog",
  searchCarriers: "catalog", searchDrivers: "catalog", getDriverById: "catalog", createCarrier: "catalog",
  updateCarrier: "catalog", softDeleteCarrier: "catalog", createDriver: "catalog", updateDriver: "catalog",
  softDeleteDriver: "catalog", getActiveCarriers: "catalog", getActiveDrivers: "catalog", getActiveTrucks: "catalog",
  getActiveBrokers: "catalog", searchActiveBrokers: "catalog", getRoles: "catalog", getActiveCargoTypes: "catalog",
  getActiveSpecialRequirements: "catalog", getCarriersSimple: "catalog", createCargoType: "catalog",
  createSpecialRequirement: "catalog", getDriversByCarrier: "catalog", getCarrierDispatchFee: "catalog",
  getRoutesWithDetails: "routes", getOrCreateRoute: "routes", createRoute: "routes", updateRoute: "routes",
  calculateRouteMiles: "routes", RouteWithDetails: "routes",
  searchLocations: "locations", getLocationById: "locations", getOrCreateLocation: "locations",
  Location: "locations", MapboxPlaceData: "locations",
  uploadLoadDocument: "documents", getLoadDocuments: "documents", getDocumentSignedUrl: "documents",
  deleteLoadDocument: "documents", LoadDocument: "documents",
  getSalesAnalytics: "sales", SalesByMonth: "sales", SalesByBroker: "sales", SalesByState: "sales",
  getReportsData: "reports", ReportRow: "reports", GroupedReport: "reports",
  getDashboardAnalytics: "analytics", RevenueTrend: "analytics", DispatcherRanking: "analytics",
  LoadStatusDistribution: "analytics", CarrierPerformance: "analytics", StateProfitData: "analytics",
  TruckProfitRanking: "analytics", DashboardKPIs: "analytics",
  getTruckById: "fleet", getTrucksWithAvailability: "fleet", getTruckLoadHistory: "fleet",
  getTruckStatusHistory: "fleet", getFleetOverview: "fleet", getFleetAlerts: "fleet",
  getTrucksWithSmartStatus: "fleet", getTrucksByCarrier: "fleet", searchTrucks: "fleet",
  updateTruckStatus: "fleet", createTruck: "fleet", updateTruck: "fleet", getBrokerById: "fleet",
  getBrokers: "fleet", createBroker: "fleet", updateBroker: "fleet", searchBrokers: "fleet",
  getMaintenanceRecords: "fleet", createMaintenanceRecord: "fleet", updateMaintenanceRecord: "fleet",
  deleteMaintenanceRecord: "fleet", getBrokerContacts: "fleet", createBrokerContact: "fleet",
  updateBrokerContact: "fleet", deleteBrokerContact: "fleet", setPrimaryContact: "fleet",
  AvailabilityStatus: "fleet", TruckWithAvailability: "fleet", TruckLoadHistory: "fleet",
  StatusHistoryEvent: "fleet", FleetAlert: "fleet", TruckStatus: "fleet", TruckWithSmartStatus: "fleet",
  Broker: "fleet",
  reportCheckpoint: "tracking", getCheckpointHistory: "tracking", getLoadTrack: "tracking",
  createNotification: "notifications", getNotifications: "notifications", getUnreadCount: "notifications",
  markRead: "notifications", markAllRead: "notifications",
};

function collectFiles() {
  const results = [];
  const dirs = ["components", "app", "hooks"];
  const sourceRoot = process.cwd();

  for (const dir of dirs) {
    const fullPath = path.join(sourceRoot, dir);
    if (!fs.existsSync(fullPath)) continue;
    const entries = fs.readdirSync(fullPath, { recursive: true });
    for (const entry of entries) {
      const fp = path.join(fullPath, entry);
      if (fs.statSync(fp).isFile() && (fp.endsWith(".ts") || fp.endsWith(".tsx"))) {
        const content = fs.readFileSync(fp, "utf8");
        if (content.includes('from "@/lib/actions"')) {
          results.push(fp);
        }
      }
    }
  }
  return results;
}

const files = collectFiles();
console.log(`Found ${files.length} files`);

let updated = 0;
for (const file of files) {
  let content = fs.readFileSync(file, "utf8");
  const original = content;

  const importRegex = /import\s+(type\s+)?\{([^}]*)\}\s*from\s+"@\/lib\/actions"/g;
  let match;
  let lastPos = 0;
  const parts = [];

  while ((match = importRegex.exec(content)) !== null) {
    const isType = match[1] || "";
    const symbolsRaw = match[2];

    const symbols = symbolsRaw.split(",").map((s) => s.trim()).filter((s) => s.length > 0);

    const groups = {};
    const unmapped = [];
    for (const sym of symbols) {
      const baseName = sym.split(/\s+as\s+/)[0].trim();
      const mod = mapping[baseName];
      if (mod) {
        if (!groups[mod]) groups[mod] = [];
        groups[mod].push(sym);
      } else {
        unmapped.push(sym);
      }
    }

    if (unmapped.length > 0) {
      console.log(`  WARN: ${path.relative(process.cwd(), file)} has unmapped: ${unmapped.join(", ")}`);
    }

    const newImports = [];
    for (const mod of Object.keys(groups).sort()) {
      const names = groups[mod].join(",\n  ");
      const typeStr = isType ? "type " : "";
      newImports.push(`import ${typeStr}{\n  ${names}\n} from "@/lib/actions/${mod}";`);
    }

    parts.push(content.slice(lastPos, match.index));
    parts.push(newImports.join("\n"));
    lastPos = match.index + match[0].length;
  }

  if (lastPos > 0) {
    parts.push(content.slice(lastPos));
    content = parts.join("");
    fs.writeFileSync(file, content, "utf8");
    updated++;
    console.log(`  ✓ ${path.relative(process.cwd(), file)}`);
  }
}

console.log(`\nDone! ${updated} files updated.`);
