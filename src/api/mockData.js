/**
 * mockData.js — v10
 * MORE BUSES: 5-6 per route (mix of outbound + inbound)
 * GPS-LIKE: buses interpolate between waypoints every tick
 * REALISTIC: speed variance, odometer, passenger load, delays
 */

export const ROUTES = [
  { id: 1, name: "Downtown – Kagugu – Bastinda", shortCode: "R1", color: "#2563EB" },
  { id: 2, name: "Nyabugogo – Remera – Airport",  shortCode: "R2", color: "#16A34A" },
  { id: 3, name: "CBD – Kimironko – Gasabo",       shortCode: "R3", color: "#DC2626" },
  { id: 4, name: "Kacyiru – Nyarutarama – Golf",   shortCode: "R4", color: "#7C3AED" },
];

// Real Kigali road centerline waypoints
export const ROUTE_WAYPOINTS = {
  1: [
    [-1.94640, 30.05880], [-1.94710, 30.05970], [-1.94820, 30.06090],
    [-1.94900, 30.06200], [-1.94980, 30.06330], [-1.95060, 30.06460],
    [-1.95100, 30.06570], [-1.95080, 30.06720], [-1.95020, 30.06880],
    [-1.94940, 30.07020], [-1.94840, 30.07180], [-1.94720, 30.07340],
    [-1.94590, 30.07490], [-1.94460, 30.07640], [-1.94320, 30.07790],
    [-1.94180, 30.07950], [-1.94050, 30.08100], [-1.93920, 30.08260],
    [-1.93810, 30.08430], [-1.93730, 30.08620], [-1.93680, 30.08820],
    [-1.93660, 30.09020],
  ],
  2: [
    [-1.93720, 30.05480], [-1.93800, 30.05600], [-1.93900, 30.05760],
    [-1.94020, 30.05900], [-1.94170, 30.06020], [-1.94320, 30.06120],
    [-1.94480, 30.06200], [-1.94620, 30.06290], [-1.94750, 30.06460],
    [-1.94880, 30.06700], [-1.94980, 30.06970], [-1.95060, 30.07280],
    [-1.95120, 30.07620], [-1.95160, 30.07980], [-1.95180, 30.08360],
    [-1.95220, 30.08750], [-1.95310, 30.09120], [-1.95440, 30.09450],
    [-1.95580, 30.09760], [-1.95720, 30.10080], [-1.95850, 30.10420],
    [-1.95960, 30.10780], [-1.96040, 30.11140], [-1.96100, 30.11520],
    [-1.96130, 30.11900], [-1.96180, 30.12280], [-1.96250, 30.12650],
    [-1.96340, 30.13000], [-1.96420, 30.13350], [-1.96500, 30.13700],
  ],
  3: [
    [-1.94900, 30.05780], [-1.94820, 30.05920], [-1.94720, 30.06070],
    [-1.94600, 30.06230], [-1.94460, 30.06400], [-1.94300, 30.06580],
    [-1.94120, 30.06790], [-1.93930, 30.07010], [-1.93720, 30.07250],
    [-1.93510, 30.07510], [-1.93300, 30.07790], [-1.93100, 30.08080],
    [-1.92900, 30.08380], [-1.92700, 30.08680], [-1.92500, 30.08980],
    [-1.92310, 30.09270], [-1.92150, 30.09560], [-1.92020, 30.09830],
    [-1.91920, 30.10080], [-1.91850, 30.10330], [-1.91820, 30.10590],
    [-1.91830, 30.10850], [-1.91870, 30.11100], [-1.91930, 30.11340],
    [-1.92010, 30.11570], [-1.92100, 30.11800], [-1.92180, 30.12020],
    [-1.92240, 30.12230], [-1.92270, 30.12440], [-1.92280, 30.12650],
  ],
  4: [
    [-1.95020, 30.07350], [-1.94920, 30.07480], [-1.94800, 30.07590],
    [-1.94660, 30.07680], [-1.94500, 30.07760], [-1.94330, 30.07860],
    [-1.94150, 30.07990], [-1.93960, 30.08140], [-1.93760, 30.08310],
    [-1.93550, 30.08490], [-1.93350, 30.08680], [-1.93160, 30.08880],
    [-1.92990, 30.09070], [-1.92840, 30.09260], [-1.92710, 30.09450],
    [-1.92590, 30.09640], [-1.92470, 30.09830], [-1.92360, 30.10030],
    [-1.92270, 30.10240], [-1.92200, 30.10460], [-1.92160, 30.10680],
    [-1.92150, 30.10900],
  ],
};

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
    { id: 201, routeId: 2, dir: "out", name: "Nyabugogo",   lat: -1.93720, lng: 30.05480 },
    { id: 202, routeId: 2, dir: "out", name: "City Tower",  lat: -1.94480, lng: 30.06200 },
    { id: 203, routeId: 2, dir: "out", name: "Remera Jct",  lat: -1.95180, lng: 30.08360 },
    { id: 204, routeId: 2, dir: "out", name: "Airport Rd",  lat: -1.96040, lng: 30.11140 },
    { id: 205, routeId: 2, dir: "out", name: "KIA Airport", lat: -1.96500, lng: 30.13700 },
  ],
  3: [
    { id: 301, routeId: 3, dir: "out", name: "CBD Bus Park",    lat: -1.94900, lng: 30.05780 },
    { id: 302, routeId: 3, dir: "out", name: "Kigali Heights",  lat: -1.94300, lng: 30.06580 },
    { id: 303, routeId: 3, dir: "out", name: "Kimironko Mkt",   lat: -1.92150, lng: 30.09560 },
    { id: 304, routeId: 3, dir: "out", name: "Zindiro",         lat: -1.91870, lng: 30.11100 },
    { id: 305, routeId: 3, dir: "out", name: "Gasabo Terminal", lat: -1.92280, lng: 30.12650 },
  ],
  4: [
    { id: 401, routeId: 4, dir: "out", name: "Kacyiru",          lat: -1.95020, lng: 30.07350 },
    { id: 402, routeId: 4, dir: "out", name: "Nyarutarama Rd",   lat: -1.94150, lng: 30.07990 },
    { id: 403, routeId: 4, dir: "out", name: "Nyarutarama Lake", lat: -1.93160, lng: 30.08880 },
    { id: 404, routeId: 4, dir: "out", name: "Golf Course",      lat: -1.92360, lng: 30.10030 },
    { id: 405, routeId: 4, dir: "out", name: "Nyarutarama End",  lat: -1.92150, lng: 30.10900 },
  ],
};

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
    { id: 256, routeId: 2, dir: "in", name: "KIA Airport",  lat: -1.96510, lng: 30.13690 },
    { id: 255, routeId: 2, dir: "in", name: "Airport Rd",   lat: -1.96050, lng: 30.11130 },
    { id: 254, routeId: 2, dir: "in", name: "Remera Jct",   lat: -1.95190, lng: 30.08350 },
    { id: 253, routeId: 2, dir: "in", name: "City Tower",   lat: -1.94490, lng: 30.06190 },
    { id: 251, routeId: 2, dir: "in", name: "Nyabugogo",    lat: -1.93730, lng: 30.05470 },
  ],
  3: [
    { id: 356, routeId: 3, dir: "in", name: "Gasabo Terminal", lat: -1.92290, lng: 30.12640 },
    { id: 354, routeId: 3, dir: "in", name: "Zindiro",         lat: -1.91880, lng: 30.11090 },
    { id: 353, routeId: 3, dir: "in", name: "Kimironko Mkt",   lat: -1.92160, lng: 30.09550 },
    { id: 352, routeId: 3, dir: "in", name: "Kigali Heights",  lat: -1.94310, lng: 30.06570 },
    { id: 351, routeId: 3, dir: "in", name: "CBD Bus Park",    lat: -1.94910, lng: 30.05770 },
  ],
  4: [
    { id: 456, routeId: 4, dir: "in", name: "Nyarutarama End",  lat: -1.92160, lng: 30.10890 },
    { id: 454, routeId: 4, dir: "in", name: "Golf Course",      lat: -1.92370, lng: 30.10020 },
    { id: 453, routeId: 4, dir: "in", name: "Nyarutarama Lake", lat: -1.93170, lng: 30.08870 },
    { id: 452, routeId: 4, dir: "in", name: "Nyarutarama Rd",   lat: -1.94160, lng: 30.07980 },
    { id: 451, routeId: 4, dir: "in", name: "Kacyiru",          lat: -1.95030, lng: 30.07340 },
  ],
};

