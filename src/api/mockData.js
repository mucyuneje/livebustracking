/**
 * mockData.js
 * ─────────────────────────────────────────────────────────────
 * Central data store — Kigali Bus Real-Time System.
 *
 * Routes model real Kigali corridors.
 * Every stop is a named, fixed bus stop along the route.
 * Buses only travel along their assigned route.
 * ─────────────────────────────────────────────────────────────
 */

// ─── Route definitions ────────────────────────────────────────
// Each route: real Kigali corridor with ordered stop IDs.
export const ROUTES = [
  {
    id: 1,
    name: "Downtown – ULK – Kagugu – Bastinda",
    shortCode: "R1",
    color: "#2563EB",   // Blue
    stops: [101, 102, 103, 104, 105, 106],
  },
  {
    id: 2,
    name: "Nyabugogo – Remera – Airport",
    shortCode: "R2",
    color: "#16A34A",   // Green
    stops: [201, 202, 203, 204, 205],
  },
  {
    id: 3,
    name: "CBD – Kimironko – Gasabo",
    shortCode: "R3",
    color: "#DC2626",   // Red
    stops: [301, 302, 303, 304, 305],
  },
  {
    id: 4,
    name: "Kacyiru – Nyarutarama – Golf",
    shortCode: "R4",
    color: "#7C3AED",   // Purple
    stops: [401, 402, 403, 404, 405],
  },
];

// ─── Fixed bus stops per route ────────────────────────────────
// Stops are ordered: first → last stop along the route.
// These are FIXED positions — real bus stops, not POIs.
export const STOPS_BY_ROUTE = {
  // Route 1: Downtown Terminal → ULK → Kagugu → Bastinda
  1: [
    { id: 101, routeId: 1, name: "Downtown Terminal",   lat: -1.9502, lng: 30.0588 },
    { id: 102, routeId: 1, name: "KCB Bank Stop",       lat: -1.9480, lng: 30.0630 },
    { id: 103, routeId: 1, name: "ULK College",         lat: -1.9455, lng: 30.0685 },
    { id: 104, routeId: 1, name: "Kagugu Junction",     lat: -1.9420, lng: 30.0760 },
    { id: 105, routeId: 1, name: "Kagugu Market Stop",  lat: -1.9390, lng: 30.0820 },
    { id: 106, routeId: 1, name: "Bastinda Terminal",   lat: -1.9355, lng: 30.0895 },
  ],
  // Route 2: Nyabugogo → Remera → Airport
  2: [
    { id: 201, routeId: 2, name: "Nyabugogo Terminal",  lat: -1.9384, lng: 30.0563 },
    { id: 202, routeId: 2, name: "KG 7 Ave Stop",       lat: -1.9420, lng: 30.0640 },
    { id: 203, routeId: 2, name: "Remera Junction",     lat: -1.9533, lng: 30.0910 },
    { id: 204, routeId: 2, name: "Airport Road Stop",   lat: -1.9576, lng: 30.1022 },
    { id: 205, routeId: 2, name: "Kigali Airport",      lat: -1.9636, lng: 30.1395 },
  ],
  // Route 3: CBD → Kimironko → Gasabo
  3: [
    { id: 301, routeId: 3, name: "CBD Bus Park",        lat: -1.9500, lng: 30.0580 },
    { id: 302, routeId: 3, name: "Kigali Heights",      lat: -1.9466, lng: 30.0721 },
    { id: 303, routeId: 3, name: "Kimironko Market",    lat: -1.9271, lng: 30.1005 },
    { id: 304, routeId: 3, name: "Zindiro Stop",        lat: -1.9208, lng: 30.1131 },
    { id: 305, routeId: 3, name: "Gasabo Terminal",     lat: -1.9153, lng: 30.1250 },
  ],
  // Route 4: Kacyiru → Nyarutarama → Golf Course
  4: [
    { id: 401, routeId: 4, name: "Kacyiru Bus Stop",    lat: -1.9510, lng: 30.0720 },
    { id: 402, routeId: 4, name: "Nyarutarama Rd",      lat: -1.9389, lng: 30.0832 },
    { id: 403, routeId: 4, name: "Nyarutarama Lake",    lat: -1.9318, lng: 30.0934 },
    { id: 404, routeId: 4, name: "Golf Course Stop",    lat: -1.9270, lng: 30.1020 },
    { id: 405, routeId: 4, name: "Nyarutarama End",     lat: -1.9230, lng: 30.1090 },
  ],
};

// ─── All stops as a flat array (convenience) ─────────────────
export const ALL_STOPS = Object.values(STOPS_BY_ROUTE).flat();

