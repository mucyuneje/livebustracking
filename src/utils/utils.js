/**
 * utils.js — Shared helpers for Kigali Bus System
 */

export function haversineKm(lat1, lng1, lat2, lng2) {
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

export function distanceMeters(lat1, lng1, lat2, lng2) {
  return haversineKm(lat1, lng1, lat2, lng2) * 1000;
}

export function getNearbyStops(allStops, userLat, userLng, radiusKm = 3) {
  return allStops
    .map((s) => ({ ...s, distanceKm: haversineKm(userLat, userLng, s.lat, s.lng) }))
    .filter((s) => s.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

export function formatTime(date) {
  if (!date) return "—";
  return date.toLocaleTimeString("en-RW", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function formatEta(minutes) {
  if (minutes <= 1) return "Arriving now";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

export function formatDistance(km) {
  if (km == null) return "";
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export function etaColorClass(minutes) {
  if (minutes <= 3) return "text-green-600";
  if (minutes <= 8) return "text-amber-600";
  return "text-orange-600";
}

export function etaColor(minutes) {
  if (minutes <= 3) return "#16A34A";
  if (minutes <= 8) return "#D97706";
  return "#EA580C";
}

export function etaBadgeBg(minutes) {
  if (minutes <= 3) return "bg-green-50 border-green-300";
  if (minutes <= 8) return "bg-amber-50 border-amber-300";
  return "bg-orange-50 border-orange-300";
}

export function buildSmsMessage(busId, etaMinutes, stopName) {
  return `[KigaliBus] ${busId} arrives at ${stopName} in ${formatEta(etaMinutes)}. Reply STOP to opt out. | Rwanda Transport`;
}

export function sortByEta(buses) {
  return [...buses].sort((a, b) => a.etaToNextStop - b.etaToNextStop);
}

/** Build [[lat,lng], ...] array from stops for Leaflet Polyline */
export function buildRoutePolyline(stops) {
  if (!stops || stops.length === 0) return [];
  return stops.map((s) => [s.lat, s.lng]);
}

/**
 * Compass bearing from A→B, degrees 0–360.
 * Used to rotate bus icon toward direction of travel.
 */
export function calcBearing(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const toDeg = (r) => (r * 180) / Math.PI;
  const dLng  = toRad(lng2 - lng1);
  const lat1R = toRad(lat1);
  const lat2R = toRad(lat2);
  const y = Math.sin(dLng) * Math.cos(lat2R);
  const x = Math.cos(lat1R) * Math.sin(lat2R) - Math.sin(lat1R) * Math.cos(lat2R) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/** Ease-out cubic interpolation, t in [0,1] */
export function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}
