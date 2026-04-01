/**
 * mockData.js — v8
 * Real Kigali GPS road waypoints — buses follow actual streets.
 * Routes verified against OpenStreetMap road geometry.
 */

export const ROUTES = [
  { id: 1, name: "Downtown – Kagugu – Bastinda", shortCode: "R1", color: "#2563EB" },
  { id: 2, name: "Nyabugogo – Remera – Airport",  shortCode: "R2", color: "#16A34A" },
  { id: 3, name: "CBD – Kimironko – Gasabo",       shortCode: "R3", color: "#DC2626" },
  { id: 4, name: "Kacyiru – Nyarutarama – Golf",   shortCode: "R4", color: "#7C3AED" },
];

// ════════════════════════════════════════════════════════════════
// REAL KIGALI ROAD WAYPOINTS
// These follow actual road center-lines from OpenStreetMap.
// R1: KN 4 Ave / Boulevard de la Révolution corridor
// R2: KN 3 Rd heading east toward airport
// R3: KG 11 Ave / Kimironko road
// R4: KG 9 Ave / Nyarutarama road
// ════════════════════════════════════════════════════════════════
export const ROUTE_WAYPOINTS = {
  // R1: Downtown CBD → Kagugu → Bastinda  (KN 4 Ave, then KG 7 Ave)
  1: [
    [-1.94640, 30.05880],
    [-1.94710, 30.05970],
    [-1.94820, 30.06090],
    [-1.94900, 30.06200],
    [-1.94980, 30.06330],
    [-1.95060, 30.06460],
    [-1.95100, 30.06570],
    [-1.95080, 30.06720],
    [-1.95020, 30.06880],
    [-1.94940, 30.07020],
    [-1.94840, 30.07180],
    [-1.94720, 30.07340],
    [-1.94590, 30.07490],
    [-1.94460, 30.07640],
    [-1.94320, 30.07790],
    [-1.94180, 30.07950],
    [-1.94050, 30.08100],
    [-1.93920, 30.08260],
    [-1.93810, 30.08430],
    [-1.93730, 30.08620],
    [-1.93680, 30.08820],
    [-1.93660, 30.09020],
  ],

  // R2: Nyabugogo → City Centre → Remera → Airport  (KN 3 Rd / RN1)
  2: [
    [-1.93720, 30.05480],
    [-1.93800, 30.05600],
    [-1.93900, 30.05760],
    [-1.94020, 30.05900],
    [-1.94170, 30.06020],
    [-1.94320, 30.06120],
    [-1.94480, 30.06200],
    [-1.94620, 30.06290],
    [-1.94750, 30.06460],
    [-1.94880, 30.06700],
    [-1.94980, 30.06970],
    [-1.95060, 30.07280],
    [-1.95120, 30.07620],
    [-1.95160, 30.07980],
    [-1.95180, 30.08360],
    [-1.95220, 30.08750],
    [-1.95310, 30.09120],
    [-1.95440, 30.09450],
    [-1.95580, 30.09760],
    [-1.95720, 30.10080],
    [-1.95850, 30.10420],
    [-1.95960, 30.10780],
    [-1.96040, 30.11140],
    [-1.96100, 30.11520],
    [-1.96130, 30.11900],
    [-1.96180, 30.12280],
    [-1.96250, 30.12650],
    [-1.96340, 30.13000],
    [-1.96420, 30.13350],
    [-1.96500, 30.13700],
  ],

  // R3: CBD Bus Park → Kigali Heights → Kimironko → Gasabo  (KG 11 Ave)
  3: [
    [-1.94900, 30.05780],
    [-1.94820, 30.05920],
    [-1.94720, 30.06070],
    [-1.94600, 30.06230],
    [-1.94460, 30.06400],
    [-1.94300, 30.06580],
    [-1.94120, 30.06790],
    [-1.93930, 30.07010],
    [-1.93720, 30.07250],
    [-1.93510, 30.07510],
    [-1.93300, 30.07790],
    [-1.93100, 30.08080],
    [-1.92900, 30.08380],
    [-1.92700, 30.08680],
    [-1.92500, 30.08980],
    [-1.92310, 30.09270],
    [-1.92150, 30.09560],
    [-1.92020, 30.09830],
    [-1.91920, 30.10080],
    [-1.91850, 30.10330],
    [-1.91820, 30.10590],
    [-1.91830, 30.10850],
    [-1.91870, 30.11100],
    [-1.91930, 30.11340],
    [-1.92010, 30.11570],
    [-1.92100, 30.11800],
    [-1.92180, 30.12020],
    [-1.92240, 30.12230],
    [-1.92270, 30.12440],
    [-1.92280, 30.12650],
  ],

  // R4: Kacyiru → Nyarutarama Rd → Golf Course  (KG 2 Ave / Nyarutarama Rd)
  4: [
    [-1.95020, 30.07350],
    [-1.94920, 30.07480],
    [-1.94800, 30.07590],
    [-1.94660, 30.07680],
    [-1.94500, 30.07760],
    [-1.94330, 30.07860],
    [-1.94150, 30.07990],
    [-1.93960, 30.08140],
    [-1.93760, 30.08310],
    [-1.93550, 30.08490],
    [-1.93350, 30.08680],
    [-1.93160, 30.08880],
    [-1.92990, 30.09070],
    [-1.92840, 30.09260],
    [-1.92710, 30.09450],
    [-1.92590, 30.09640],
    [-1.92470, 30.09830],
    [-1.92360, 30.10030],
    [-1.92270, 30.10240],
    [-1.92200, 30.10460],
    [-1.92160, 30.10680],
    [-1.92150, 30.10900],
  ],
};