// ─── Live bus state (updated by simulateBusMovement) ─────────
let _busState = {
  1: [
    { id: "R1-001", routeId: 1, lat: -1.9500, lng: 30.0595, speed: 38, stopIndex: 0 },
    { id: "R1-002", routeId: 1, lat: -1.9460, lng: 30.0665, speed: 42, stopIndex: 1 },
    { id: "R1-003", routeId: 1, lat: -1.9400, lng: 30.0785, speed: 35, stopIndex: 3 },
  ],
  2: [
    { id: "R2-001", routeId: 2, lat: -1.9400, lng: 30.0580, speed: 40, stopIndex: 0 },
    { id: "R2-002", routeId: 2, lat: -1.9533, lng: 30.0910, speed: 36, stopIndex: 2 },
    { id: "R2-003", routeId: 2, lat: -1.9600, lng: 30.1150, speed: 44, stopIndex: 3 },
  ],
  3: [
    { id: "R3-001", routeId: 3, lat: -1.9495, lng: 30.0600, speed: 39, stopIndex: 0 },
    { id: "R3-002", routeId: 3, lat: -1.9370, lng: 30.0850, speed: 43, stopIndex: 1 },
    { id: "R3-003", routeId: 3, lat: -1.9240, lng: 30.1070, speed: 31, stopIndex: 3 },
  ],
  4: [
    { id: "R4-001", routeId: 4, lat: -1.9500, lng: 30.0730, speed: 37, stopIndex: 0 },
    { id: "R4-002", routeId: 4, lat: -1.9340, lng: 30.0940, speed: 41, stopIndex: 2 },
    { id: "R4-003", routeId: 4, lat: -1.9255, lng: 30.1040, speed: 33, stopIndex: 3 },
  ],
};

// ─── Haversine (km) ──────────────────────────────────────────
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calcEta(bus, stop) {
  const distKm = haversineKm(bus.lat, bus.lng, stop.lat, stop.lng);
  const speedKmPerMin = Math.max(bus.speed, 5) / 60;
  return Math.max(1, Math.round(distKm / speedKmPerMin));
}

// ─── Simulate bus movement along route polyline ───────────────
export function simulateBusMovement() {
  Object.keys(_busState).forEach((routeId) => {
    const stops = STOPS_BY_ROUTE[routeId];
    _busState[routeId] = _busState[routeId].map((bus) => {
      const targetStop = stops[Math.min(bus.stopIndex + 1, stops.length - 1)];
      const dLat = (targetStop.lat - bus.lat) * 0.06 + (Math.random() - 0.5) * 0.0002;
      const dLng = (targetStop.lng - bus.lng) * 0.06 + (Math.random() - 0.5) * 0.0002;
      const newSpeed = Math.max(18, Math.min(58, bus.speed + (Math.random() - 0.5) * 5));
      // Advance to next stop index if close enough
      const distToTarget = haversineKm(bus.lat + dLat, bus.lng + dLng, targetStop.lat, targetStop.lng);
      const nextIndex = distToTarget < 0.15 && bus.stopIndex < stops.length - 2
        ? bus.stopIndex + 1
        : bus.stopIndex;
      return {
        ...bus,
        prevLat: bus.lat,
        prevLng: bus.lng,
        lat: bus.lat + dLat,
        lng: bus.lng + dLng,
        speed: Math.round(newSpeed),
        stopIndex: nextIndex,
      };
    });
  });
}

// ═══════════════════════════════════════════════════════════════
// API functions (swap for real fetch() calls)
// ═══════════════════════════════════════════════════════════════

export async function getRoutes() {
  await _delay(200);
  return ROUTES;
}

export async function getStops(routeId) {
  await _delay(150);
  return STOPS_BY_ROUTE[routeId] ?? [];
}

export async function getBuses(routeId, stopId) {
  await _delay(150);
  const buses  = _busState[routeId] ?? [];
  const stops  = STOPS_BY_ROUTE[routeId] ?? [];
  const target = stops.find((s) => s.id === stopId) ?? stops[0];
  return buses.map((bus) => ({
    ...bus,
    etaToNextStop: calcEta(bus, target),
    targetStop: target?.name ?? "—",
  }));
}

export async function getAllBusesForRoute(routeId) {
  await _delay(100);
  const buses = _busState[routeId] ?? [];
  const stops = STOPS_BY_ROUTE[routeId] ?? [];
  return buses.map((bus) => ({
    ...bus,
    etaToNextStop: calcEta(bus, stops[0]),
  }));
}

function _delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}
