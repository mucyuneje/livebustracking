/**
 * BusMap.jsx — Full-screen Leaflet map, Google Maps quality.
 *
 * What's on the map (nothing else):
 *  1. Light OSM tile layer — clean, bright, readable
 *  2. Route polylines — thick, colored, one per route
 *  3. Fixed bus stop markers — along each route
 *  4. Live bus markers — animated, with direction bearing
 *  5. User location — pulsing blue dot
 *  6. Start (A) / End (B) terminal markers per route
 *
 * No supermarkets, no OSM POI clutter — just transit layer.
 */

import React, {
  useEffect, useRef, forwardRef, useImperativeHandle,
} from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { formatEta, etaColor, buildRoutePolyline, calcBearing, easeOutCubic } from "../utils/utils";
import { ROUTES, STOPS_BY_ROUTE } from "../api/mockData";

// ═══════════════════════════════════════════════════════════════
//  ICON FACTORIES
// ═══════════════════════════════════════════════════════════════

/** Blue pulsing dot — user location */
function makeUserIcon() {
  return L.divIcon({
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
      <circle cx="14" cy="14" r="14" fill="#2563EB" fill-opacity="0">
        <animate attributeName="r" values="9;20" dur="2.4s" repeatCount="indefinite"/>
        <animate attributeName="fill-opacity" values="0.22;0" dur="2.4s" repeatCount="indefinite"/>
      </circle>
      <circle cx="14" cy="14" r="10" fill="white" filter="drop-shadow(0 1px 4px rgba(37,99,235,0.35))"/>
      <circle cx="14" cy="14" r="7" fill="#2563EB"/>
      <circle cx="11.5" cy="11.5" r="2.2" fill="white" fill-opacity="0.45"/>
    </svg>`,
  });
}

/**
 * Live bus icon — solid circle, route color, bearing arrow.
 * @param {string} color   - Route hex color
 * @param {number} bearing - Direction 0–360
 */
function makeBusIcon(color, bearing = 0) {
  return L.divIcon({
    className: "",
    iconSize: [46, 46],
    iconAnchor: [23, 23],
    popupAnchor: [0, -28],
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="46" height="46" viewBox="0 0 46 46">
      <!-- Shadow -->
      <ellipse cx="23" cy="27" rx="11" ry="5" fill="rgba(0,0,0,0.18)"/>
      <!-- White ring -->
      <circle cx="23" cy="22" r="16" fill="white" filter="drop-shadow(0 2px 6px rgba(0,0,0,0.20))"/>
      <!-- Colored fill -->
      <circle cx="23" cy="22" r="14" fill="${color}"/>
      <!-- Bus shape -->
      <rect x="15.5" y="14" width="15" height="11" rx="2.5" fill="white" fill-opacity="0.95"/>
      <rect x="17.5" y="15.5" width="4.5" height="3.5" rx="1" fill="${color}"/>
      <rect x="24" y="15.5" width="4.5" height="3.5" rx="1" fill="${color}"/>
      <line x1="15.5" y1="23" x2="30.5" y2="23" stroke="${color}" stroke-width="1.2" opacity="0.5"/>
      <circle cx="19" cy="27" r="2" fill="white" fill-opacity="0.9"/>
      <circle cx="27" cy="27" r="2" fill="white" fill-opacity="0.9"/>
      <!-- Direction triangle -->
      <g transform="translate(23,22) rotate(${bearing}) translate(-23,-22)">
        <polygon points="23,7 27,14 19,14" fill="white" fill-opacity="0.88"/>
      </g>
    </svg>`,
  });
}

/**
 * Bus stop teardrop — route color, fixed position.
 * @param {string}  color      - Route hex color
 * @param {boolean} isSelected - Enlarged + highlighted
 * @param {boolean} isNearest  - Amber highlight
 * @param {boolean} dimmed     - Grayed out (search filter)
 */