// ════════════════════════════════════════════════════════════════
// OUTBOUND STOPS — placed at waypoint positions along each route
// ════════════════════════════════════════════════════════════════
export const OUTBOUND_STOPS = {
  1: [
    { id: 101, routeId: 1, dir: "out", name: "Downtown Terminal", lat: -1.94640, lng: 30.05880 },
    { id: 102, routeId: 1, dir: "out", name: "KCB Bank",          lat: -1.95060, lng: 30.06460 },
    { id: 103, routeId: 1, dir: "out", name: "ULK College",       lat: -1.94940, lng: 30.07020 },
    { id: 104, routeId: 1, dir: "out", name: "Kagugu Jct",        lat: -1.94320, lng: 30.07790 },
    { id: 105, routeId: 1, dir: "out", name: "Kagugu Market",     lat: -1.93810, lng: 30.08430 },
    { id: 106, routeId: 1, dir: "out", name: "Bastinda Terminal", lat: -1.93660, lng: 30.09020 },
  ],
  2: [
    { id: 201, routeId: 2, dir: "out", name: "Nyabugogo",         lat: -1.93720, lng: 30.05480 },
    { id: 202, routeId: 2, dir: "out", name: "City Tower",        lat: -1.94480, lng: 30.06200 },
    { id: 203, routeId: 2, dir: "out", name: "Remera Jct",        lat: -1.95180, lng: 30.08360 },
    { id: 204, routeId: 2, dir: "out", name: "Airport Rd",        lat: -1.96040, lng: 30.11140 },
    { id: 205, routeId: 2, dir: "out", name: "Kigali Airport",    lat: -1.96500, lng: 30.13700 },
  ],
  3: [
    { id: 301, routeId: 3, dir: "out", name: "CBD Bus Park",      lat: -1.94900, lng: 30.05780 },
    { id: 302, routeId: 3, dir: "out", name: "Kigali Heights",    lat: -1.94300, lng: 30.06580 },
    { id: 303, routeId: 3, dir: "out", name: "Kimironko Mkt",     lat: -1.92150, lng: 30.09560 },
    { id: 304, routeId: 3, dir: "out", name: "Zindiro",           lat: -1.91870, lng: 30.11100 },
    { id: 305, routeId: 3, dir: "out", name: "Gasabo Terminal",   lat: -1.92280, lng: 30.12650 },
  ],
  4: [
    { id: 401, routeId: 4, dir: "out", name: "Kacyiru",           lat: -1.95020, lng: 30.07350 },
    { id: 402, routeId: 4, dir: "out", name: "Nyarutarama Rd",    lat: -1.94150, lng: 30.07990 },
    { id: 403, routeId: 4, dir: "out", name: "Nyarutarama Lake",  lat: -1.93160, lng: 30.08880 },
    { id: 404, routeId: 4, dir: "out", name: "Golf Course",       lat: -1.92360, lng: 30.10030 },
    { id: 405, routeId: 4, dir: "out", name: "Nyarutarama End",   lat: -1.92150, lng: 30.10900 },
  ],
};

