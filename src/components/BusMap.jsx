/**
 * BusMap.jsx — v10
 * KEY FIXES:
 * ① HOVER LOOP BUG FIXED — mouseover no longer creates floating
 *   tooltip layers. Instead uses Leaflet's built-in bindTooltip
 *   which is attached once and never accumulates.
 * ② MAP STYLE SWITCHER — Light / Dark / Satellite tile layers
 * ③ MAP ROTATION — CSS rotate trick + compass UI
 * ④ GPS-LIKE BUS MOVEMENT — 60fps requestAnimationFrame interpolation
 *   between the 2.5s position updates from the hook
 */

import React, { useEffect, useRef, forwardRef, useImperativeHandle, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { formatEta, etaColor, calcBearing, easeOutCubic } from "../utils/utils";
import {
  ROUTES, OUTBOUND_STOPS, INBOUND_STOPS, ROUTE_WAYPOINTS, LANE_OFFSET_DEG,
} from "../api/mockData";
import { getLabelMode, lightenHex, darkenHex, snapToPolyline } from "../utils/mapHelpers";

// ════════════════════════════════════════════════════════════════
// TILE LAYERS — Light, Dark, Satellite
// ════════════════════════════════════════════════════════════════
const TILE_LAYERS = {
  light: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    opts: {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      subdomains: "abc", maxZoom: 19, className: "map-tile-layer-light",
    },
  },
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    opts: {
      attribution: '© <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd", maxZoom: 19, className: "map-tile-layer-dark",
    },
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    opts: {
      attribution: "© Esri",
      maxZoom: 18, className: "map-tile-layer-sat",
    },
  },
};

// ════════════════════════════════════════════════════════════════
// LANE BUILDER
// ════════════════════════════════════════════════════════════════
function buildLanes(waypoints, offsetDeg = LANE_OFFSET_DEG) {
  if (!waypoints || waypoints.length < 2) return { out: [], inn: [] };
  const out = [], inn = [];
  for (let i = 0; i < waypoints.length; i++) {
    const A = waypoints[Math.max(i - 1, 0)];
    const B = waypoints[Math.min(i + 1, waypoints.length - 1)];
    const cur = waypoints[i];
    const dLat = B[0] - A[0], dLng = B[1] - A[1];
    const len = Math.sqrt(dLat * dLat + dLng * dLng) || 1e-10;
    const pLat = -dLng / len, pLng = dLat / len;
    out.push([cur[0] + pLat * offsetDeg,  cur[1] + pLng * offsetDeg]);
    inn.push([cur[0] - pLat * offsetDeg,  cur[1] - pLng * offsetDeg]);
  }
  inn.reverse();
  return { out, inn };
}