function makeStopIcon(color, isSelected = false, isNearest = false, dimmed = false) {
  const fill   = dimmed     ? "#CBD5E1"
               : isSelected ? "#F97316"
               : isNearest  ? "#F59E0B"
               : color;
  const size   = isSelected ? 34 : isNearest ? 30 : 26;
  const h      = Math.round(size * 1.4);
  const glow   = isSelected
    ? `<circle cx="${size/2}" cy="${h-3}" r="${size*0.35}" fill="${fill}" fill-opacity="0.22"/>`
    : "";
  return L.divIcon({
    className: "",
    iconSize:   [size, h],
    iconAnchor: [size / 2, h],
    popupAnchor:[0, -h - 2],
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${h}"
        viewBox="0 0 34 48">
      ${glow}
      <path d="M17 2C10.4 2 5 7.4 5 14c0 10.2 12 32 12 32S29 24.2 29 14C29 7.4 23.6 2 17 2z"
        fill="${fill}" stroke="white" stroke-width="2.5"
        filter="drop-shadow(0 2px 5px rgba(0,0,0,0.22))"/>
      <circle cx="17" cy="14" r="6.5" fill="white" fill-opacity="${dimmed ? 0.5 : 1}"/>
      ${!dimmed ? `<text x="17" y="18.2" text-anchor="middle" font-size="8" font-weight="800"
        font-family="system-ui,sans-serif" fill="${fill}">S</text>` : ""}
    </svg>`,
  });
}

/** Green terminal A marker (route start) */
function makeStartIcon() {
  return L.divIcon({
    className: "",
    iconSize: [36, 50],
    iconAnchor: [18, 50],
    popupAnchor: [0, -54],
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="50" viewBox="0 0 36 50">
      <path d="M18 2C11 2 5 8 5 15c0 11 13 33 13 33S31 26 31 15C31 8 25 2 18 2z"
        fill="#16A34A" stroke="white" stroke-width="2.5"
        filter="drop-shadow(0 3px 7px rgba(22,163,74,0.45))"/>
      <circle cx="18" cy="15" r="8" fill="white"/>
      <text x="18" y="19.5" text-anchor="middle" font-size="10" font-weight="900"
        font-family="system-ui,sans-serif" fill="#16A34A">A</text>
    </svg>`,
  });
}