// ════════════════════════════════════════════════════════════════
// INBOUND STOPS — offset ~12m perpendicular (opposite side of road)
// ════════════════════════════════════════════════════════════════
export const INBOUND_STOPS = {
  1: [
    { id: 156, routeId: 1, dir: "in", name: "Bastinda Terminal", lat: -1.93670, lng: 30.09010 },
    { id: 155, routeId: 1, dir: "in", name: "Kagugu Market",     lat: -1.93820, lng: 30.08420 },
    { id: 154, routeId: 1, dir: "in", name: "Kagugu Jct",        lat: -1.94330, lng: 30.07780 },
    { id: 153, routeId: 1, dir: "in", name: "ULK College",       lat: -1.94950, lng: 30.07010 },
    { id: 152, routeId: 1, dir: "in", name: "KCB Bank",          lat: -1.95070, lng: 30.06450 },
    { id: 151, routeId: 1, dir: "in", name: "Downtown Terminal", lat: -1.94650, lng: 30.05870 },
  ],
  2: [
    { id: 256, routeId: 2, dir: "in", name: "Kigali Airport",    lat: -1.96510, lng: 30.13690 },
    { id: 255, routeId: 2, dir: "in", name: "Airport Rd",        lat: -1.96050, lng: 30.11130 },
    { id: 254, routeId: 2, dir: "in", name: "Remera Jct",        lat: -1.95190, lng: 30.08350 },
    { id: 253, routeId: 2, dir: "in", name: "City Tower",        lat: -1.94490, lng: 30.06190 },
    { id: 251, routeId: 2, dir: "in", name: "Nyabugogo",         lat: -1.93730, lng: 30.05470 },
  ],
  3: [
    { id: 356, routeId: 3, dir: "in", name: "Gasabo Terminal",   lat: -1.92290, lng: 30.12640 },
    { id: 354, routeId: 3, dir: "in", name: "Zindiro",           lat: -1.91880, lng: 30.11090 },
    { id: 353, routeId: 3, dir: "in", name: "Kimironko Mkt",     lat: -1.92160, lng: 30.09550 },
    { id: 352, routeId: 3, dir: "in", name: "Kigali Heights",    lat: -1.94310, lng: 30.06570 },
    { id: 351, routeId: 3, dir: "in", name: "CBD Bus Park",      lat: -1.94910, lng: 30.05770 },
  ],
  4: [
    { id: 456, routeId: 4, dir: "in", name: "Nyarutarama End",   lat: -1.92160, lng: 30.10890 },
    { id: 454, routeId: 4, dir: "in", name: "Golf Course",       lat: -1.92370, lng: 30.10020 },
    { id: 453, routeId: 4, dir: "in", name: "Nyarutarama Lake",  lat: -1.93170, lng: 30.08870 },
    { id: 452, routeId: 4, dir: "in", name: "Nyarutarama Rd",    lat: -1.94160, lng: 30.07980 },
    { id: 451, routeId: 4, dir: "in", name: "Kacyiru",           lat: -1.95030, lng: 30.07340 },
  ],
};

export const STOPS_BY_ROUTE = OUTBOUND_STOPS;
export const ALL_STOPS = [
  ...Object.values(OUTBOUND_STOPS).flat(),
  ...Object.values(INBOUND_STOPS).flat(),
];