export const STOPS_BY_ROUTE = OUTBOUND_STOPS;
export const ALL_STOPS = [
  ...Object.values(OUTBOUND_STOPS).flat(),
  ...Object.values(INBOUND_STOPS).flat(),
];

// Lane offset — how far buses sit from centerline (~11m)
export const LANE_OFFSET_DEG = 0.00010;

// ─── Perpendicular offset helper ────────────────────────────
function perpOffset(A, B, d, dir) {
  const dLat = B[0] - A[0], dLng = B[1] - A[1];
  const len = Math.sqrt(dLat * dLat + dLng * dLng) || 1e-10;
  return [A[0] + (-dLng / len) * d * dir, A[1] + (dLat / len) * d * dir];
}

function applyLaneOffset(lat, lng, wpIdx, path, dirSign) {
  const i = Math.max(0, Math.min(wpIdx, path.length - 2));
  const A = path[i], B = path[Math.min(i + 1, path.length - 1)];
  const [oLat, oLng] = perpOffset(A, B, LANE_OFFSET_DEG * 0.55, dirSign);
  // The offset is relative to A, so reconstruct relative to actual position
  const dLat = B[0] - A[0], dLng = B[1] - A[1];
  const len = Math.sqrt(dLat * dLat + dLng * dLng) || 1e-10;
  const perpLat = (-dLng / len) * LANE_OFFSET_DEG * 0.55 * dirSign;
  const perpLng = (dLat / len)  * LANE_OFFSET_DEG * 0.55 * dirSign;
  return { lat: lat + perpLat, lng: lng + perpLng };
}

