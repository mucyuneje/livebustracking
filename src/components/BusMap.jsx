/**
 * BusMap.jsx v4 --- Full-screen Leaflet map
 * Key upgrades:
 * - Route filtering: active route shows ONLY its polyline, stops, buses
 * - Stop name labels always visible (no click needed)
 * - Big A/B terminal markers with route name labels
 * - Smooth frame-by-frame bus animation
 */

import React, { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { formatEta, etaColor, buildRoutePolyline, calcBearing, easeOutCubic } from "../utils/utils";
import { ROUTES, STOPS_BY_ROUTE } from "../api/mockData";

// ============================================================================
// ICON CREATORS
// ============================================================================

function makeUserIcon() {
  return L.divIcon({
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    html: `
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="16" fill="#2563EB" fill-opacity="0">
          <animate attributeName="r" values="10;22" dur="2.2s" repeatCount="indefinite"/>
          <animate attributeName="fill-opacity" values="0.20;0" dur="2.2s" repeatCount="indefinite"/>
        </circle>
        <circle cx="16" cy="16" r="11" fill="white" filter="drop-shadow(0 2px 6px rgba(37,99,235,0.40))"/>
        <circle cx="16" cy="16" r="7.5" fill="#2563EB"/>
        <circle cx="13.5" cy="13.5" r="2.5" fill="white" fill-opacity="0.42"/>
      </svg>
    `,
  });
}

function makeBusIcon(color, bearing = 0) {
  return L.divIcon({
    className: "",
    iconSize: [48, 48],
    iconAnchor: [24, 24],
    popupAnchor: [0, -30],
    html: `
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
        <ellipse cx="24" cy="29" rx="12" ry="5" fill="rgba(0,0,0,0.16)"/>
        <circle cx="24" cy="23" r="17" fill="white" filter="drop-shadow(0 2px 8px rgba(0,0,0,0.22))"/>
        <circle cx="24" cy="23" r="15" fill="${color}"/>
        <rect x="16" y="14" width="16" height="12" rx="2.5" fill="white" fill-opacity="0.95"/>
        <rect x="18" y="15.5" width="5" height="4" rx="1" fill="${color}"/>
        <rect x="25" y="15.5" width="5" height="4" rx="1" fill="${color}"/>
        <line x1="16" y1="25" x2="32" y2="25" stroke="${color}" stroke-width="1.2" opacity="0.4"/>
        <circle cx="20" cy="28.5" r="2" fill="white" fill-opacity="0.85"/>
        <circle cx="28" cy="28.5" r="2" fill="white" fill-opacity="0.85"/>
        <g transform="translate(24,23) rotate(${bearing}) translate(-24,-23)">
          <polygon points="24,7 28,15 20,15" fill="white" fill-opacity="0.9"/>
        </g>
      </svg>
    `,
  });
}

function makeStopIcon(color, name = "", isSelected = false, isNearest = false, dimmed = false) {
  const fill = dimmed ? "#CBD5E1" : isSelected ? "#F97316" : isNearest ? "#F59E0B" : color;
  const pinSize = isSelected ? 32 : isNearest ? 28 : 24;
  const pinH = Math.round(pinSize * 1.45);
  const label = name.length > 15 ? name.slice(0, 14) + "..." : name;
  const labelW = Math.max(label.length * 6.2 + 16, 60);
  const totalH = pinH + 22;

  return L.divIcon({
    className: "",
    iconSize: [labelW, totalH],
    iconAnchor: [labelW / 2, pinH],
    popupAnchor: [0, -(pinH + 6)],
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;width:${labelW}px">
        <svg xmlns="http://www.w3.org/2000/svg" width="${pinSize}" height="${pinH}" viewBox="0 0 34 50">
          <path d="M17 2C10.4 2 5 7.4 5 14c0 10.2 12 32 12 32S29 24.2 29 14C29 7.4 23.6 2 17 2z"
            fill="${fill}" stroke="white" stroke-width="2.5"
            filter="drop-shadow(0 2px 6px rgba(0,0,0,0.25))"/>
          <circle cx="17" cy="14" r="7" fill="white" fill-opacity="${dimmed ? 0.5 : 1}"/>
          <text x="17" y="17.5" text-anchor="middle" font-size="9" font-weight="900"
            font-family="-apple-system,sans-serif" fill="${fill}">S</text>
        </svg>
        <div style="
          margin-top:2px;
          background:${dimmed ? "rgba(203,213,225,0.9)" : "rgba(255,255,255,0.96)"};
          border:1px solid ${dimmed ? "#CBD5E1" : isSelected ? fill + "55" : "rgba(0,0,0,0.10)"};
          border-radius:6px;padding:1px 5px;font-size:9px;
          font-weight:${isSelected ? "800" : "600"};
          font-family:-apple-system,sans-serif;
          color:${dimmed ? "#94A3B8" : isSelected ? fill : "#374151"};
          white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.10);
          letter-spacing:-0.01em;pointer-events:none;
        ">${label}</div>
      </div>
    `,
  });
}

function makeStartIcon(routeName = "") {
  const short = routeName.split("--")[0]?.trim().slice(0, 12) ?? "";
  return L.divIcon({
    className: "",
    iconSize: [84, 74],
    iconAnchor: [42, 58],
    popupAnchor: [0, -62],
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;width:84px">
        <svg xmlns="http://www.w3.org/2000/svg" width="44" height="58" viewBox="0 0 44 58">
          <ellipse cx="22" cy="54" rx="10" ry="4" fill="rgba(22,163,74,0.22)"/>
          <path d="M22 2C14 2 7 9 7 17c0 13 15 39 15 39S37 30 37 17C37 9 30 2 22 2z"
            fill="#16A34A" stroke="white" stroke-width="2.5"
            filter="drop-shadow(0 3px 10px rgba(22,163,74,0.50))"/>
          <circle cx="22" cy="17" r="10" fill="white"/>
          <text x="22" y="21.5" text-anchor="middle" font-size="12" font-weight="900"
            font-family="-apple-system,sans-serif" fill="#16A34A">A</text>
        </svg>
        <div style="background:rgba(22,163,74,0.12);border:1.5px solid rgba(22,163,74,0.40);
          border-radius:8px;padding:2px 7px;font-size:9px;font-weight:800;
          font-family:-apple-system,sans-serif;color:#15803D;white-space:nowrap;
          box-shadow:0 2px 6px rgba(22,163,74,0.18);pointer-events:none;
        ">🟢 START · ${short}</div>
      </div>
    `,
  });
}

