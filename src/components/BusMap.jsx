/**
 * BusMap.jsx — v8
 * ══════════════════════════════════════════════════════════════
 *  FIXES:
 *  ① Polylines follow real road GPS coords (from mockData v8)
 *  ② Buses snap to road centerline — fit INSIDE the lane
 *  ③ Road drawn as proper dual-lane: casing + surface + color
 *  ④ Bus stop = real rectangular shelter box on the map
 *  ⑤ Bus icon compact enough to sit inside the road lane
 *  ⑥ No offset on bus snap — bus is ON the road, not beside it
 * ══════════════════════════════════════════════════════════════
 */

import React, { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { formatEta, etaColor, calcBearing, easeOutCubic } from "../utils/utils";
import {
  ROUTES, OUTBOUND_STOPS, INBOUND_STOPS, ROUTE_WAYPOINTS,
} from "../api/mockData";
import {
  getLabelMode, labelForMode,
  lightenHex, darkenHex, snapToPolyline,
} from "../utils/mapHelpers";

// Real OSM tiles
const TILE_URL  = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_OPTS = {
  attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  subdomains: "abc",
  maxZoom: 19,
  className: "map-tile-layer",
};

// ════════════════════════════════════════════════════════════════
// ③ Road polyline builder — outbound right, inbound left
//    Uses a smaller offset so both lanes sit inside the real road
// ════════════════════════════════════════════════════════════════
function buildRoadLanes(waypoints, offsetDeg = 0.00006) {
  if (!waypoints || waypoints.length < 2) return { outbound: [], inbound: [] };

  const outbound = [];
  const inbound  = [];

  for (let i = 0; i < waypoints.length; i++) {
    const A   = waypoints[Math.max(i - 1, 0)];
    const B   = waypoints[Math.min(i + 1, waypoints.length - 1)];
    const cur = waypoints[i];

    const dLat = B[0] - A[0];
    const dLng = B[1] - A[1];
    const len  = Math.sqrt(dLat * dLat + dLng * dLng) || 1e-10;

    // Perpendicular right (+) and left (-)
    const pLat = -dLng / len;
    const pLng =  dLat / len;

    outbound.push([cur[0] + pLat * offsetDeg,  cur[1] + pLng * offsetDeg]);
    inbound.push( [cur[0] - pLat * offsetDeg,  cur[1] - pLng * offsetDeg]);
  }

  inbound.reverse();
  return { outbound, inbound };
}

// ════════════════════════════════════════════════════════════════
// ICON FACTORIES
// ════════════════════════════════════════════════════════════════

function makeUserIcon() {
  return L.divIcon({
    className: "",
    iconSize:   [28, 28],
    iconAnchor: [14, 14],
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
      <circle cx="14" cy="14" r="12" fill="#2563EB" fill-opacity="0">
        <animate attributeName="r"            values="9;20"  dur="2s" repeatCount="indefinite"/>
        <animate attributeName="fill-opacity" values="0.22;0" dur="2s" repeatCount="indefinite"/>
      </circle>
      <circle cx="14" cy="14" r="9" fill="white"
        filter="drop-shadow(0 2px 6px rgba(37,99,235,.55))"/>
      <circle cx="14" cy="14" r="6" fill="#2563EB"/>
      <circle cx="12" cy="12" r="2" fill="white" fill-opacity="0.50"/>
    </svg>`,
  });
}

/**
 * ④ Bus stop = realistic shelter box:
 *   A horizontal rectangular sign board mounted on two poles,
 *   exactly like a real roadside bus stop sign.
 *   At low zoom: just a small colored dot.
 *   At zoom 14+: full sign board appears.
 */
function makeStopIcon(color, name, isSelected, isNearest, dimmed, labelMode, dir) {
  const mode = labelMode;

  // ── COMPACT DOT (low zoom) ───────────────────────────────
  if (mode === "hidden") {
    const r  = isSelected ? 9 : isNearest ? 7 : 5;
    const sz = r * 2 + 4;
    const c  = dimmed ? "#94A3B8" : isSelected ? "#F97316" : isNearest ? "#F59E0B" : color;
    return L.divIcon({
      className: "",
      iconSize:  [sz, sz],
      iconAnchor:[sz / 2, sz / 2],
      popupAnchor:[0, -(sz / 2 + 4)],
      html: `<svg xmlns="http://www.w3.org/2000/svg" width="${sz}" height="${sz}" viewBox="0 0 ${sz} ${sz}">
        ${isNearest ? `<circle cx="${sz/2}" cy="${sz/2}" r="${r}" fill="${c}" fill-opacity="0">
          <animate attributeName="r" values="${r};${r+8}" dur="1.8s" repeatCount="indefinite"/>
          <animate attributeName="fill-opacity" values="0.4;0" dur="1.8s" repeatCount="indefinite"/>
        </circle>` : ""}
        <circle cx="${sz/2}" cy="${sz/2}" r="${r}"
          fill="${c}" stroke="white" stroke-width="2"
          filter="drop-shadow(0 1px 3px rgba(0,0,0,0.30))"/>
      </svg>`,
    });
  }

  // ── FULL BUS STOP SHELTER BOX (zoom 14+) ────────────────
  const labelText = mode === "short"
    ? (name.length > 10 ? name.slice(0, 9) + "…" : name)
    : name;

  const sc      = dimmed ? "#94A3B8" : isSelected ? "#F97316" : isNearest ? "#F59E0B" : color;
  const bw      = Math.max(labelText.length * 7.2 + 28, 64); // board width
  const bh      = 20;  // board height
  const poleH   = 28;  // pole height below board
  const poleGap = bw * 0.22; // gap between poles
  const totalW  = bw + 4;
  const totalH  = bh + poleH + 6;
  const cx      = totalW / 2;
  const boardX  = 2;
  const boardY  = 2;
  const pole1X  = cx - poleGap / 2;
  const pole2X  = cx + poleGap / 2;
  const poleTop = boardY + bh;
  const poleBot = poleTop + poleH;

  return L.divIcon({
    className:  "",
    iconSize:   [totalW, totalH],
    iconAnchor: [cx, poleBot],          // anchor at base of poles
    popupAnchor:[0, -(poleBot + 6)],
    html: `<svg xmlns="http://www.w3.org/2000/svg"
        width="${totalW}" height="${totalH}" viewBox="0 0 ${totalW} ${totalH}">

      <!-- Board shadow -->
      <rect x="${boardX+1.5}" y="${boardY+1.5}" width="${bw}" height="${bh}"
        rx="4" fill="rgba(0,0,0,0.18)"/>

      <!-- Board body -->
      <rect x="${boardX}" y="${boardY}" width="${bw}" height="${bh}"
        rx="4" fill="${dimmed ? "#CBD5E1" : sc}"
        stroke="${dimmed ? "#94A3B8" : darkenHex(sc, 0.22)}" stroke-width="1.2"/>

      <!-- White stripe at bottom of board (realism) -->
      <rect x="${boardX}" y="${boardY + bh - 5}" width="${bw}" height="5"
        rx="0 0 4 4" fill="white" fill-opacity="0.20"/>

      <!-- Direction arrow -->
      <text x="${boardX + 7}" y="${boardY + bh/2 + 4.5}"
        font-size="9" font-family="-apple-system,sans-serif"
        font-weight="900" fill="white" opacity="${dimmed ? 0.4 : 0.85}">${dir === "in" ? "←" : "→"}</text>

      <!-- Stop name -->
      <text x="${boardX + bw/2 + 3}" y="${boardY + bh/2 + 4.5}"
        font-size="8" font-family="-apple-system,sans-serif"
        font-weight="700" fill="white" opacity="${dimmed ? 0.4 : 0.92}"
        text-anchor="middle">${labelText}</text>

      <!-- Pole 1 -->
      <rect x="${pole1X - 1.5}" y="${poleTop}" width="3" height="${poleH}"
        rx="1.5" fill="${dimmed ? "#CBD5E1" : darkenHex(sc, 0.15)}" opacity="0.9"/>

      <!-- Pole 2 -->
      <rect x="${pole2X - 1.5}" y="${poleTop}" width="3" height="${poleH}"
        rx="1.5" fill="${dimmed ? "#CBD5E1" : darkenHex(sc, 0.15)}" opacity="0.9"/>

      <!-- Nearest pulse -->
      ${isNearest && !dimmed ? `
        <circle cx="${cx}" cy="${poleBot - 2}" r="4" fill="${sc}" fill-opacity="0">
          <animate attributeName="r" values="4;14" dur="1.8s" repeatCount="indefinite"/>
          <animate attributeName="fill-opacity" values="0.4;0" dur="1.8s" repeatCount="indefinite"/>
        </circle>
      ` : ""}

      <!-- Base dot where poles meet ground -->
      <circle cx="${pole1X}" cy="${poleBot}" r="2.5"
        fill="${dimmed ? "#94A3B8" : sc}" stroke="white" stroke-width="1.5"/>
      <circle cx="${pole2X}" cy="${poleBot}" r="2.5"
        fill="${dimmed ? "#94A3B8" : sc}" stroke="white" stroke-width="1.5"/>
    </svg>`,
  });
}

/**
 * ② Compact bus icon — small enough to fit INSIDE a road lane.
 *   No oversized shadow, no huge ring. Just a clean bus silhouette
 *   with route color and direction arrow.
 *   Width: 32px — fits inside a 14px road lane at zoom 15+.
 */
function makeBusIcon(color, bearing = 0, direction = "out", etaMins = null) {
  const rot     = bearing || (direction === "out" ? 0 : 180);
  const showEta = etaMins !== null && etaMins <= 15;
  const etaText = etaMins <= 1 ? "NOW" : `${etaMins}m`;
  const etaBg   = etaMins <= 2 ? "#DC2626" : etaMins <= 5 ? "#F97316" : "#16A34A";

  return L.divIcon({
    className: "",
    iconSize:   [36, 40],
    iconAnchor: [18, 18],   // ② centered on the road
    popupAnchor:[0, -22],
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="40" viewBox="0 0 36 40">
      <!-- Compact shadow -->
      <ellipse cx="18" cy="22" rx="9" ry="3.5" fill="rgba(0,0,0,0.20)"/>
      <!-- White border ring -->
      <circle cx="18" cy="17" r="14" fill="white"
        filter="drop-shadow(0 2px 6px rgba(0,0,0,0.25))"/>
      <!-- Route color fill -->
      <circle cx="18" cy="17" r="12" fill="${color}"/>

      <!-- Bus windscreen -->
      <rect x="10" y="10" width="16" height="9" rx="2.5" fill="white" fill-opacity="0.92"/>
      <!-- Window dividers -->
      <rect x="11.5" y="11.5" width="5.5" height="3.5" rx="1" fill="${color}"/>
      <rect x="19"   y="11.5" width="5.5" height="3.5" rx="1" fill="${color}"/>

      <!-- Wheels -->
      <circle cx="13" cy="23" r="2" fill="white" fill-opacity="0.80"/>
      <circle cx="23" cy="23" r="2" fill="white" fill-opacity="0.80"/>

      <!-- Direction arrow — rotates with bearing -->
      <g transform="translate(18,17) rotate(${rot}) translate(-18,-17)">
        <polygon points="18,5 22,11 14,11" fill="white" fill-opacity="0.92"/>
      </g>

      ${showEta ? `
        <!-- ETA badge — top-right corner -->
        <rect x="23" y="1" width="13" height="11" rx="5.5" fill="${etaBg}"
          filter="drop-shadow(0 1px 3px rgba(0,0,0,0.35))"/>
        <text x="29.5" y="10" text-anchor="middle"
          font-size="6.5" font-weight="900"
          font-family="-apple-system,sans-serif" fill="white">${etaText}</text>
      ` : ""}
    </svg>`,
  });
}

function makeTerminalIcon(label, color) {
  const bg = label === "A" ? "#16A34A" : "#DC2626";
  return L.divIcon({
    className: "",
    iconSize:  [30, 40],
    iconAnchor:[15, 40],
    popupAnchor:[0, -44],
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="40" viewBox="0 0 30 40">
      <filter id="fterm${label}">
        <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-opacity="0.30"/>
      </filter>
      <path d="M15 2C9 2 3.5 7.5 3.5 14c0 9.5 11.5 24 11.5 24S26.5 23.5 26.5 14C26.5 7.5 21 2 15 2z"
        fill="${bg}" stroke="white" stroke-width="2" filter="url(#fterm${label})"/>
      <circle cx="15" cy="14" r="8" fill="white"/>
      <text x="15" y="18" text-anchor="middle" font-size="10" font-weight="900"
        font-family="-apple-system,sans-serif" fill="${bg}">${label}</text>
    </svg>`,
  });
}

// ════════════════════════════════════════════════════════════════
// POPUP HTML
// ════════════════════════════════════════════════════════════════

function busPopupHtml(bus, route) {
  const eta = bus.etaToNextStop;
  const c   = etaColor(eta);
  const dir = bus.direction === "out" ? "→ Outbound" : "← Inbound";
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;width:210px">
      <div style="display:flex;align-items:center;gap:9px;margin-bottom:10px">
        <div style="width:32px;height:32px;border-radius:9px;background:${route?.color};
          display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <svg width="17" height="17" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="4" width="16" height="9" rx="2.5" fill="white" fill-opacity="0.95"/>
            <circle cx="5.5" cy="15" r="1.8" fill="white" fill-opacity="0.85"/>
            <circle cx="14.5" cy="15" r="1.8" fill="white" fill-opacity="0.85"/>
          </svg>
        </div>
        <div style="flex:1">
          <div style="font-size:13px;font-weight:800;color:#0F172A">${bus.id}</div>
          <div style="font-size:9px;color:${route?.color};font-weight:700;
            text-transform:uppercase;letter-spacing:.04em">${dir}</div>
        </div>
        <div style="background:${c}15;border:1.5px solid ${c}30;border-radius:10px;
          padding:4px 9px;text-align:center">
          <div style="font-size:16px;font-weight:900;color:${c};line-height:1">${formatEta(eta)}</div>
          <div style="font-size:7px;color:#94A3B8;font-weight:700;text-transform:uppercase;
            margin-top:1px">ETA</div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px">
        <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:9px;padding:7px 9px">
          <div style="color:#94A3B8;font-size:7.5px;font-weight:700;text-transform:uppercase;
            letter-spacing:.07em;margin-bottom:2px">Speed</div>
          <div style="font-size:16px;font-weight:800;color:#1E293B">
            ${bus.speed}<span style="font-size:8px;color:#94A3B8"> km/h</span></div>
        </div>
        <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:9px;padding:7px 9px">
          <div style="color:#94A3B8;font-size:7.5px;font-weight:700;text-transform:uppercase;
            letter-spacing:.07em;margin-bottom:2px">Route</div>
          <div style="font-size:13px;font-weight:900;color:${route?.color}">${route?.shortCode ?? "—"}</div>
        </div>
      </div>
      <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:9px;
        padding:7px 9px;font-size:10px;color:#64748B">
        <b style="color:#374151">Next:</b> ${bus.targetStop ?? "—"}
      </div>
    </div>`;
}

function stopPopupHtml(stop, route, isNearest, buses) {
  const c = route?.color ?? "#6B7280";
  const dir = stop.dir === "in" ? "← Return" : "→ Outbound";
  const rows = buses.length
    ? buses.slice(0, 3).map((b) => `
      <div style="display:flex;justify-content:space-between;align-items:center;
        padding:5px 0;border-bottom:1px solid #F1F5F9">
        <div style="display:flex;align-items:center;gap:5px">
          <div style="width:5px;height:5px;border-radius:50%;background:${c}"></div>
          <span style="font-size:11px;color:#374151;font-weight:600">${b.id}</span>
          <span style="font-size:9px;color:#94A3B8">${b.speed} km/h</span>
        </div>
        <span style="font-size:11px;font-weight:800;color:${etaColor(b.etaToNextStop)};
          background:${etaColor(b.etaToNextStop)}18;padding:2px 8px;border-radius:10px">
          ${formatEta(b.etaToNextStop)}</span>
      </div>`).join("")
    : `<div style="color:#94A3B8;font-size:11px;padding:8px 0;text-align:center">No buses nearby</div>`;

  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;width:220px">
      <div style="display:flex;align-items:flex-start;gap:9px;margin-bottom:10px;
        padding-bottom:9px;border-bottom:2px solid ${c}20">
        <div style="width:36px;height:36px;border-radius:9px;background:${c};
          display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <svg width="19" height="19" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="16" height="10" rx="2.5" fill="white" fill-opacity="0.92"/>
            <rect x="9" y="12" width="2" height="6" fill="white" fill-opacity="0.75"/>
            <rect x="5" y="17" width="10" height="1.5" rx=".75" fill="white" fill-opacity="0.5"/>
          </svg>
        </div>
        <div style="flex:1">
          <div style="font-size:13px;font-weight:800;color:#0F172A;line-height:1.25">
            ${stop.name}
            ${isNearest ? `<span style="margin-left:4px;font-size:7.5px;background:#FEF3C7;
              color:#D97706;padding:1px 5px;border-radius:6px;font-weight:700">⭐ NEAREST</span>` : ""}
          </div>
          <div style="margin-top:3px;display:flex;align-items:center;gap:4px">
            <span style="font-size:8.5px;background:${c};color:white;
              padding:1px 7px;border-radius:20px;font-weight:800">${route?.shortCode ?? "?"}</span>
            <span style="font-size:9px;color:#64748B;font-weight:600">${dir}</span>
          </div>
        </div>
      </div>
      <div style="font-size:8.5px;color:#94A3B8;font-weight:700;text-transform:uppercase;
        letter-spacing:.08em;margin-bottom:5px">Upcoming buses</div>
      ${rows}
    </div>`;
}

// ════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════

const BusMap = forwardRef(function BusMap({
  buses = [],
  allStops = [],
  userLocation,
  selectedStop,
  nearestStopId,
  onStopSelect,
  recenterTick  = 0,
  goNearestTick = 0,
  showBuses     = true,
  searchQuery   = "",
  activeRouteId = null,
}, ref) {
  const domRef     = useRef(null);
  const mapRef     = useRef(null);
  const layerRoute = useRef(null);
  const layerStop  = useRef(null);
  const layerBus   = useRef(null);
  const layerUser  = useRef(null);

  const zoomRef        = useRef(13);
  const stopMarkersRef = useRef({});
  const prevBusPos     = useRef({});
  const animFrames     = useRef({});

  useImperativeHandle(ref, () => ({
    zoomIn:  () => mapRef.current?.zoomIn(),
    zoomOut: () => mapRef.current?.zoomOut(),
    flyTo:   (lat, lng, zoom = 16) =>
      mapRef.current?.flyTo([lat, lng], zoom, { animate: true, duration: 0.9 }),
  }));

  // ── Init map ───────────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current) return;
    const center = userLocation
      ? [userLocation.lat, userLocation.lng]
      : [-1.9441, 30.0619];

    mapRef.current = L.map(domRef.current, {
      center, zoom: 14,
      zoomControl: false,
      attributionControl: true,
      zoomAnimation: true,
      fadeAnimation: true,
      markerZoomAnimation: true,
    });
    L.tileLayer(TILE_URL, TILE_OPTS).addTo(mapRef.current);

    layerRoute.current = L.layerGroup().addTo(mapRef.current);
    layerStop.current  = L.layerGroup().addTo(mapRef.current);
    layerBus.current   = L.layerGroup().addTo(mapRef.current);
    layerUser.current  = L.layerGroup().addTo(mapRef.current);

    mapRef.current.on("zoomend", () => {
      const z = mapRef.current.getZoom();
      zoomRef.current = z;
      _refreshStopLabels(z);
    });

    return () => {
      Object.values(animFrames.current).forEach(cancelAnimationFrame);
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line

  // ── User location dot ─────────────────────────────────────
  useEffect(() => {
    if (!layerUser.current || !userLocation) return;
    layerUser.current.clearLayers();
    L.marker([userLocation.lat, userLocation.lng], {
      icon: makeUserIcon(), zIndexOffset: 3000,
    }).bindPopup(`<b style="font-family:-apple-system,sans-serif;color:#1D4ED8;font-size:13px">📍 You are here</b>`)
      .addTo(layerUser.current);
    mapRef.current?.flyTo([userLocation.lat, userLocation.lng], 14, { animate: true, duration: 1.0 });
  }, [userLocation]);

  // ── Recenter ──────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !userLocation || recenterTick === 0) return;
    mapRef.current.flyTo([userLocation.lat, userLocation.lng], 14, { animate: true, duration: 0.9 });
  }, [recenterTick]); // eslint-disable-line

  useEffect(() => {
    if (!mapRef.current || !allStops.length || goNearestTick === 0) return;
    const s = allStops.find((s) => s.id === nearestStopId) ?? allStops[0];
    if (s) { mapRef.current.flyTo([s.lat, s.lng], 16, { animate: true, duration: 0.9 }); onStopSelect?.(s); }
  }, [goNearestTick]); // eslint-disable-line

  // ── ③ Road-style polylines ────────────────────────────────
  useEffect(() => {
    if (!layerRoute.current) return;

    const draw = () => {
      mapRef.current?.invalidateSize({ animate: false });
      layerRoute.current.clearLayers();

      const routesToDraw = activeRouteId
        ? ROUTES.filter((r) => r.id === activeRouteId)
        : ROUTES;

      routesToDraw.forEach((route) => {
        const waypoints = ROUTE_WAYPOINTS[route.id];
        if (!waypoints || waypoints.length < 2) return;

        const isActive = activeRouteId === route.id;

        // Lane sizes — active route is drawn wider for visibility
        const casingW  = isActive ? 20 : 14;
        const surfaceW = isActive ? 15 : 10;
        const laneW    = isActive ? 13 : 8;
        const retCasingW  = isActive ? 13 : 9;
        const retSurfaceW = isActive ? 9  : 6;
        const retLaneW    = isActive ? 8  : 5;

        // ① Small offset — lanes sit inside the actual road
        const { outbound, inbound } = buildRoadLanes(waypoints, isActive ? 0.00008 : 0.00006);

        const returnColor = lightenHex(route.color, 0.40);

        // ── OUTBOUND (A→B) ─────────────────────────────────
        // Dark road edge
        L.polyline(outbound, {
          color: darkenHex(route.color, 0.55), weight: casingW,
          opacity: isActive ? 0.70 : 0.50,
          lineJoin: "round", lineCap: "round", interactive: false,
        }).addTo(layerRoute.current);

        // Light asphalt surface
        L.polyline(outbound, {
          color: "#F0F4F8", weight: surfaceW,
          opacity: isActive ? 0.95 : 0.88,
          lineJoin: "round", lineCap: "round", interactive: false,
        }).addTo(layerRoute.current);

        // Route color lane stripe
        const outLine = L.polyline(outbound, {
          color: route.color, weight: laneW,
          opacity: isActive ? 0.92 : 0.78,
          lineJoin: "round", lineCap: "round",
        });
        outLine.on("mouseover", function() { this.setStyle({ weight: laneW + 3, opacity: 1 }); });
        outLine.on("mouseout",  function() { this.setStyle({ weight: laneW, opacity: isActive ? 0.92 : 0.78 }); });
        outLine.bindPopup(`
          <div style="font-family:-apple-system,sans-serif;display:flex;align-items:center;gap:8px;padding:2px 0">
            <div style="width:22px;height:22px;border-radius:6px;background:${route.color};
              display:flex;align-items:center;justify-content:center">
              <span style="color:white;font-size:8.5px;font-weight:900">${route.shortCode}</span>
            </div>
            <div>
              <div style="font-size:13px;font-weight:800;color:#0F172A">${route.name}</div>
              <div style="font-size:9px;color:${route.color};font-weight:600;margin-top:1px">
                → Outbound · ${(OUTBOUND_STOPS[route.id] ?? []).length} stops</div>
            </div>
          </div>`, { className: "kbus-popup" });
        outLine.addTo(layerRoute.current);

        // ── INBOUND (B→A) ──────────────────────────────────
        L.polyline(inbound, {
          color: darkenHex(returnColor, 0.35), weight: retCasingW,
          opacity: isActive ? 0.60 : 0.42,
          lineJoin: "round", lineCap: "round", interactive: false,
        }).addTo(layerRoute.current);

        L.polyline(inbound, {
          color: "#EEF4FA", weight: retSurfaceW,
          opacity: isActive ? 0.90 : 0.78,
          lineJoin: "round", lineCap: "round", interactive: false,
        }).addTo(layerRoute.current);

        L.polyline(inbound, {
          color: returnColor, weight: retLaneW,
          opacity: isActive ? 0.80 : 0.62,
          lineJoin: "round", lineCap: "round",
        })
          .bindTooltip(`${route.shortCode} ← Return`, { sticky: true, className: "kbus-tooltip" })
          .addTo(layerRoute.current);

        // Terminals — only in single-route mode
        if (activeRouteId === route.id) {
          const out = OUTBOUND_STOPS[route.id] ?? [];
          if (out.length) {
            L.marker([out[0].lat, out[0].lng], { icon: makeTerminalIcon("A"), zIndexOffset: 700 })
              .bindPopup(`<b style="font-family:-apple-system,sans-serif;color:#16A34A;font-size:13px">
                🟢 Start · ${out[0].name}</b>`, { className: "kbus-popup" })
              .addTo(layerRoute.current);
            const last = out[out.length - 1];
            L.marker([last.lat, last.lng], { icon: makeTerminalIcon("B"), zIndexOffset: 700 })
              .bindPopup(`<b style="font-family:-apple-system,sans-serif;color:#DC2626;font-size:13px">
                🔴 End · ${last.name}</b>`, { className: "kbus-popup" })
              .addTo(layerRoute.current);
          }
        }
      });

      // Fit map to show full active route
      if (activeRouteId) {
        const wp = ROUTE_WAYPOINTS[activeRouteId] ?? [];
        if (wp.length) {
          mapRef.current?.fitBounds(L.latLngBounds(wp), {
            padding: [80, 80], animate: true, maxZoom: 16,
          });
        }
      }
    };

    const tid = setTimeout(() => requestAnimationFrame(draw), 150);
    return () => clearTimeout(tid);
  }, [activeRouteId]); // eslint-disable-line

  // ── ④ Stop shelter boxes ──────────────────────────────────
  useEffect(() => {
    if (!layerStop.current) return;
    layerStop.current.clearLayers();
    stopMarkersRef.current = {};

    const q    = searchQuery.toLowerCase();
    const mode = getLabelMode(zoomRef.current);

    const outStops = activeRouteId ? (OUTBOUND_STOPS[activeRouteId] ?? []) : Object.values(OUTBOUND_STOPS).flat();
    const inStops  = activeRouteId ? (INBOUND_STOPS[activeRouteId]  ?? []) : Object.values(INBOUND_STOPS).flat();

    const skipIds = new Set();
    if (activeRouteId) {
      const out = OUTBOUND_STOPS[activeRouteId] ?? [];
      const inn = INBOUND_STOPS[activeRouteId]  ?? [];
      if (out.length) { skipIds.add(out[0].id); skipIds.add(out[out.length-1].id); }
      if (inn.length) { skipIds.add(inn[0].id); skipIds.add(inn[inn.length-1].id); }
    }

    [...outStops, ...inStops].forEach((stop) => {
      if (skipIds.has(stop.id)) return;

      const isSelected = stop.id === selectedStop?.id;
      const isNearest  = stop.id === nearestStopId;
      const dimmed     = q.length > 0 && !stop.name.toLowerCase().includes(q);
      const route      = ROUTES.find((r) => r.id === stop.routeId);
      const routeBuses = buses
        .filter((b) => b.routeId === stop.routeId)
        .sort((a, b) => a.etaToNextStop - b.etaToNextStop);

      const marker = L.marker([stop.lat, stop.lng], {
        icon: makeStopIcon(route?.color ?? "#64748B", stop.name,
          isSelected, isNearest, dimmed, mode, stop.dir),
        zIndexOffset: isSelected ? 1500 : isNearest ? 1200 : 0,
        opacity: dimmed ? 0.35 : 1,
      });

      marker.bindPopup(
        stopPopupHtml(stop, route, isNearest, routeBuses),
        { maxWidth: 250, className: "kbus-popup" }
      );
      marker.on("click", () => onStopSelect?.(stop));
      marker.addTo(layerStop.current);
      stopMarkersRef.current[stop.id] = { marker, stop, route, isSelected, isNearest, dimmed };
    });
  }, [allStops, selectedStop, nearestStopId, searchQuery, activeRouteId, buses, onStopSelect]);

  function _refreshStopLabels(zoom) {
    const mode = getLabelMode(zoom);
    Object.values(stopMarkersRef.current).forEach(({ marker, stop, route, isSelected, isNearest, dimmed }) => {
      marker.setIcon(makeStopIcon(route?.color ?? "#64748B", stop.name,
        isSelected, isNearest, dimmed, mode, stop.dir));
    });
  }

  // ── ② Bus markers — snapped ON the road centerline ───────
  useEffect(() => {
    if (!layerBus.current) return;
    if (!showBuses) { layerBus.current.clearLayers(); return; }

    const visibleBuses = activeRouteId
      ? buses.filter((b) => b.routeId === activeRouteId)
      : buses;

    const existing = {};
    layerBus.current.eachLayer((layer) => {
      if (layer._busId) existing[layer._busId] = layer;
    });

    visibleBuses.forEach((bus) => {
      const route   = ROUTES.find((r) => r.id === bus.routeId);
      const color   = route?.color ?? "#F97316";
      const wps     = ROUTE_WAYPOINTS[bus.routeId] ?? [];
      const prev    = prevBusPos.current[bus.id];
      const bearing = prev ? calcBearing(prev.lat, prev.lng, bus.lat, bus.lng) : 0;
      const eta     = bus.etaToNextStop ?? null;

      // ② Snap bus to road centerline (no offset — center of road)
      const snapped = snapToPolyline(bus.lat, bus.lng, wps, bus.direction ?? "out");

      if (existing[bus.id]) {
        const m    = existing[bus.id];
        const from = m.getLatLng();
        const to   = L.latLng(snapped.lat, snapped.lng);
        const t0   = performance.now();

        if (animFrames.current[bus.id]) cancelAnimationFrame(animFrames.current[bus.id]);
        const step = (now) => {
          const p = Math.min((now - t0) / 800, 1);
          const e = easeOutCubic(p);
          m.setLatLng([from.lat + (to.lat - from.lat) * e, from.lng + (to.lng - from.lng) * e]);
          if (p < 1) animFrames.current[bus.id] = requestAnimationFrame(step);
        };
        animFrames.current[bus.id] = requestAnimationFrame(step);
        m.setIcon(makeBusIcon(color, bearing, bus.direction, eta));
        m.setPopupContent(busPopupHtml(bus, route));
        delete existing[bus.id];
      } else {
        const m = L.marker([snapped.lat, snapped.lng], {
          icon: makeBusIcon(color, bearing, bus.direction, eta),
          zIndexOffset: 1000,
        });
        m._busId = bus.id;
        m.bindPopup(busPopupHtml(bus, route), { maxWidth: 240, className: "kbus-popup" });
        m.addTo(layerBus.current);
      }
      prevBusPos.current[bus.id] = { lat: bus.lat, lng: bus.lng };
    });

    Object.values(existing).forEach((m) => layerBus.current.removeLayer(m));
  }, [buses, showBuses, activeRouteId]);

  // ── Render ─────────────────────────────────────────────────
  return (
    <>
      <style>{`
        .map-tile-layer { filter: brightness(1.0) saturate(1.0) contrast(1.0); }
        .leaflet-tile { transition: opacity 0.20s ease !important; }
        .leaflet-zoom-anim .leaflet-zoom-animated {
          transition: transform 0.25s cubic-bezier(.25,.46,.45,.94) !important;
        }
        .kbus-tooltip {
          background: rgba(15,23,42,0.90) !important;
          border: none !important;
          border-radius: 8px !important;
          font-size: 11px !important;
          font-family: -apple-system, sans-serif !important;
          color: #F1F5F9 !important;
          box-shadow: 0 3px 12px rgba(0,0,0,0.22) !important;
          padding: 4px 10px !important;
          font-weight: 700 !important;
        }
        .kbus-tooltip::before { display: none !important; }
        .kbus-popup .leaflet-popup-content-wrapper {
          border-radius: 14px !important;
          padding: 0 !important;
          box-shadow: 0 8px 28px rgba(0,0,0,0.16), 0 2px 6px rgba(0,0,0,0.06) !important;
          border: 1px solid rgba(0,0,0,0.06) !important;
          overflow: hidden;
        }
        .kbus-popup .leaflet-popup-content { margin: 13px 13px !important; }
        .kbus-popup .leaflet-popup-tip { box-shadow: none !important; }
        .kbus-popup .leaflet-popup-close-button {
          top: 9px !important; right: 9px !important;
          font-size: 15px !important; color: #94A3B8 !important;
        }
        .leaflet-marker-icon { transition: opacity 0.16s ease; }
      `}</style>
      <div ref={domRef} className="absolute inset-0" style={{ zIndex: 0 }} />
    </>
  );
});

export default BusMap;
