export {
  createLoad,
  updateLoad,
  deleteLoad,
  updateLoadStatus,
} from "./actions/loads";

export {
  getStates,
  getCities,
  searchAddresses,
  getActiveCarriers,
  getActiveDrivers,
  getActiveTrucks,
  getActiveBrokers,
  getActiveCargoTypes,
  getActiveSpecialRequirements,
  getCarriersSimple,
  createCargoType,
  createSpecialRequirement,
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
  getTrucksWithAvailability,
  getTruckLoadHistory,
  getFleetOverview,
  getFleetAlerts,
  getTrucksWithSmartStatus,
  updateTruckStatus,
  createTruck,
  updateTruck,
  getBrokers,
  createBroker,
  updateBroker,
} from "./actions/fleet";

export type {
  AvailabilityStatus,
  TruckWithAvailability,
  TruckLoadHistory,
  FleetAlert,
  TruckStatus,
  TruckWithSmartStatus,
  Broker,
} from "./actions/fleet";