// ════════════════════════════════════════════════════════════════
// ICON FACTORIES
// ════════════════════════════════════════════════════════════════
function makeUserIcon() {
  return L.divIcon({
    className: "", iconSize: [28, 28], iconAnchor: [14, 14],
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
      <circle cx="14" cy="14" r="12" fill="#2563EB" fill-opacity="0">
        <animate attributeName="r" values="8;20" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="fill-opacity" values="0.25;0" dur="2s" repeatCount="indefinite"/>
      </circle>
      <circle cx="14" cy="14" r="9" fill="white" filter="drop-shadow(0 2px 6px rgba(37,99,235,.55))"/>
      <circle cx="14" cy="14" r="6" fill="#2563EB"/>
      <circle cx="12" cy="12" r="2" fill="white" fill-opacity="0.48"/>
    </svg>`,
  });
}

function makeRealBusIcon(color, direction = "out", etaMins = null) {
  const flip = direction === "in" ? "scale(-1,1) translate(-48,0)" : "";
  const showEta = etaMins !== null && etaMins <= 20;
  const etaText = etaMins <= 1 ? "NOW" : `${etaMins}m`;
  const etaBg = etaMins <= 2 ? "#DC2626" : etaMins <= 6 ? "#EA580C" : "#16A34A";
  const roofColor = darkenHex(color, 0.18);
  const shadowColor = darkenHex(color, 0.40);
  const bumperColor = darkenHex(color, 0.30);

  return L.divIcon({
    className: "", iconSize: [48, 30], iconAnchor: [24, 15], popupAnchor: [0, -18],
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="30" viewBox="0 0 48 30">
      <g transform="${flip}">
        <ellipse cx="24" cy="27" rx="18" ry="3.5" fill="rgba(0,0,0,0.22)"/>
        <rect x="5" y="18" width="38" height="4" rx="1" fill="${shadowColor}" opacity="0.8"/>
        <rect x="4" y="8" width="40" height="13" rx="2" fill="${color}"
          filter="drop-shadow(0 1px 3px rgba(0,0,0,0.30))"/>
        <rect x="6" y="6" width="36" height="5" rx="2" fill="${roofColor}"/>
        <rect x="7" y="6" width="34" height="1.5" rx="1" fill="white" fill-opacity="0.22"/>
        <rect x="41" y="11" width="4" height="8" rx="1.5" fill="${bumperColor}"/>
        <rect x="37" y="9" width="5" height="7" rx="1" fill="#C7E3FF" fill-opacity="0.9"/>
        <rect x="42" y="12" width="2.5" height="2" rx="1" fill="#FEF9C3" opacity="0.95"/>
        <rect x="42" y="15" width="2.5" height="1.5" rx=".75" fill="#FCA5A5" opacity="0.85"/>
        <rect x="3" y="11" width="3.5" height="8" rx="1.5" fill="${bumperColor}"/>
        <rect x="6" y="9.5" width="4" height="6" rx="1" fill="#C7E3FF" fill-opacity="0.75"/>
        <rect x="3.5" y="12" width="2" height="2" rx=".8" fill="#FCA5A5" opacity="0.95"/>
        <rect x="3.5" y="15" width="2" height="1.5" rx=".5" fill="#DC2626" opacity="0.8"/>
        <rect x="13" y="9" width="7" height="6" rx="1.2" fill="#C7E3FF" fill-opacity="0.85"/>
        <rect x="22" y="9" width="7" height="6" rx="1.2" fill="#C7E3FF" fill-opacity="0.85"/>
        <rect x="31" y="9" width="5" height="6" rx="1.2" fill="#C7E3FF" fill-opacity="0.75"/>
        <rect x="13.5" y="9.5" width="2.5" height="1.5" rx=".5" fill="white" fill-opacity="0.40"/>
        <rect x="22.5" y="9.5" width="2.5" height="1.5" rx=".5" fill="white" fill-opacity="0.40"/>
        <rect x="20.5" y="13" width="1" height="8" rx=".5" fill="${shadowColor}" opacity="0.6"/>
        <rect x="6" y="15.5" width="36" height="1.8" rx=".9" fill="white" fill-opacity="0.28"/>
        <circle cx="38" cy="21.5" r="4" fill="#1E293B"/>
        <circle cx="38" cy="21.5" r="2.2" fill="#374151"/>
        <circle cx="38" cy="21.5" r="1" fill="#6B7280"/>
        <circle cx="10" cy="21.5" r="4" fill="#1E293B"/>
        <circle cx="10" cy="21.5" r="2.2" fill="#374151"/>
        <circle cx="10" cy="21.5" r="1" fill="#6B7280"/>
        <rect x="5" y="20" width="44" height="1.2" rx=".6" fill="${shadowColor}" opacity="0.4"/>
      </g>
      ${showEta ? `
        <rect x="33" y="0" width="15" height="10" rx="5"
          fill="${etaBg}" filter="drop-shadow(0 1px 4px rgba(0,0,0,0.40))"/>
        <text x="40.5" y="8" text-anchor="middle" font-size="6.5" font-weight="900"
          font-family="-apple-system,sans-serif" fill="white">${etaText}</text>
      ` : ""}
    </svg>`,
  });
}