function makeEndIcon(routeName = "") {
  const parts = routeName.split("--");
  const short = parts[parts.length - 1]?.trim().slice(0, 12) ?? "";
  return L.divIcon({
    className: "",
    iconSize: [84, 74],
    iconAnchor: [42, 58],
    popupAnchor: [0, -62],
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;width:84px">
        <svg xmlns="http://www.w3.org/2000/svg" width="44" height="58" viewBox="0 0 44 58">
          <ellipse cx="22" cy="54" rx="10" ry="4" fill="rgba(220,38,38,0.20)"/>
          <path d="M22 2C14 2 7 9 7 17c0 13 15 39 15 39S37 30 37 17C37 9 30 2 22 2z"
            fill="#DC2626" stroke="white" stroke-width="2.5"
            filter="drop-shadow(0 3px 10px rgba(220,38,38,0.48))"/>
          <circle cx="22" cy="17" r="10" fill="white"/>
          <text x="22" y="21.5" text-anchor="middle" font-size="12" font-weight="900"
            font-family="-apple-system,sans-serif" fill="#DC2626">B</text>
        </svg>
        <div style="background:rgba(220,38,38,0.10);border:1.5px solid rgba(220,38,38,0.38);
          border-radius:8px;padding:2px 7px;font-size:9px;font-weight:800;
          font-family:-apple-system,sans-serif;color:#B91C1C;white-space:nowrap;
          box-shadow:0 2px 6px rgba(220,38,38,0.16);pointer-events:none;
        ">🔴 END · ${short}</div>
      </div>
    `,
  });
}

// ============================================================================
// POPUP HTML GENERATORS
// ============================================================================

function busPopupHtml(bus, route) {
  const eta = bus.etaToNextStop;
  const c = etaColor(eta);
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;width:210px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
        <div style="width:10px;height:10px;border-radius:50%;background:${route?.color};flex-shrink:0"></div>
        <b style="font-size:15px;color:#111827">${bus.id}</b>
        <span style="margin-left:auto;font-size:10px;color:#6B7280;background:#F3F4F6;
          padding:2px 8px;border-radius:20px;font-weight:600">${bus.shortCode ?? route?.shortCode ?? ""}</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">
        <div style="background:#F9FAFB;border-radius:10px;padding:9px 10px">
          <div style="color:#9CA3AF;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;margin-bottom:3px">Speed</div>
          <div style="font-size:17px;font-weight:800;color:#111827">${bus.speed}<span style="font-size:10px;font-weight:500;color:#9CA3AF"> km/h</span></div>
        </div>
        <div style="background:#F9FAFB;border-radius:10px;padding:9px 10px">
          <div style="color:#9CA3AF;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;margin-bottom:3px">ETA</div>
          <div style="font-size:17px;font-weight:900;color:${c}">${formatEta(eta)}</div>
        </div>
      </div>
      <div style="font-size:11px;color:#9CA3AF;border-top:1px solid #F3F4F6;padding-top:7px">
        Next stop: <span style="color:#374151;font-weight:600">${bus.targetStop ?? "---"}</span>
      </div>
    </div>
  `;
}

function stopPopupHtml(stop, route, isNearest, nearbyBuses) {
  const c = route?.color ?? "#6B7280";
  const rows = nearbyBuses.length
    ? nearbyBuses.slice(0, 3).map((b) => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #F3F4F6">
          <span style="font-size:12px;color:#374151;font-weight:600">${b.id}</span>
          <span style="font-size:12px;font-weight:800;color:${etaColor(b.etaToNextStop)}">${formatEta(b.etaToNextStop)}</span>
        </div>
      `).join("")
    : `<div style="color:#9CA3AF;font-size:11px;padding:6px 0">No buses tracked</div>`;

  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;width:220px">
      <div style="margin-bottom:10px">
        <div style="display:flex;align-items:center;gap:7px;margin-bottom:4px">
          <div style="width:10px;height:10px;border-radius:50%;background:${c};flex-shrink:0"></div>
          <b style="font-size:14px;color:#111827">${stop.name}</b>
        </div>
        <div style="display:flex;align-items:center;gap:6px">
          <span style="font-size:11px;color:#6B7280">${route?.name ?? "Bus Stop"}</span>
          ${isNearest ? `<span style="font-size:10px;background:#FEF3C7;color:#D97706;padding:1px 8px;border-radius:20px;font-weight:700">⭐ Nearest</span>` : ""}
        </div>
      </div>
      <div style="font-size:9px;color:#9CA3AF;font-weight:700;text-transform:uppercase;letter-spacing:.07em;margin-bottom:5px">Upcoming buses</div>
      ${rows}
    </div>
  `;
}

// ============================================================================
// MAIN BUS MAP COMPONENT
// ============================================================================

const BusMap = forwardRef(function BusMap(
  {
    buses = [],
    allStops = [],
    userLocation,
    selectedStop,
    nearestStopId,
    onStopSelect,
    recenterTick = 0,
    goNearestTick = 0,
    showBuses = true,
    searchQuery = "",
    activeRouteId = null,
  },
  ref
) {
  // Refs for map and layers
  const domRef = useRef(null);
  const mapRef = useRef(null);
  const layerRoute = useRef(null);
  const layerStop = useRef(null);
  const layerBus = useRef(null);
  const layerUser = useRef(null);
  const prevBusPos = useRef({});
  const animFrames = useRef({});

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    zoomIn: () => mapRef.current?.zoomIn(),
    zoomOut: () => mapRef.current?.zoomOut(),
    flyTo: (lat, lng, zoom = 16) =>
      mapRef.current?.flyTo([lat, lng], zoom, { animate: true, duration: 0.9 }),
  }));

  // ==========================================================================
  // INIT MAP
  // ==========================================================================

  useEffect(() => {
    if (mapRef.current) return;

    const center = userLocation ? [userLocation.lat, userLocation.lng] : [-1.9441, 30.0619];
    mapRef.current = L.map(domRef.current, {
      center,
      zoom: 13,
      zoomControl: false,
      attributionControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
      className: "map-tiles-light",
    }).addTo(mapRef.current);

    layerRoute.current = L.layerGroup().addTo(mapRef.current);
    layerStop.current = L.layerGroup().addTo(mapRef.current);
    layerBus.current = L.layerGroup().addTo(mapRef.current);
    layerUser.current = L.layerGroup().addTo(mapRef.current);

    return () => {
      Object.values(animFrames.current).forEach(cancelAnimationFrame);
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // ==========================================================================
  // USER LOCATION
  // ==========================================================================

  useEffect(() => {
    if (!layerUser.current || !userLocation) return;
    layerUser.current.clearLayers();
    L.marker([userLocation.lat, userLocation.lng], { icon: makeUserIcon(), zIndexOffset: 3000 })
      .bindPopup(`<div style="font-family:-apple-system,sans-serif;font-weight:700;font-size:13px;color:#1D4ED8;padding:2px 0">📍 You are here</div>`)
      .addTo(layerUser.current);
    mapRef.current?.flyTo([userLocation.lat, userLocation.lng], 13, { animate: true, duration: 1.0 });
  }, [userLocation]);

  // ==========================================================================
  // RECENTER CONTROLS
  // ==========================================================================

  useEffect(() => {
    if (!mapRef.current || !userLocation || recenterTick === 0) return;
    mapRef.current.flyTo([userLocation.lat, userLocation.lng], 13, { animate: true, duration: 0.9 });
  }, [recenterTick]);

  useEffect(() => {
    if (!mapRef.current || !allStops.length || goNearestTick === 0) return;
    const s = allStops.find((s) => s.id === nearestStopId) ?? allStops[0];
    if (s) {
      mapRef.current.flyTo([s.lat, s.lng], 16, { animate: true, duration: 0.9 });
      onStopSelect?.(s);
    }
  }, [goNearestTick]);

  // ==========================================================================
  // ROUTE POLYLINES + TERMINALS
  // ==========================================================================

  useEffect(() => {
    if (!layerRoute.current) return;
    layerRoute.current.clearLayers();

    // CRITICAL: when route active, show ONLY that route
    const routesToShow = activeRouteId
      ? ROUTES.filter((r) => r.id === activeRouteId)
      : ROUTES;

    routesToShow.forEach((route) => {
      const stops = STOPS_BY_ROUTE[route.id];
      if (!stops || stops.length < 2) return;
      const coords = buildRoutePolyline(stops);

      // White casing for depth
      L.polyline(coords, {
        color: "white",
        weight: 16,
        opacity: 0.85,
        lineJoin: "round",
        lineCap: "round",
        interactive: false,
      }).addTo(layerRoute.current);

      // Colored route line
      const line = L.polyline(coords, {
        color: route.color,
        weight: activeRouteId === route.id ? 10 : 7,
        opacity: activeRouteId === route.id ? 0.95 : 0.78,
        lineJoin: "round",
        lineCap: "round",
      });

      line.bindPopup(
        `
          <div style="font-family:-apple-system,sans-serif;padding:2px 0">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
              <div style="width:28px;height:5px;border-radius:3px;background:${route.color}"></div>
              <b style="color:#111827;font-size:13px">${route.name}</b>
            </div>
            <div style="color:#6B7280;font-size:11px">${stops.length} stops · ${route.shortCode}</div>
          </div>
        `,
        { className: "kbus-popup" }
      );

      line.addTo(layerRoute.current);

      // Big Start terminal A
      L.marker([stops[0].lat, stops[0].lng], { icon: makeStartIcon(route.name), zIndexOffset: 700 })
        .bindPopup(
          `
            <div style="font-family:-apple-system,sans-serif;padding:2px 0">
              <b style="color:#16A34A;font-size:13px">🟢 Start Terminal</b>
              <div style="color:#374151;font-size:12px;margin-top:4px">${stops[0].name}</div>
              <div style="color:#9CA3AF;font-size:11px">${route.name}</div>
            </div>
          `,
          { className: "kbus-popup" }
        )
        .addTo(layerRoute.current);

      // Big End terminal B
      const last = stops[stops.length - 1];
      L.marker([last.lat, last.lng], { icon: makeEndIcon(route.name), zIndexOffset: 700 })
        .bindPopup(
          `
            <div style="font-family:-apple-system,sans-serif;padding:2px 0">
              <b style="color:#DC2626;font-size:13px">🔴 End Terminal</b>
              <div style="color:#374151;font-size:12px;margin-top:4px">${last.name}</div>
              <div style="color:#9CA3AF;font-size:11px">${route.name}</div>
            </div>
          `,
          { className: "kbus-popup" }
        )
        .addTo(layerRoute.current);
    });

    // Fit map to active route bounds
    if (activeRouteId) {
      const stops = STOPS_BY_ROUTE[activeRouteId] ?? [];
      if (stops.length >= 2) {
        const bounds = L.latLngBounds(stops.map((s) => [s.lat, s.lng]));
        mapRef.current?.fitBounds(bounds, { padding: [70, 70], animate: true });
      }
    }
  }, [activeRouteId]);

  // ==========================================================================
  // STOP MARKERS WITH NAME LABELS
  // ==========================================================================

  useEffect(() => {
    if (!layerStop.current) return;
    layerStop.current.clearLayers();
    const q = searchQuery.toLowerCase();

    // CRITICAL: only show stops for active route when one is selected
    const stopsToShow = activeRouteId
      ? (STOPS_BY_ROUTE[activeRouteId] ?? [])
      : Object.values(STOPS_BY_ROUTE).flat();

    stopsToShow.forEach((stop) => {
      // Skip terminals of active route — already shown as big terminal icons
      if (activeRouteId) {
        const routeStops = STOPS_BY_ROUTE[activeRouteId] ?? [];
        const isFirst = stop.id === routeStops[0]?.id;
        const isLast = stop.id === routeStops[routeStops.length - 1]?.id;
        if (isFirst || isLast) return;
      }

      const isSelected = stop.id === selectedStop?.id;
      const isNearest = stop.id === nearestStopId;
      const dimmed = q.length > 0 && !stop.name.toLowerCase().includes(q);
      const route = ROUTES.find((r) => r.id === stop.routeId);
      const routeBuses = buses
        .filter((b) => b.routeId === stop.routeId)
        .sort((a, b) => a.etaToNextStop - b.etaToNextStop);

      const marker = L.marker([stop.lat, stop.lng], {
        icon: makeStopIcon(route?.color ?? "#64748B", stop.name, isSelected, isNearest, dimmed),
        zIndexOffset: isSelected ? 1500 : isNearest ? 1200 : 0,
        opacity: dimmed ? 0.3 : 1,
      });

      marker.bindPopup(stopPopupHtml(stop, route, isNearest, routeBuses), {
        maxWidth: 250,
        className: "kbus-popup",
      });

      marker.on("click", () => onStopSelect?.(stop));
      marker.addTo(layerStop.current);
    });
  }, [allStops, selectedStop, nearestStopId, searchQuery, activeRouteId, buses, onStopSelect]);

  // ==========================================================================
  // LIVE BUS MARKERS — FILTERED BY ACTIVE ROUTE
  // ==========================================================================

  useEffect(() => {
    if (!layerBus.current) return;
    if (!showBuses) {
      layerBus.current.clearLayers();
      return;
    }

    // CRITICAL: when route active, only show buses on that route
    const visibleBuses = activeRouteId
      ? buses.filter((b) => b.routeId === activeRouteId)
      : buses;

    const existing = {};
    layerBus.current.eachLayer((layer) => {
      if (layer._busId) existing[layer._busId] = layer;
    });

    visibleBuses.forEach((bus) => {
      const route = ROUTES.find((r) => r.id === bus.routeId);
      const color = route?.color ?? "#F97316";
      const prev = prevBusPos.current[bus.id];
      const bearing = prev ? calcBearing(prev.lat, prev.lng, bus.lat, bus.lng) : 0;

      if (existing[bus.id]) {
        const m = existing[bus.id];
        const fromPos = m.getLatLng();
        const toPos = L.latLng(bus.lat, bus.lng);
        const t0 = performance.now();
        const dur = 900;

        if (animFrames.current[bus.id]) cancelAnimationFrame(animFrames.current[bus.id]);

        function step(now) {
          const progress = Math.min((now - t0) / dur, 1);
          const eased = easeOutCubic(progress);
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
        const m = L.marker([bus.lat, bus.lng], {
          icon: makeBusIcon(color, bearing),
          zIndexOffset: 1000,
        });
        m._busId = bus.id;
        m.bindPopup(busPopupHtml(bus, route), { maxWidth: 240, className: "kbus-popup" });
        m.addTo(layerBus.current);
      }

      prevBusPos.current[bus.id] = { lat: bus.lat, lng: bus.lng };
    });

    // Remove off-route or stale markers
    Object.values(existing).forEach((m) => layerBus.current.removeLayer(m));
  }, [buses, showBuses, activeRouteId]);

  return <div ref={domRef} className="absolute inset-0" style={{ zIndex: 0 }} />;
});

export default BusMap;