// ─── Haversine ───────────────────────────────────────────────
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat/2)**2 +
    Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function calcEta(busLat, busLng, busSpeed, stopLat, stopLng) {
  const d = haversineKm(busLat, busLng, stopLat, stopLng);
  return Math.max(1, Math.round(d / (Math.max(busSpeed, 5) / 60)));
}

// ═══════════════════════════════════════════════════════════════
// BUS STATE — 5-6 buses per route, spread across waypoints
// More buses = more realistic coverage of the whole route
// ═══════════════════════════════════════════════════════════════
function makeInitialBus(id, routeId, direction, wpIdx) {
  const wps = ROUTE_WAYPOINTS[routeId];
  const path = direction === "in" ? [...wps].reverse() : wps;
  const [lat, lng] = path[Math.min(wpIdx, path.length - 1)];
  return {
    id, routeId, direction,
    wpIdx,
    lat, lng,
    speed: Math.round(28 + Math.random() * 22), // 28-50 km/h
    odometer: Math.round(Math.random() * 40 * 10) / 10,
    capacityPct: Math.round(Math.random() * 75 + 10),
    // t tracks fractional progress between current and next waypoint (0–1)
    t: Math.random(),
  };
}

let _busState = {
  1: [
    makeInitialBus("R1-001", 1, "out",  1),
    makeInitialBus("R1-002", 1, "out",  7),
    makeInitialBus("R1-003", 1, "out", 14),
    makeInitialBus("R1-004", 1, "in",   2),
    makeInitialBus("R1-005", 1, "in",   9),
    makeInitialBus("R1-006", 1, "in",  17),
  ],
  2: [
    makeInitialBus("R2-001", 2, "out",  2),
    makeInitialBus("R2-002", 2, "out",  9),
    makeInitialBus("R2-003", 2, "out", 18),
    makeInitialBus("R2-004", 2, "in",   3),
    makeInitialBus("R2-005", 2, "in",  12),
    makeInitialBus("R2-006", 2, "in",  22),
  ],
  3: [
    makeInitialBus("R3-001", 3, "out",  2),
    makeInitialBus("R3-002", 3, "out", 10),
    makeInitialBus("R3-003", 3, "out", 20),
    makeInitialBus("R3-004", 3, "in",   4),
    makeInitialBus("R3-005", 3, "in",  14),
    makeInitialBus("R3-006", 3, "in",  24),
  ],
  4: [
    makeInitialBus("R4-001", 4, "out",  1),
    makeInitialBus("R4-002", 4, "out",  7),
    makeInitialBus("R4-003", 4, "out", 14),
    makeInitialBus("R4-004", 4, "in",   3),
    makeInitialBus("R4-005", 4, "in",  10),
    makeInitialBus("R4-006", 4, "in",  18),
  ],
};