/** Red terminal B marker (route end) */
function makeEndIcon() {
  return L.divIcon({
    className: "",
    iconSize: [36, 50],
    iconAnchor: [18, 50],
    popupAnchor: [0, -54],
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="50" viewBox="0 0 36 50">
      <path d="M18 2C11 2 5 8 5 15c0 11 13 33 13 33S31 26 31 15C31 8 25 2 18 2z"
        fill="#DC2626" stroke="white" stroke-width="2.5"
        filter="drop-shadow(0 3px 7px rgba(220,38,38,0.45))"/>
      <circle cx="18" cy="15" r="8" fill="white"/>
      <text x="18" y="19.5" text-anchor="middle" font-size="10" font-weight="900"
        font-family="system-ui,sans-serif" fill="#DC2626">B</text>
    </svg>`,
  });
}

// ═══════════════════════════════════════════════════════════════
//  POPUP BUILDERS (white card, clean typography)
// ═══════════════════════════════════════════════════════════════

function busPopupHtml(bus, route) {
  const eta = bus.etaToNextStop;
  const c   = etaColor(eta);
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;width:210px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
        <div style="width:10px;height:10px;border-radius:50%;background:${route?.color};flex-shrink:0"></div>
        <b style="font-size:15px;color:#111827;letter-spacing:-0.01em">${bus.id}</b>
        <span style="margin-left:auto;font-size:10px;color:#6B7280;background:#F3F4F6;
          padding:2px 8px;border-radius:20px;font-weight:600">${bus.shortCode ?? route?.shortCode ?? ""}</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">
        <div style="background:#F9FAFB;border-radius:10px;padding:9px 10px">
          <div style="color:#9CA3AF;font-size:9px;font-weight:700;text-transform:uppercase;
            letter-spacing:.07em;margin-bottom:3px">Speed</div>
          <div style="font-size:17px;font-weight:800;color:#111827">
            ${bus.speed}<span style="font-size:10px;font-weight:500;color:#9CA3AF"> km/h</span></div>
        </div>
        <div style="background:#F9FAFB;border-radius:10px;padding:9px 10px">
          <div style="color:#9CA3AF;font-size:9px;font-weight:700;text-transform:uppercase;
            letter-spacing:.07em;margin-bottom:3px">ETA</div>
          <div style="font-size:17px;font-weight:900;color:${c}">${formatEta(eta)}</div>
        </div>
      </div>
      <div style="font-size:11px;color:#9CA3AF;border-top:1px solid #F3F4F6;padding-top:7px">
        Next stop: <span style="color:#374151;font-weight:600">${bus.targetStop ?? "—"}</span>
      </div>
    </div>`;
}

function stopPopupHtml(stop, route, isNearest, nearbyBuses) {
  const c = route?.color ?? "#6B7280";
  const rows = nearbyBuses.length
    ? nearbyBuses.slice(0, 3).map((b) => `
        <div style="display:flex;justify-content:space-between;align-items:center;
          padding:6px 0;border-bottom:1px solid #F3F4F6">
          <span style="font-size:12px;color:#374151;font-weight:600">${b.id}</span>
          <span style="font-size:12px;font-weight:800;color:${etaColor(b.etaToNextStop)}">
            ${formatEta(b.etaToNextStop)}</span>
        </div>`).join("")
    : `<div style="color:#9CA3AF;font-size:11px;padding:6px 0">No buses tracked</div>`;

  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;width:210px">
      <div style="margin-bottom:10px">
        <div style="display:flex;align-items:center;gap:7px;margin-bottom:4px">
          <div style="width:10px;height:10px;border-radius:50%;background:${c};flex-shrink:0"></div>
          <b style="font-size:14px;color:#111827">${stop.name}</b>
        </div>
        <div style="display:flex;align-items:center;gap:6px">
          <span style="font-size:11px;color:#6B7280">${route?.name ?? "Bus Stop"}</span>
          ${isNearest
            ? `<span style="font-size:10px;background:#FEF3C7;color:#D97706;
                padding:1px 8px;border-radius:20px;font-weight:700">⭐ Nearest</span>` : ""}
        </div>
      </div>
      <div style="font-size:9px;color:#9CA3AF;font-weight:700;text-transform:uppercase;
        letter-spacing:.07em;margin-bottom:5px">Upcoming buses</div>
      ${rows}
    </div>`;
}

// ═══════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

const BusMap = forwardRef(function BusMap(
  {
    buses         = [],
    allStops      = [],
    userLocation,
    selectedStop,
    nearestStopId,
    onStopSelect,
    recenterTick  = 0,
    goNearestTick = 0,
    showBuses     = true,
    searchQuery   = "",
    activeRouteId = null,
  },
  ref
) {
  const domRef      = useRef(null);
  const mapRef      = useRef(null);
  const layerRoute  = useRef(null);  // polylines + terminals
  const layerStop   = useRef(null);  // stop markers
  const layerBus    = useRef(null);  // live bus markers
  const layerUser   = useRef(null);  // user dot
  const prevBusPos  = useRef({});    // for bearing calc
  const animFrames  = useRef({});    // rAF handles

  useImperativeHandle(ref, () => ({
    zoomIn:  () => mapRef.current?.zoomIn(),
    zoomOut: () => mapRef.current?.zoomOut(),
    flyTo:   (lat, lng, zoom = 16) =>
      mapRef.current?.flyTo([lat, lng], zoom, { animate: true, duration: 0.9 }),
  }));

  // ── Init map once ─────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current) return;

    const center = userLocation
      ? [userLocation.lat, userLocation.lng]
      : [-1.9441, 30.0619];

    mapRef.current = L.map(domRef.current, {
      center,
      zoom: 14,
      zoomControl: false,
      attributionControl: true,
    });

    // Light OSM tiles — clean, no POI clutter
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
      className: "map-tiles-light",
    }).addTo(mapRef.current);

    // Layer stack: routes → stops → buses → user (top)
    layerRoute.current = L.layerGroup().addTo(mapRef.current);
    layerStop.current  = L.layerGroup().addTo(mapRef.current);
    layerBus.current   = L.layerGroup().addTo(mapRef.current);
    layerUser.current  = L.layerGroup().addTo(mapRef.current);

    return () => {
      Object.values(animFrames.current).forEach(cancelAnimationFrame);
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── User location dot ────────────────────────────────────
  useEffect(() => {
    if (!layerUser.current || !userLocation) return;
    layerUser.current.clearLayers();
    L.marker([userLocation.lat, userLocation.lng], {
      icon: makeUserIcon(),
      zIndexOffset: 3000,
    })
      .bindPopup(
        `<div style="font-family:-apple-system,sans-serif;font-weight:700;
          font-size:13px;color:#1D4ED8;padding:2px 0">📍 You are here</div>`
      )
      .addTo(layerUser.current);
    mapRef.current?.flyTo([userLocation.lat, userLocation.lng], 14, {
      animate: true, duration: 1.0,
    });
  }, [userLocation]);

  // ── Recenter ──────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !userLocation || recenterTick === 0) return;
    mapRef.current.flyTo([userLocation.lat, userLocation.lng], 14, {
      animate: true, duration: 0.9,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recenterTick]);

  // ── Go to nearest stop ───────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !allStops.length || goNearestTick === 0) return;
    const s = allStops.find((s) => s.id === nearestStopId) ?? allStops[0];
    if (s) {
      mapRef.current.flyTo([s.lat, s.lng], 16, { animate: true, duration: 0.9 });
      onStopSelect?.(s);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goNearestTick]);

  // ── Route polylines + terminal markers ───────────────────
  useEffect(() => {
    if (!layerRoute.current) return;
    layerRoute.current.clearLayers();

    const routesToShow = activeRouteId
      ? ROUTES.filter((r) => r.id === activeRouteId)
      : ROUTES;

    routesToShow.forEach((route) => {
      const stops = STOPS_BY_ROUTE[route.id];
      if (!stops || stops.length < 2) return;

      const coords = buildRoutePolyline(stops);

      // White casing underneath for depth
      L.polyline(coords, {
        color:       "white",
        weight:      14,
        opacity:     0.9,
        lineJoin:    "round",
        lineCap:     "round",
        interactive: false,
      }).addTo(layerRoute.current);

      // Colored route line — thick and easy to read
      const line = L.polyline(coords, {
        color:    route.color,
        weight:   8,
        opacity:  0.88,
        lineJoin: "round",
        lineCap:  "round",
      });

      line.bindPopup(
        `<div style="font-family:-apple-system,sans-serif;padding:2px 0">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
            <div style="width:28px;height:5px;border-radius:3px;background:${route.color}"></div>
            <b style="color:#111827;font-size:13px">${route.name}</b>
          </div>
          <div style="color:#6B7280;font-size:11px">${stops.length} stops · ${route.shortCode}</div>
        </div>`,
        { className: "kbus-popup" }
      );
      line.addTo(layerRoute.current);

      // Start terminal A
      L.marker([stops[0].lat, stops[0].lng], { icon: makeStartIcon(), zIndexOffset: 600 })
        .bindPopup(
          `<div style="font-family:-apple-system,sans-serif;padding:2px 0">
            <b style="color:#16A34A;font-size:13px">🟢 Start Terminal</b>
            <div style="color:#374151;font-size:12px;margin-top:4px">${stops[0].name}</div>
            <div style="color:#9CA3AF;font-size:11px">${route.name}</div>
          </div>`,
          { className: "kbus-popup" }
        )
        .addTo(layerRoute.current);

      // End terminal B
      const last = stops[stops.length - 1];
      L.marker([last.lat, last.lng], { icon: makeEndIcon(), zIndexOffset: 600 })
        .bindPopup(
          `<div style="font-family:-apple-system,sans-serif;padding:2px 0">
            <b style="color:#DC2626;font-size:13px">🔴 End Terminal</b>
            <div style="color:#374151;font-size:12px;margin-top:4px">${last.name}</div>
            <div style="color:#9CA3AF;font-size:11px">${route.name}</div>
          </div>`,
          { className: "kbus-popup" }
        )
        .addTo(layerRoute.current);
    });
  }, [activeRouteId]);

  // ── Stop markers ─────────────────────────────────────────
  useEffect(() => {
    if (!layerStop.current) return;
    layerStop.current.clearLayers();

    const q = searchQuery.toLowerCase();

    // Show ALL fixed stops for the active route (or all routes)
    const stopsToShow = activeRouteId
      ? (STOPS_BY_ROUTE[activeRouteId] ?? [])
      : Object.values(STOPS_BY_ROUTE).flat();

    stopsToShow.forEach((stop) => {
      const isSelected = stop.id === selectedStop?.id;
      const isNearest  = stop.id === nearestStopId;
      const dimmed     = q.length > 0 && !stop.name.toLowerCase().includes(q);
      const route      = ROUTES.find((r) => r.id === stop.routeId);

      // Buses on this stop's route, for popup
      const routeBuses = buses
        .filter((b) => b.routeId === stop.routeId)
        .sort((a, b) => a.etaToNextStop - b.etaToNextStop);

      const marker = L.marker([stop.lat, stop.lng], {
        icon:        makeStopIcon(route?.color ?? "#64748B", isSelected, isNearest, dimmed),
        zIndexOffset: isSelected ? 1500 : isNearest ? 1200 : 0,
        opacity:     dimmed ? 0.3 : 1,
      });

      marker.bindPopup(stopPopupHtml(stop, route, isNearest, routeBuses), {
        maxWidth: 240,
        className: "kbus-popup",
      });
      marker.on("click", () => onStopSelect?.(stop));
      marker.addTo(layerStop.current);
    });
  }, [allStops, selectedStop, nearestStopId, searchQuery, activeRouteId, buses, onStopSelect]);

  // ── Live bus markers — smooth animation ─────────────────
  useEffect(() => {
    if (!layerBus.current) return;
    if (!showBuses) { layerBus.current.clearLayers(); return; }

    // Collect existing markers keyed by bus ID
    const existing = {};
    layerBus.current.eachLayer((layer) => {
      if (layer._busId) existing[layer._busId] = layer;
    });

    buses.forEach((bus) => {
      const route   = ROUTES.find((r) => r.id === bus.routeId);
      const color   = route?.color ?? "#F97316";
      const prev    = prevBusPos.current[bus.id];
      const bearing = prev
        ? calcBearing(prev.lat, prev.lng, bus.lat, bus.lng)
        : 0;

      if (existing[bus.id]) {
        // Smooth interpolated move
        const m       = existing[bus.id];
        const fromPos = m.getLatLng();
        const toPos   = L.latLng(bus.lat, bus.lng);
        const t0      = performance.now();
        const dur     = 900;

        if (animFrames.current[bus.id]) {
          cancelAnimationFrame(animFrames.current[bus.id]);
        }
        function step(now) {
          const progress = Math.min((now - t0) / dur, 1);
          const eased    = easeOutCubic(progress);
          m.setLatLng([
            fromPos.lat + (toPos.lat - fromPos.lat) * eased,
            fromPos.lng + (toPos.lng - fromPos.lng) * eased,
          ]);
          if (progress < 1) animFrames.current[bus.id] = requestAnimationFrame(step);
        }
        animFrames.current[bus.id] = requestAnimationFrame(step);

        m.setIcon(makeBusIcon(color, bearing));
        m.setPopupContent(busPopupHtml(bus, route));
        delete existing[bus.id];
      } else {
        // New bus marker
        const m = L.marker([bus.lat, bus.lng], {
          icon: makeBusIcon(color, bearing),
          zIndexOffset: 1000,
        });
        m._busId = bus.id;
        m.bindPopup(busPopupHtml(bus, route), {
          maxWidth: 240,
          className: "kbus-popup",
        });
        m.addTo(layerBus.current);
      }

      prevBusPos.current[bus.id] = { lat: bus.lat, lng: bus.lng };
    });

    // Remove stale markers
    Object.values(existing).forEach((m) => layerBus.current.removeLayer(m));
  }, [buses, showBuses]);

  return <div ref={domRef} className="absolute inset-0" style={{ zIndex: 0 }} />;
});

export default BusMap;
