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
  searchActiveBrokers,
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
  getOrCreateRoute,
  createRoute,
  updateRoute,
  calculateRouteMiles,
} from "./actions/routes";

export type {
  RouteWithDetails,
} from "./actions/routes";

export {
  searchLocations,
  getLocationById,
  getOrCreateLocation,
} from "./actions/locations";

export type {
  Location,
  MapboxPlaceData,
} from "./actions/locations";

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
  StateProfitData,
  TruckProfitRanking,
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

export {
  reportCheckpoint,
  getCheckpointHistory,
  getLoadTrack,
} from "./actions/tracking";

export {
  createNotification,
  getNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
} from "./actions/notifications";

