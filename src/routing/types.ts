export interface Coordinate {
  latitude: number;
  longitude: number;
  label?: string;
}
export interface TripPlace extends Coordinate {
  stopId?: string;
  platform?: string;
}
export interface TripLeg {
  mode: string;
  departureTime: string;
  arrivalTime: string;
  scheduledDepartureTime: string;
  scheduledArrivalTime: string;
  durationSeconds: number;
  realTime: boolean;
  from: TripPlace;
  to: TripPlace;
  distanceMeters?: number;
  route?: string;
  headsign?: string;
  agency?: string;
  stayOnVehicle: boolean;
  wheelchairAccessible?: boolean;
}
export interface TripItinerary {
  kind: "transit" | "walk" | "bicycle";
  departureTime: string;
  arrivalTime: string;
  durationSeconds: number;
  transfers: number;
  walkingSeconds: number;
  waitingSeconds: number;
  realTime: boolean;
  legs: TripLeg[];
}
export interface TripPlan {
  origin: Coordinate;
  destination: Coordinate;
  requestedTime: string;
  timeType: "departAfter" | "arriveBy";
  generatedAt: string;
  timeZone: "America/Los_Angeles";
  itineraries: TripItinerary[];
  warnings: string[];
}
export interface PlaceCandidate extends Coordinate {
  id: string;
  label: string;
  type: "ADDRESS" | "PLACE" | "STOP";
}
export interface PlaceSearchResult {
  query: string;
  candidates: PlaceCandidate[];
  requiresSelection: boolean;
  warnings: string[];
}

export interface StopDeparture {
  stopId: string;
  route: string;
  routeId?: string;
  routeColor?: string;
  agency?: string;
  headsign?: string;
  departureTime: string;
  scheduledDepartureTime: string;
  realTime: boolean;
  cancelled: boolean;
  pickupAllowed: boolean;
  platform?: string;
  mode: string;
}
export interface StopDepartures {
  kind: "departures";
  stop: TripPlace & { stopId: string };
  generatedAt: string;
  requestedTime: string;
  timeZone: "America/Los_Angeles";
  departures: StopDeparture[];
  warnings: string[];
}