function makeStopIcon(color, name, isSelected, isNearest, dimmed, labelMode, dir) {
  if (labelMode === "hidden") {
    const r = isSelected ? 9 : isNearest ? 7 : 5;
    const sz = r * 2 + 4;
    const c = dimmed ? "#94A3B8" : isSelected ? "#F97316" : isNearest ? "#F59E0B" : color;
    return L.divIcon({
      className: "", iconSize: [sz, sz], iconAnchor: [sz/2, sz/2], popupAnchor: [0, -(sz/2+4)],
      html: `<svg xmlns="http://www.w3.org/2000/svg" width="${sz}" height="${sz}" viewBox="0 0 ${sz} ${sz}">
        ${isNearest ? `<circle cx="${sz/2}" cy="${sz/2}" r="${r}" fill="${c}" fill-opacity="0">
          <animate attributeName="r" values="${r};${r+8}" dur="1.8s" repeatCount="indefinite"/>
          <animate attributeName="fill-opacity" values="0.4;0" dur="1.8s" repeatCount="indefinite"/>
        </circle>` : ""}
        <circle cx="${sz/2}" cy="${sz/2}" r="${r}" fill="${c}" stroke="white" stroke-width="2"
          filter="drop-shadow(0 1px 3px rgba(0,0,0,0.28))"/>
      </svg>`,
    });
  }

  const labelText = labelMode === "short"
    ? (name.length > 10 ? name.slice(0, 9) + "…" : name) : name;
  const sc = dimmed ? "#94A3B8" : isSelected ? "#F97316" : isNearest ? "#F59E0B" : color;
  const bw = Math.max(labelText.length * 7.2 + 28, 64), bh = 20, poleH = 26;
  const poleGap = bw * 0.22, totalW = bw + 4, totalH = bh + poleH + 4;
  const cx = totalW / 2, boardX = 2, boardY = 2;
  const poleTop = boardY + bh, poleBot = poleTop + poleH;

  return L.divIcon({
    className: "", iconSize: [totalW, totalH], iconAnchor: [cx, poleBot], popupAnchor: [0, -(poleBot+4)],
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${totalH}" viewBox="0 0 ${totalW} ${totalH}">
      <rect x="${boardX+1.5}" y="${boardY+1.5}" width="${bw}" height="${bh}" rx="4" fill="rgba(0,0,0,0.16)"/>
      <rect x="${boardX}" y="${boardY}" width="${bw}" height="${bh}" rx="4"
        fill="${dimmed ? "#CBD5E1" : sc}"
        stroke="${dimmed ? "#94A3B8" : darkenHex(sc, 0.22)}" stroke-width="1.2"/>
      <rect x="${boardX}" y="${boardY+bh-5}" width="${bw}" height="5" fill="white" fill-opacity="0.18"/>
      <text x="${boardX+7}" y="${boardY+bh/2+4.5}" font-size="9" font-family="-apple-system,sans-serif"
        font-weight="900" fill="white" opacity="${dimmed ? 0.4 : 0.9}">${dir === "in" ? "←" : "→"}</text>
      <text x="${boardX+bw/2+3}" y="${boardY+bh/2+4.5}" font-size="8" font-family="-apple-system,sans-serif"
        font-weight="700" fill="white" opacity="${dimmed ? 0.4 : 0.92}"
        text-anchor="middle">${labelText}</text>
      <rect x="${cx-poleGap/2-1.5}" y="${poleTop}" width="3" height="${poleH}"
        rx="1.5" fill="${dimmed ? "#CBD5E1" : darkenHex(sc, 0.15)}" opacity="0.9"/>
      <rect x="${cx+poleGap/2-1.5}" y="${poleTop}" width="3" height="${poleH}"
        rx="1.5" fill="${dimmed ? "#CBD5E1" : darkenHex(sc, 0.15)}" opacity="0.9"/>
      ${isNearest && !dimmed ? `
        <circle cx="${cx}" cy="${poleBot-2}" r="4" fill="${sc}" fill-opacity="0">
          <animate attributeName="r" values="4;14" dur="1.8s" repeatCount="indefinite"/>
          <animate attributeName="fill-opacity" values="0.4;0" dur="1.8s" repeatCount="indefinite"/>
        </circle>` : ""}
      <circle cx="${cx-poleGap/2}" cy="${poleBot}" r="2.5"
        fill="${dimmed ? "#94A3B8" : sc}" stroke="white" stroke-width="1.5"/>
      <circle cx="${cx+poleGap/2}" cy="${poleBot}" r="2.5"
        fill="${dimmed ? "#94A3B8" : sc}" stroke="white" stroke-width="1.5"/>
    </svg>`,
  });
}

function makeTerminalIcon(label) {
  const bg = label === "A" ? "#16A34A" : "#DC2626";
  const glow = label === "A" ? "rgba(22,163,74,0.50)" : "rgba(220,38,38,0.48)";
  return L.divIcon({
    className: "", iconSize: [34, 46], iconAnchor: [17, 46], popupAnchor: [0, -50],
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="46" viewBox="0 0 34 46">
      <ellipse cx="17" cy="43" rx="8" ry="3" fill="${glow}"/>
      <path d="M17 2C10.5 2 4.5 8 4.5 15c0 10.5 12.5 29 12.5 29S29.5 25.5 29.5 15C29.5 8 23.5 2 17 2z"
        fill="${bg}" stroke="white" stroke-width="2" filter="drop-shadow(0 3px 8px ${glow})"/>
      <circle cx="17" cy="15" r="9" fill="white"/>
      <text x="17" y="19.5" text-anchor="middle" font-size="11" font-weight="900"
        font-family="-apple-system,sans-serif" fill="${bg}">${label}</text>
    </svg>`,
  });
}

