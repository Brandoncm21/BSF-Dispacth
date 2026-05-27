export {
  createLoad,
  updateLoad,
  deleteLoad,
  updateLoadStatus,
  searchLoads,
} from "./actions/loads";

export {
  getStates,
  getCities,
  searchAddresses,
  getCarrierById,
  searchCarriers,
  searchDrivers,
  getDriverById,
  createCarrier,
  updateCarrier,
  softDeleteCarrier,
  createDriver,
  updateDriver,
  softDeleteDriver,
  getActiveCarriers,
  getActiveDrivers,
  getActiveTrucks,
  getActiveBrokers,
  getRoles,
  getActiveCargoTypes,
  getActiveSpecialRequirements,
  getCarriersSimple,
  createCargoType,
  createSpecialRequirement,
  getDriversByCarrier,
  getCarrierDispatchFee,
} from "./actions/catalog";

export {
  getRoutesWithDetails,
  getOrCreateAddress,
  getOrCreateRoute,
  getOrCreateCity,
  searchStreets,
  getOrCreateStreet,
  createRoute,
} from "./actions/routes";

export type {
  RouteWithDetails,
  AddressWithDetails,
} from "./actions/routes";

export {
  uploadLoadDocument,
  getLoadDocuments,
  getDocumentSignedUrl,
  deleteLoadDocument,
} from "./actions/documents";

export type {
  LoadDocument,
} from "./actions/documents";

export {
  getSalesAnalytics,
} from "./actions/sales";

export type {
  SalesByMonth,
  SalesByBroker,
  SalesByState,
} from "./actions/sales";

export {
  getReportsData,
} from "./actions/reports";

export type {
  ReportRow,
  GroupedReport,
} from "./actions/reports";

export {
  getDashboardAnalytics,
} from "./actions/analytics";

export type {
  RevenueTrend,
  DispatcherRanking,
  LoadStatusDistribution,
  CarrierPerformance,
  DashboardKPIs,
} from "./actions/analytics";

export {
  getTruckById,
  getTrucksWithAvailability,
  getTruckLoadHistory,
  getTruckStatusHistory,
  getFleetOverview,
  getFleetAlerts,
  getTrucksWithSmartStatus,
  getTrucksByCarrier,
  searchTrucks,
  updateTruckStatus,
  createTruck,
  updateTruck,
  getBrokerById,
  getBrokers,
  createBroker,
  updateBroker,
  searchBrokers,
  getMaintenanceRecords,
  createMaintenanceRecord,
  updateMaintenanceRecord,
  deleteMaintenanceRecord,
  getBrokerContacts,
  createBrokerContact,
  updateBrokerContact,
  deleteBrokerContact,
  setPrimaryContact,
} from "./actions/fleet";

export type {
  AvailabilityStatus,
  TruckWithAvailability,
  TruckLoadHistory,
  StatusHistoryEvent,
  FleetAlert,
  TruckStatus,
  TruckWithSmartStatus,
  Broker,
} from "./actions/fleet";
