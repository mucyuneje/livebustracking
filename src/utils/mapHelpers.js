/**
 * mapHelpers.js  —  v6
 * Pure map helpers — no React, no Leaflet imports.
 * ══════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────
// 1. ZOOM-LEVEL LABEL VISIBILITY
//    Aggressive hiding — even "short" mode only shows labels
//    when closely zoomed.  This is the #1 fix for messy text.
// ─────────────────────────────────────────────────────────────

/** @returns {'full'|'short'|'hidden'} */
export function getLabelMode(zoom) {
  if (zoom >= 15) return "full";    // full stop names
  if (zoom >= 14) return "short";   // 8-char abbreviation
  return "hidden";                  // no text at all
}

/** Returns the label string for a given mode, or "" to suppress bubble */
export function labelForMode(name, mode) {
  if (mode === "hidden") return "";
  if (mode === "short")  return name.length > 9 ? name.slice(0, 8) + "…" : name;
  return name.length > 18 ? name.slice(0, 17) + "…" : name;
}

// ─────────────────────────────────────────────────────────────
// 2. BIDIRECTIONAL OFFSET POLYLINES
//    Takes a shared waypoints array and returns two coordinate
//    arrays that sit side-by-side like a two-lane road.
//    offsetDeg ≈ 0.00012° ≈ 13 m — clearly separated at z13+.
// ─────────────────────────────────────────────────────────────

/**
 * Offset a single point perpendicular to segment A→B.
 * dir: +1 = right of travel, −1 = left
 */
function perpOffset(A, B, d, dir) {
  const dLat = B[0] - A[0];
  const dLng = B[1] - A[1];
  const len  = Math.sqrt(dLat * dLat + dLng * dLng) || 1e-10;
  return [
    A[0] + (-dLng / len) * d * dir,
    A[1] + ( dLat / len) * d * dir,
  ];
}

/**
 * Build outbound + inbound coordinate arrays from shared waypoints.
 * @param {number[][]} waypoints  [[lat,lng],...]
 * @param {number}     offsetDeg  lateral separation in degrees
 * @returns {{ outbound: number[][], inbound: number[][] }}
 */
export function buildBidirectionalPolylines(waypoints, offsetDeg = 0.00012) {
  if (!waypoints || waypoints.length < 2) return { outbound: [], inbound: [] };

  const outbound = [];
  const inbound  = [];

  for (let i = 0; i < waypoints.length; i++) {
    // Use the segment that exists at this index
    const A = waypoints[Math.max(i - 1, 0)];
    const B = waypoints[Math.min(i + 1, waypoints.length - 1)];
    const curr = waypoints[i];

    outbound.push(perpOffset(A, B, offsetDeg, +1));
    inbound.push( perpOffset(A, B, offsetDeg, -1));
  }

  // Inbound travels B→A (reversed)
  inbound.reverse();

  return { outbound, inbound };
}

// ─────────────────────────────────────────────────────────────
// 3. BUS POSITION SNAP TO POLYLINE
//    Projects a bus lat/lng onto its nearest segment on the
//    route waypoints so the icon always sits on the line.
// ─────────────────────────────────────────────────────────────

/**
 * @param {number}     lat
 * @param {number}     lng
 * @param {number[][]} waypoints
 * @param {'out'|'in'} direction
 * @returns {{lat:number, lng:number}}
 */
export function snapToPolyline(lat, lng, waypoints, direction = "out") {
  if (!waypoints || waypoints.length < 2) return { lat, lng };
  const path = direction === "in" ? [...waypoints].reverse() : waypoints;

  let bestLat = path[0][0], bestLng = path[0][1], bestDist = Infinity;

  for (let i = 0; i < path.length - 1; i++) {
    const [ax, ay] = path[i];
    const [bx, by] = path[i + 1];
    const dx = bx - ax, dy = by - ay;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) continue;
    const t = Math.max(0, Math.min(1, ((lat - ax) * dx + (lng - ay) * dy) / lenSq));
    const pLat = ax + t * dx;
    const pLng = ay + t * dy;
    const dist = (lat - pLat) ** 2 + (lng - pLng) ** 2;
    if (dist < bestDist) { bestDist = dist; bestLat = pLat; bestLng = pLng; }
  }

  return { lat: bestLat, lng: bestLng };
}

// ─────────────────────────────────────────────────────────────
// 4. COLOUR UTILITIES
// ─────────────────────────────────────────────────────────────

/** Lighten a hex colour by mixing toward white (amt 0–1) */
export function lightenHex(hex, amt = 0.50) {
  const n = parseInt(hex.replace("#", ""), 16);
  const mix = (c) => Math.round(c + (255 - c) * amt);
  const r = mix((n >> 16) & 255);
  const g = mix((n >>  8) & 255);
  const b = mix( n        & 255);
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

/** Darken a hex colour (amt 0–1) */
export function darkenHex(hex, amt = 0.20) {
  const n = parseInt(hex.replace("#", ""), 16);
  const mix = (c) => Math.round(c * (1 - amt));
  const r = mix((n >> 16) & 255);
  const g = mix((n >>  8) & 255);
  const b = mix( n        & 255);
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}