// ════════════════════════════════════════════════════════════════
// POPUP HTML
// ════════════════════════════════════════════════════════════════
function busPopupHtml(bus, route) {
  const eta = bus.etaToNextStop, c = etaColor(eta);
  const dir = bus.direction === "out" ? "→ Outbound" : "← Inbound";
  const dirBg = bus.direction === "out" ? "#EFF6FF" : "#FFF7ED";
  const dirColor = bus.direction === "out" ? "#2563EB" : "#EA580C";
  const cap = bus.capacityPct ?? 50;
  const capColor = cap > 80 ? "#DC2626" : cap > 50 ? "#F97316" : "#16A34A";
  const capLabel = cap > 80 ? "Full" : cap > 50 ? "Busy" : "Seats";

  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;width:230px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;
        padding-bottom:10px;border-bottom:1.5px solid #F1F5F9">
        <div style="width:38px;height:38px;border-radius:10px;background:${route?.color};
          display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <svg width="22" height="14" viewBox="0 0 48 30" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="6" width="40" height="14" rx="2" fill="white" fill-opacity="0.95"/>
            <circle cx="38" cy="22" r="4" fill="white" fill-opacity="0.7"/>
            <circle cx="10" cy="22" r="4" fill="white" fill-opacity="0.7"/>
          </svg>
        </div>
        <div style="flex:1">
          <div style="font-size:15px;font-weight:900;color:#0F172A">${bus.id}</div>
          <span style="display:inline-block;font-size:9px;font-weight:800;
            padding:2px 8px;border-radius:20px;background:${dirBg};color:${dirColor}">${dir}</span>
        </div>
        <div style="background:${c}15;border:1.5px solid ${c}35;border-radius:12px;
          padding:5px 10px;text-align:center">
          <div style="font-size:18px;font-weight:900;color:${c};line-height:1">${formatEta(eta)}</div>
          <div style="font-size:7px;color:#94A3B8;font-weight:700;text-transform:uppercase;margin-top:1px">ETA</div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px">
        <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:9px;padding:7px 8px">
          <div style="color:#94A3B8;font-size:7px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin-bottom:2px">Speed</div>
          <div style="font-size:15px;font-weight:800;color:#1E293B">${bus.speed}<span style="font-size:8px;color:#94A3B8"> km/h</span></div>
        </div>
        <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:9px;padding:7px 8px">
          <div style="color:#94A3B8;font-size:7px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin-bottom:2px">Km today</div>
          <div style="font-size:15px;font-weight:800;color:#1E293B">${bus.odometer ?? "—"}</div>
        </div>
      </div>
      <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:9px;padding:8px 10px;margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;margin-bottom:5px">
          <span style="font-size:8px;color:#64748B;font-weight:700;text-transform:uppercase">Passengers</span>
          <span style="font-size:11px;font-weight:800;color:${capColor}">${capLabel} · ${cap}%</span>
        </div>
        <div style="background:#E2E8F0;border-radius:4px;height:6px;overflow:hidden">
          <div style="width:${cap}%;height:100%;background:${capColor};border-radius:4px"></div>
        </div>
      </div>
      <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:9px;
        padding:7px 10px;display:flex;align-items:center;gap:6px">
        <div style="width:6px;height:6px;border-radius:50%;background:${route?.color};flex-shrink:0"></div>
        <span style="font-size:9px;color:#94A3B8;font-weight:600">Next:</span>
        <span style="font-size:11px;color:#1E293B;font-weight:700">${bus.targetStop ?? "—"}</span>
      </div>
    </div>`;
}

function stopPopupHtml(stop, route, isNearest, buses) {
  const c = route?.color ?? "#6B7280";
  const dir = stop.dir === "in" ? "← Return" : "→ Outbound";
  const rows = buses.length
    ? buses.slice(0, 3).map((b) => {
        const ec = etaColor(b.etaToNextStop);
        const cap = b.capacityPct ?? 50;
        return `<div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid #F1F5F9">
          <div style="width:28px;height:28px;border-radius:8px;background:${c};flex-shrink:0;
            display:flex;align-items:center;justify-content:center">
            <svg width="16" height="10" viewBox="0 0 48 30"><rect x="4" y="5" width="40" height="15" rx="2" fill="white" fill-opacity="0.9"/>
            <circle cx="38" cy="22" r="4" fill="white" fill-opacity="0.7"/><circle cx="10" cy="22" r="4" fill="white" fill-opacity="0.7"/></svg>
          </div>
          <div style="flex:1">
            <div style="font-size:11px;font-weight:800;color:#0F172A">${b.id}</div>
            <div style="font-size:9px;color:#94A3B8">${b.speed} km/h · ${cap}% full</div>
          </div>
          <div style="background:${ec}15;border:1px solid ${ec}30;border-radius:8px;
            padding:3px 8px;font-size:11px;font-weight:900;color:${ec}">${formatEta(b.etaToNextStop)}</div>
        </div>`;
      }).join("")
    : `<div style="color:#94A3B8;font-size:11px;padding:10px 0;text-align:center">No buses currently</div>`;

  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;width:230px">
      <div style="display:flex;align-items:flex-start;gap:9px;margin-bottom:10px;
        padding-bottom:9px;border-bottom:2px solid ${c}25">
        <div style="width:38px;height:38px;border-radius:10px;background:${c};flex-shrink:0;
          display:flex;align-items:center;justify-content:center">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <rect x="2" y="2" width="16" height="10" rx="2.5" fill="white" fill-opacity="0.92"/>
            <rect x="9" y="12" width="2" height="6" fill="white" fill-opacity="0.75"/>
            <rect x="5" y="17" width="10" height="1.5" rx=".75" fill="white" fill-opacity="0.5"/>
          </svg>
        </div>
        <div style="flex:1">
          <div style="font-size:14px;font-weight:900;color:#0F172A">
            ${stop.name}
            ${isNearest ? `<span style="margin-left:4px;font-size:7px;background:#FEF3C7;
              color:#D97706;padding:1px 6px;border-radius:6px;font-weight:800">⭐ NEAREST</span>` : ""}
          </div>
          <div style="margin-top:4px;display:flex;align-items:center;gap:5px">
            <span style="font-size:8.5px;background:${c};color:white;
              padding:1px 8px;border-radius:20px;font-weight:800">${route?.shortCode ?? "?"}</span>
            <span style="font-size:9px;color:${c};font-weight:700">${dir}</span>
          </div>
        </div>
      </div>
      <div style="font-size:8px;color:#94A3B8;font-weight:800;text-transform:uppercase;
        letter-spacing:.10em;margin-bottom:4px">Upcoming buses</div>
      ${rows}
    </div>`;
}

// ════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════
const BusMap = forwardRef(function BusMap({
  buses = [], allStops = [], userLocation, selectedStop,
  nearestStopId, onStopSelect, recenterTick = 0, goNearestTick = 0,
  showBuses = true, searchQuery = "", activeRouteId = null,
  mapStyle = "light",
}, ref) {
  const domRef      = useRef(null);
  const mapRef      = useRef(null);
  const tileRef     = useRef(null);
  const layerRoute  = useRef(null);
  const layerStop   = useRef(null);
  const layerBus    = useRef(null);
  const layerUser   = useRef(null);

  const zoomRef        = useRef(14);
  const stopMarkersRef = useRef({});
  const prevBusPos     = useRef({});
  // ④ GPS interpolation: store from/to + animation timestamps per bus
  const busAnimRef     = useRef({});
  const rafRef         = useRef(null);

  useImperativeHandle(ref, () => ({
    zoomIn:  () => mapRef.current?.zoomIn(),
    zoomOut: () => mapRef.current?.zoomOut(),
    flyTo:   (lat, lng, zoom = 16) =>
      mapRef.current?.flyTo([lat, lng], zoom, { animate: true, duration: 0.9 }),
  }));

  // ── Init map (ONCE) ────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current) return;
    const center = userLocation ? [userLocation.lat, userLocation.lng] : [-1.9441, 30.0619];

    mapRef.current = L.map(domRef.current, {
      center, zoom: 14,
      zoomControl: false, attributionControl: true,
      zoomAnimation: true, fadeAnimation: true, markerZoomAnimation: true,
    });

    const { url, opts } = TILE_LAYERS.light;
    tileRef.current = L.tileLayer(url, opts).addTo(mapRef.current);

    layerRoute.current = L.layerGroup().addTo(mapRef.current);
    layerStop.current  = L.layerGroup().addTo(mapRef.current);
    layerBus.current   = L.layerGroup().addTo(mapRef.current);
    layerUser.current  = L.layerGroup().addTo(mapRef.current);

    mapRef.current.on("zoomend", () => {
      zoomRef.current = mapRef.current.getZoom();
      _refreshStopLabels(zoomRef.current);
    });

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line

  // ── Swap tile layer when mapStyle changes ─────────────────
  useEffect(() => {
    if (!mapRef.current || !tileRef.current) return;
    mapRef.current.removeLayer(tileRef.current);
    const { url, opts } = TILE_LAYERS[mapStyle] ?? TILE_LAYERS.light;
    tileRef.current = L.tileLayer(url, opts).addTo(mapRef.current);
    // Push tile layer to bottom
    tileRef.current.bringToBack();
  }, [mapStyle]);

  // ── User location dot ─────────────────────────────────────
  useEffect(() => {
    if (!layerUser.current || !userLocation) return;
    layerUser.current.clearLayers();
    L.marker([userLocation.lat, userLocation.lng], {
      icon: makeUserIcon(), zIndexOffset: 3000,
    }).bindPopup("<b style=\"font-family:-apple-system,sans-serif;color:#1D4ED8\">📍 You are here</b>")
      .addTo(layerUser.current);
    mapRef.current?.flyTo([userLocation.lat, userLocation.lng], 14, { animate: true, duration: 1.0 });
  }, [userLocation]);

  useEffect(() => {
    if (!mapRef.current || !userLocation || recenterTick === 0) return;
    mapRef.current.flyTo([userLocation.lat, userLocation.lng], 14, { animate: true, duration: 0.9 });
  }, [recenterTick]); // eslint-disable-line

  useEffect(() => {
    if (!mapRef.current || !allStops.length || goNearestTick === 0) return;
    const s = allStops.find((s) => s.id === nearestStopId) ?? allStops[0];
    if (s) { mapRef.current.flyTo([s.lat, s.lng], 16, { animate: true, duration: 0.9 }); onStopSelect?.(s); }
  }, [goNearestTick]); // eslint-disable-line

  // ── ① ROAD LANES (hover bug fixed: use bindTooltip, not dynamic layers) ──
  useEffect(() => {
    if (!layerRoute.current) return;
    const draw = () => {
      mapRef.current?.invalidateSize({ animate: false });
      layerRoute.current.clearLayers();

      const routesToDraw = activeRouteId
        ? ROUTES.filter((r) => r.id === activeRouteId) : ROUTES;

      routesToDraw.forEach((route) => {
        const waypoints = ROUTE_WAYPOINTS[route.id];
        if (!waypoints || waypoints.length < 2) return;
        const isActive = activeRouteId === route.id;

        const roadW = isActive ? 22 : 16;
        const outW  = isActive ? 11 : 7;
        const innW  = isActive ? 8  : 5;

        const { out, inn } = buildLanes(waypoints, LANE_OFFSET_DEG);

        // Road bed
        L.polyline(waypoints, {
          color: darkenHex(route.color, 0.60), weight: roadW,
          opacity: isActive ? 0.55 : 0.38, lineJoin: "round", lineCap: "round", interactive: false,
        }).addTo(layerRoute.current);

        // Center divider
        L.polyline(waypoints, {
          color: "#FFFFFF", weight: 2, opacity: isActive ? 0.90 : 0.70,
          lineJoin: "round", lineCap: "round", interactive: false, dashArray: "6 5",
        }).addTo(layerRoute.current);

        // ① FIX: use bindTooltip (attached once, no accumulation)
        //    NOT: mouseover → create new tooltip layer each time
        const outLine = L.polyline(out, {
          color: route.color, weight: outW,
          opacity: isActive ? 0.92 : 0.74, lineJoin: "round", lineCap: "round",
        });

        // bindTooltip is the correct Leaflet way — creates ONE tooltip, shown on hover
        outLine.bindTooltip(`<b>${route.shortCode}</b> → Outbound`, {
          sticky: true, className: "kbus-tooltip", direction: "top",
        });

        outLine.on("mouseover", function() {
          this.setStyle({ weight: outW + 4, opacity: 1 });
        });
        outLine.on("mouseout", function() {
          this.setStyle({ weight: outW, opacity: isActive ? 0.92 : 0.74 });
        });

        outLine.bindPopup(`
          <div style="font-family:-apple-system,sans-serif;display:flex;align-items:center;gap:9px">
            <div style="width:26px;height:26px;border-radius:7px;background:${route.color};
              display:flex;align-items:center;justify-content:center">
              <span style="color:white;font-size:9px;font-weight:900">${route.shortCode}</span>
            </div>
            <div>
              <div style="font-size:13px;font-weight:800;color:#0F172A">${route.name}</div>
              <div style="font-size:9px;color:${route.color};font-weight:700;margin-top:1px">
                → Outbound · ${(OUTBOUND_STOPS[route.id] ?? []).length} stops</div>
            </div>
          </div>`, { className: "kbus-popup" });
        outLine.addTo(layerRoute.current);

        const retColor = lightenHex(route.color, 0.48);
        const innLine = L.polyline(inn, {
          color: retColor, weight: innW,
          opacity: isActive ? 0.82 : 0.60, lineJoin: "round", lineCap: "round",
        });

        // ① FIX same for inbound lane
        innLine.bindTooltip(`<b>${route.shortCode}</b> ← Return`, {
          sticky: true, className: "kbus-tooltip", direction: "top",
        });
        innLine.on("mouseover", function() { this.setStyle({ weight: innW + 3, opacity: 1 }); });
        innLine.on("mouseout",  function() { this.setStyle({ weight: innW, opacity: isActive ? 0.82 : 0.60 }); });
        innLine.addTo(layerRoute.current);

        if (activeRouteId === route.id) {
          const out0 = OUTBOUND_STOPS[route.id] ?? [];
          if (out0.length) {
            L.marker([out0[0].lat, out0[0].lng], { icon: makeTerminalIcon("A"), zIndexOffset: 700 })
              .bindPopup(`<b style="font-family:-apple-system,sans-serif;color:#16A34A;font-size:13px">🟢 ${out0[0].name}</b>`, { className: "kbus-popup" })
              .addTo(layerRoute.current);
            const last = out0[out0.length - 1];
            L.marker([last.lat, last.lng], { icon: makeTerminalIcon("B"), zIndexOffset: 700 })
              .bindPopup(`<b style="font-family:-apple-system,sans-serif;color:#DC2626;font-size:13px">🔴 ${last.name}</b>`, { className: "kbus-popup" })
              .addTo(layerRoute.current);
          }
        }
      });

      if (activeRouteId) {
        const wp = ROUTE_WAYPOINTS[activeRouteId] ?? [];
        if (wp.length)
          mapRef.current?.fitBounds(L.latLngBounds(wp), { padding: [80, 80], animate: true, maxZoom: 16 });
      }
    };

    const tid = setTimeout(() => requestAnimationFrame(draw), 150);
    return () => clearTimeout(tid);
  }, [activeRouteId]); // eslint-disable-line

  // ── Stop markers ─────────────────────────────────────────
  useEffect(() => {
    if (!layerStop.current) return;
    layerStop.current.clearLayers();
    stopMarkersRef.current = {};

    const q = searchQuery.toLowerCase();
    const mode = getLabelMode(zoomRef.current);
    const outStops = activeRouteId ? (OUTBOUND_STOPS[activeRouteId] ?? []) : Object.values(OUTBOUND_STOPS).flat();
    const inStops  = activeRouteId ? (INBOUND_STOPS[activeRouteId]  ?? []) : Object.values(INBOUND_STOPS).flat();

    const skipIds = new Set();
    if (activeRouteId) {
      const o = OUTBOUND_STOPS[activeRouteId] ?? [], ii = INBOUND_STOPS[activeRouteId] ?? [];
      if (o.length) { skipIds.add(o[0].id); skipIds.add(o[o.length-1].id); }
      if (ii.length) { skipIds.add(ii[0].id); skipIds.add(ii[ii.length-1].id); }
    }

    [...outStops, ...inStops].forEach((stop) => {
      if (skipIds.has(stop.id)) return;
      const isSelected = stop.id === selectedStop?.id;
      const isNearest  = stop.id === nearestStopId;
      const dimmed     = q.length > 0 && !stop.name.toLowerCase().includes(q);
      const route      = ROUTES.find((r) => r.id === stop.routeId);
      const routeBuses = buses.filter((b) => b.routeId === stop.routeId)
        .sort((a, b) => a.etaToNextStop - b.etaToNextStop);

      const marker = L.marker([stop.lat, stop.lng], {
        icon: makeStopIcon(route?.color ?? "#64748B", stop.name, isSelected, isNearest, dimmed, mode, stop.dir),
        zIndexOffset: isSelected ? 1500 : isNearest ? 1200 : 0,
        opacity: dimmed ? 0.35 : 1,
      });
      marker.bindPopup(stopPopupHtml(stop, route, isNearest, routeBuses), { maxWidth: 260, className: "kbus-popup" });
      marker.on("click", () => onStopSelect?.(stop));
      marker.addTo(layerStop.current);
      stopMarkersRef.current[stop.id] = { marker, stop, route, isSelected, isNearest, dimmed };
    });
  }, [allStops, selectedStop, nearestStopId, searchQuery, activeRouteId, buses, onStopSelect]);

  function _refreshStopLabels(zoom) {
    const mode = getLabelMode(zoom);
    Object.values(stopMarkersRef.current).forEach(({ marker, stop, route, isSelected, isNearest, dimmed }) => {
      marker.setIcon(makeStopIcon(route?.color ?? "#64748B", stop.name, isSelected, isNearest, dimmed, mode, stop.dir));
    });
  }

  // ── ④ GPS-LIKE BUS MOVEMENT ────────────────────────────────
  // When new bus positions arrive (every 2.5s), we store them
  // as animation targets and interpolate continuously via rAF.
  // This gives buttery smooth movement between data ticks.
  useEffect(() => {
    if (!layerBus.current) return;
    if (!showBuses) { layerBus.current.clearLayers(); busAnimRef.current = {}; return; }

    const visibleBuses = activeRouteId ? buses.filter((b) => b.routeId === activeRouteId) : buses;

    // Ensure markers exist for all visible buses
    const existing = {};
    layerBus.current.eachLayer((l) => { if (l._busId) existing[l._busId] = l; });

    visibleBuses.forEach((bus) => {
      const route = ROUTES.find((r) => r.id === bus.routeId);
      const color = route?.color ?? "#F97316";
      const wps   = ROUTE_WAYPOINTS[bus.routeId] ?? [];
      const eta   = bus.etaToNextStop ?? null;

      // Snap to lane
      const { out: outLane, inn: innLane } = buildLanes(wps, LANE_OFFSET_DEG);
      const laneCoords = bus.direction === "out" ? outLane : [...innLane].reverse();
      const target = laneCoords.length > 1
        ? snapToPolyline(bus.lat, bus.lng, laneCoords, "out")
        : { lat: bus.lat, lng: bus.lng };

      if (!existing[bus.id]) {
        // Create new marker
        const m = L.marker([target.lat, target.lng], {
          icon: makeRealBusIcon(color, bus.direction, eta),
          zIndexOffset: 1000,
        });
        m._busId = bus.id;
        m.bindPopup(busPopupHtml(bus, route), { maxWidth: 260, className: "kbus-popup" });
        m.addTo(layerBus.current);
        // Seed animation state
        busAnimRef.current[bus.id] = {
          marker: m, fromLat: target.lat, fromLng: target.lng,
          toLat: target.lat, toLng: target.lng,
          t: 1, color, direction: bus.direction, eta, route,
        };
      } else {
        // Update animation target (from current animated position → new data point)
        const m = existing[bus.id];
        const cur = m.getLatLng();
        busAnimRef.current[bus.id] = {
          marker: m,
          fromLat: cur.lat, fromLng: cur.lng,
          toLat: target.lat, toLng: target.lng,
          t: 0,  // restart interpolation
          color, direction: bus.direction, eta, route,
        };
        m.setIcon(makeRealBusIcon(color, bus.direction, eta));
        m.setPopupContent(busPopupHtml(bus, route));
        delete existing[bus.id];
      }
      prevBusPos.current[bus.id] = { lat: bus.lat, lng: bus.lng };
    });

    // Remove buses no longer visible
    Object.values(existing).forEach((m) => {
      layerBus.current.removeLayer(m);
      if (m._busId) delete busAnimRef.current[m._busId];
    });
  }, [buses, showBuses, activeRouteId]); // eslint-disable-line

  // Continuous rAF loop — interpolates bus positions every frame
  useEffect(() => {
    let prev = performance.now();

    const animate = (now) => {
      const dt = Math.min((now - prev) / 2500, 1); // normalize to 2.5s window
      prev = now;

      Object.values(busAnimRef.current).forEach((anim) => {
        if (anim.t >= 1) return;
        anim.t = Math.min(anim.t + dt, 1);
        const e = easeOutCubic(anim.t);
        const lat = anim.fromLat + (anim.toLat - anim.fromLat) * e;
        const lng = anim.fromLng + (anim.toLng - anim.fromLng) * e;
        if (anim.marker?._map) {
          anim.marker.setLatLng([lat, lng]);
        }
      });

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []); // only run once

  // ── Render ─────────────────────────────────────────────────
  return (
    <>
      <style>{`
        .map-tile-layer-light  { filter: brightness(1.02) saturate(0.90) contrast(0.97); }
        .map-tile-layer-dark   { filter: brightness(1.0) saturate(1.0); }
        .map-tile-layer-sat    { filter: brightness(1.05) saturate(1.05); }
        .leaflet-tile { transition: opacity 0.18s ease !important; }
        .leaflet-zoom-anim .leaflet-zoom-animated {
          transition: transform 0.24s cubic-bezier(.25,.46,.45,.94) !important;
        }
        .kbus-tooltip {
          background: rgba(15,23,42,0.92) !important;
          border: none !important; border-radius: 8px !important;
          font-size: 11px !important; font-family: -apple-system,sans-serif !important;
          color: #F1F5F9 !important; padding: 5px 11px !important; font-weight: 700 !important;
          box-shadow: 0 4px 14px rgba(0,0,0,0.24) !important;
        }
        .kbus-tooltip::before { display: none !important; }
        .kbus-popup .leaflet-popup-content-wrapper {
          border-radius: 16px !important; padding: 0 !important; overflow: hidden;
          box-shadow: 0 10px 32px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.06) !important;
          border: 1px solid rgba(0,0,0,0.06) !important;
        }
        .kbus-popup .leaflet-popup-content { margin: 14px 14px !important; }
        .kbus-popup .leaflet-popup-tip { box-shadow: none !important; }
        .kbus-popup .leaflet-popup-close-button {
          top: 10px !important; right: 10px !important;
          font-size: 16px !important; color: #94A3B8 !important;
        }
        .leaflet-marker-icon { transition: opacity 0.15s ease; }
        * { -webkit-tap-highlight-color: transparent; }
      `}</style>
      <div ref={domRef} className="absolute inset-0" style={{ zIndex: 0 }} />
    </>
  );
});

export default BusMap;