// ═══════════════════════════════════════════════════════════════
// GPS-LIKE SIMULATION
// Each bus moves a fraction of the distance to the next waypoint
// per tick. The `t` parameter tracks interpolation progress (0-1).
// This produces smooth sub-waypoint movement — like a real GPS.
// ═══════════════════════════════════════════════════════════════
export function simulateBusMovement() {
  Object.keys(_busState).forEach((routeId) => {
    const wps = ROUTE_WAYPOINTS[routeId];
    if (!wps || wps.length < 2) return;

    _busState[routeId] = _busState[routeId].map((bus) => {
      const path = bus.direction === "in" ? [...wps].reverse() : wps;
      const maxIdx = path.length - 1;
      let { wpIdx, t, speed } = bus;

      // Speed fluctuation: simulate traffic lights, traffic
      const targetSpeed = Math.max(12, Math.min(60,
        speed + (Math.random() - 0.48) * 6
      ));

      // Distance moved per 2.5s tick at this speed (km)
      // speed km/h → km/2.5s = speed / 3600 * 2.5
      const distPerTick = targetSpeed / 3600 * 2.5;

      // Distance of current segment (km)
      const A = path[Math.min(wpIdx, maxIdx)];
      const B = path[Math.min(wpIdx + 1, maxIdx)];
      const segLen = haversineKm(A[0], A[1], B[0], B[1]);

      // Fractional advancement along segment
      const dtFraction = segLen > 0 ? distPerTick / segLen : 0.1;

      let newT   = t + dtFraction + (Math.random() * 0.01); // tiny jitter
      let newWpIdx = wpIdx;
      let newDir = bus.direction;

      // Advance through waypoints as needed
      while (newT >= 1.0 && newWpIdx < maxIdx - 1) {
        newT -= 1.0;
        newWpIdx++;
      }

      // Hit terminus — flip direction
      if (newWpIdx >= maxIdx - 1 && newT >= 1.0) {
        newDir = bus.direction === "out" ? "in" : "out";
        newWpIdx = 0;
        newT = 0;
      }

      // Interpolated position between waypoints
      const segA = path[Math.min(newWpIdx, maxIdx)];
      const segB = path[Math.min(newWpIdx + 1, maxIdx)];
      const clampedT = Math.min(newT, 1.0);

      const rawLat = segA[0] + (segB[0] - segA[0]) * clampedT;
      const rawLng = segA[1] + (segB[1] - segA[1]) * clampedT;

      // Tiny GPS jitter (±1m)
      const jLat = (Math.random() - 0.5) * 0.000009;
      const jLng = (Math.random() - 0.5) * 0.000009;

      // Apply lane offset
      const dirSign = newDir === "out" ? +1 : -1;
      const { lat, lng } = applyLaneOffset(rawLat + jLat, rawLng + jLng, newWpIdx, path, dirSign);

      const odometer = (bus.odometer ?? 0) +
        haversineKm(bus.lat, bus.lng, lat, lng);

      // Capacity drifts slowly
      const cap = Math.max(5, Math.min(98,
        (bus.capacityPct ?? 40) + Math.round((Math.random() - 0.5) * 4)
      ));

      return {
        ...bus,
        lat, lng,
        wpIdx: newWpIdx,
        t: clampedT,
        direction: newDir,
        speed: Math.round(targetSpeed),
        odometer: Math.round(odometer * 10) / 10,
        capacityPct: cap,
      };
    });
  });
}

// ─── API ────────────────────────────────────────────────────
export async function getRoutes() { await _d(60); return ROUTES; }
export async function getStops(routeId) { await _d(50); return OUTBOUND_STOPS[routeId] ?? []; }

export async function getBuses(routeId, stopId) {
  await _d(60);
  const buses = _busState[routeId] ?? [];
  const stops = OUTBOUND_STOPS[routeId] ?? [];
  const target = stops.find((s) => s.id === stopId) ?? stops[0];
  return buses.map((b) => ({
    ...b,
    etaToNextStop: calcEta(b.lat, b.lng, b.speed, target?.lat ?? b.lat, target?.lng ?? b.lng),
    targetStop: target?.name ?? "—",
  }));
}

export async function getAllBuses() {
  await _d(40);
  return Object.values(_busState).flat().map((b) => {
    const stops = OUTBOUND_STOPS[b.routeId] ?? [];
    const nearestStop = stops[0];
    return {
      ...b,
      etaToNextStop: calcEta(b.lat, b.lng, b.speed,
        nearestStop?.lat ?? b.lat, nearestStop?.lng ?? b.lng),
      targetStop: nearestStop?.name ?? "—",
    };
  });
}

function _d(ms) { return new Promise((r) => setTimeout(r, ms)); }