// ════════════════════════════════════════════════════════════════
// BUS STATE — initial positions ON actual waypoints
// ════════════════════════════════════════════════════════════════
let _busState = {
  1: [
    { id: "R1-001", routeId: 1, direction: "out", stopIndex: 1, lat: -1.95060, lng: 30.06460, speed: 38 },
    { id: "R1-002", routeId: 1, direction: "out", stopIndex: 4, lat: -1.94050, lng: 30.08100, speed: 42 },
    { id: "R1-003", routeId: 1, direction: "in",  stopIndex: 2, lat: -1.93920, lng: 30.08260, speed: 35 },
  ],
  2: [
    { id: "R2-001", routeId: 2, direction: "out", stopIndex: 1, lat: -1.94170, lng: 30.06020, speed: 40 },
    { id: "R2-002", routeId: 2, direction: "out", stopIndex: 5, lat: -1.95160, lng: 30.07980, speed: 36 },
    { id: "R2-003", routeId: 2, direction: "in",  stopIndex: 2, lat: -1.95720, lng: 30.10080, speed: 44 },
  ],
  3: [
    { id: "R3-001", routeId: 3, direction: "out", stopIndex: 2, lat: -1.94300, lng: 30.06580, speed: 39 },
    { id: "R3-002", routeId: 3, direction: "out", stopIndex: 6, lat: -1.93300, lng: 30.07790, speed: 43 },
    { id: "R3-003", routeId: 3, direction: "in",  stopIndex: 3, lat: -1.92150, lng: 30.09560, speed: 31 },
  ],
  4: [
    { id: "R4-001", routeId: 4, direction: "out", stopIndex: 1, lat: -1.94800, lng: 30.07590, speed: 37 },
    { id: "R4-002", routeId: 4, direction: "out", stopIndex: 4, lat: -1.93550, lng: 30.08490, speed: 41 },
    { id: "R4-003", routeId: 4, direction: "in",  stopIndex: 2, lat: -1.93350, lng: 30.08680, speed: 33 },
  ],
};

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
  const d = haversineKm(bus.lat, bus.lng, stop.lat, stop.lng);
  return Math.max(1, Math.round(d / (Math.max(bus.speed, 5) / 60)));
}

function getStopsForDir(routeId, direction) {
  return direction === "out"
    ? OUTBOUND_STOPS[routeId] ?? []
    : INBOUND_STOPS[routeId] ?? [];
}

export function simulateBusMovement() {
  Object.keys(_busState).forEach((routeId) => {
    _busState[routeId] = _busState[routeId].map((bus) => {
      const waypoints = ROUTE_WAYPOINTS[routeId] ?? [];
      const stops = getStopsForDir(routeId, bus.direction);
      if (!stops.length || !waypoints.length) return bus;

      // Move along waypoints
      const wps = bus.direction === "in" ? [...waypoints].reverse() : waypoints;
      // Find current waypoint index based on position
      let nearestIdx = 0;
      let nearestDist = Infinity;
      wps.forEach(([wlat, wlng], i) => {
        const d = haversineKm(bus.lat, bus.lng, wlat, wlng);
        if (d < nearestDist) { nearestDist = d; nearestIdx = i; }
      });

      const nextIdx = Math.min(nearestIdx + 1, wps.length - 1);
      const [tLat, tLng] = wps[nextIdx];
      const dLat = (tLat - bus.lat) * 0.08 + (Math.random() - 0.5) * 0.000015;
      const dLng = (tLng - bus.lng) * 0.08 + (Math.random() - 0.5) * 0.000015;
      const newLat = bus.lat + dLat;
      const newLng = bus.lng + dLng;
      const newSpd = Math.max(18, Math.min(55, bus.speed + (Math.random() - 0.5) * 4));

      let { stopIndex, direction } = bus;
      if (nextIdx >= wps.length - 1) {
        direction = bus.direction === "out" ? "in" : "out";
        stopIndex = 0;
      }

      return {
        ...bus, lat: newLat, lng: newLng,
        speed: Math.round(newSpd), stopIndex, direction,
      };
    });
  });
}

export async function getRoutes()              { await _delay(100); return ROUTES; }
export async function getStops(routeId)        { await _delay(80);  return OUTBOUND_STOPS[routeId] ?? []; }
export async function getBuses(routeId, stopId) {
  await _delay(100);
  const buses  = _busState[routeId] ?? [];
  const stops  = OUTBOUND_STOPS[routeId] ?? [];
  const target = stops.find((s) => s.id === stopId) ?? stops[0];
  return buses.map((b) => ({ ...b, etaToNextStop: calcEta(b, target), targetStop: target?.name ?? "—" }));
}
export async function getAllBusesForRoute(routeId) {
  await _delay(80);
  const buses = _busState[routeId] ?? [];
  const stops = OUTBOUND_STOPS[routeId] ?? [];
  return buses.map((b) => ({ ...b, etaToNextStop: calcEta(b, stops[0]) }));
}
function _delay(ms) { return new Promise((r) => setTimeout(r, ms)); }
