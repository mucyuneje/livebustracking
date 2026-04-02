/**
 * ProximityEngine.jsx
 * ══════════════════════════════════════════════════════════════
 * Feature 1 — Automated Proximity Alerts
 *
 * Runs silently in the background. Every time `buses` updates
 * (every 2.5 s) it checks: is ANY bus on the active route ≤ 3
 * minutes away from the user's location?
 *
 * If yes → fires ONE toast alert (de-duped by busId so the same
 * bus doesn't spam) using:
 *   1. Browser Notification API  (if permission granted)
 *   2. In-app Toast overlay       (always shown as fallback)
 *
 * Renders: A self-stacking toast container (bottom-left) +
 *          a small "Alerts ON" badge in the top bar area.
 *
 * Props:
 *   buses        — live bus array from useAllBusesLive()
 *   userLocation — { lat, lng } | null
 *   activeRouteId — number | null
 *   routes       — ROUTES array for colour lookup
 * ══════════════════════════════════════════════════════════════
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import { haversineKm } from "../utils/utils";

// How many minutes away triggers an alert
const ALERT_THRESHOLD_MINS = 3;
// Cooldown per bus: don't re-alert the same bus for 90 s
const COOLDOWN_MS = 90_000;

// ─── Toast component ─────────────────────────────────────────
function Toast({ id, busId, routeName, routeColor, etaMins, stopName, onDismiss }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Animate in
    const t1 = setTimeout(() => setVisible(true), 30);
    // Auto-dismiss after 8 s
    const t2 = setTimeout(() => { setVisible(false); setTimeout(() => onDismiss(id), 350); }, 8000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [id, onDismiss]);

  const etaLabel = etaMins <= 1 ? "Arriving NOW!" : `${etaMins} min away`;
  const urgentBg = etaMins <= 1 ? "#DC2626" : etaMins <= 2 ? "#EA580C" : "#16A34A";

  return (
    <div
      className="flex items-start gap-3 rounded-2xl overflow-hidden shadow-2xl pointer-events-auto"
      style={{
        background: "rgba(15,23,42,0.96)",
        border: `1.5px solid ${routeColor}55`,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        maxWidth: 320,
        transform: visible ? "translateX(0) scale(1)" : "translateX(-110%) scale(0.92)",
        opacity: visible ? 1 : 0,
        transition: "transform 0.32s cubic-bezier(0.34,1.56,0.64,1), opacity 0.28s ease",
        boxShadow: `0 8px 32px rgba(0,0,0,0.45), 0 0 0 1px ${routeColor}22`,
      }}
    >
      {/* Colour strip */}
      <div className="w-1 self-stretch flex-shrink-0" style={{ background: routeColor }} />

      {/* Content */}
      <div className="flex-1 py-3 pr-3">
        <div className="flex items-center gap-2 mb-1.5">
          {/* Bus icon */}
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: `${routeColor}25`, border: `1px solid ${routeColor}40` }}
          >
            <svg width="16" height="10" viewBox="0 0 48 30" fill="none">
              <rect x="4" y="5" width="40" height="16" rx="3" fill={routeColor} fillOpacity="0.9"/>
              <circle cx="38" cy="24" r="4" fill={routeColor} fillOpacity="0.7"/>
              <circle cx="10" cy="24" r="4" fill={routeColor} fillOpacity="0.7"/>
            </svg>
          </div>
          {/* ETA badge */}
          <span
            className="text-white font-black text-sm"
            style={{ color: urgentBg }}
          >
            {etaLabel}
          </span>
          {/* Route pill */}
          <span
            className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: `${routeColor}22`, color: routeColor, border: `1px solid ${routeColor}44` }}
          >
            {busId}
          </span>
        </div>

        <p className="text-white/70 text-xs leading-snug">
          Bus on <span className="text-white font-semibold">{routeName}</span>
          {stopName ? <> heading to <span className="text-white font-semibold">{stopName}</span></> : ""}
        </p>

        {/* Proximity alert label */}
        <div className="flex items-center gap-1.5 mt-2">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: urgentBg }} />
          <span className="text-xs font-bold" style={{ color: urgentBg }}>
            🔔 Proximity Alert
          </span>
        </div>
      </div>

      {/* Dismiss */}
      <button
        onClick={() => { setVisible(false); setTimeout(() => onDismiss(id), 350); }}
        className="self-start mt-2 mr-2 w-6 h-6 rounded-lg flex items-center justify-center
          text-white/30 hover:text-white/80 transition-colors text-lg leading-none"
      >
        ×
      </button>
    </div>
  );
}

// ─── Main ProximityEngine ────────────────────────────────────
export default function ProximityEngine({ buses, userLocation, activeRouteId, routes }) {
  const [toasts,     setToasts]     = useState([]);
  const [notifPerms, setNotifPerms] = useState("default"); // "default"|"granted"|"denied"
  const alertedRef   = useRef(new Map()); // busId → last alerted timestamp
  const toastCounter = useRef(0);

  // Request browser notification permission once on mount
  useEffect(() => {
    if ("Notification" in window) {
      setNotifPerms(Notification.permission);
      if (Notification.permission === "default") {
        Notification.requestPermission().then((p) => setNotifPerms(p));
      }
    }
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ── Core proximity check — runs every time buses update ──
  useEffect(() => {
    if (!userLocation || !buses.length) return;

    const now = Date.now();
    const routeBuses = activeRouteId
      ? buses.filter((b) => b.routeId === activeRouteId)
      : buses;

    routeBuses.forEach((bus) => {
      const eta = bus.etaToNextStop;
      if (eta > ALERT_THRESHOLD_MINS) return;

      // Also check physical distance: bus must be within 2 km of user
      const distKm = haversineKm(userLocation.lat, userLocation.lng, bus.lat, bus.lng);
      if (distKm > 2) return;

      // De-dupe: same bus shouldn't alert more than once per cooldown
      const lastAlert = alertedRef.current.get(bus.id) ?? 0;
      if (now - lastAlert < COOLDOWN_MS) return;

      alertedRef.current.set(bus.id, now);

      const route = routes?.find((r) => r.id === bus.routeId);
      const routeColor = route?.color ?? "#2563EB";
      const routeName  = route?.name  ?? "Unknown route";

      // ① Try Browser Notification API
      if ("Notification" in window && Notification.permission === "granted") {
        try {
          new Notification("🚌 Bus Approaching!", {
            body: `${bus.id} on ${routeName} is ${eta <= 1 ? "arriving now" : `${eta} min away`}`,
            icon: "/favicon.svg",
            tag:  `bus-${bus.id}`,  // replaces previous notification for same bus
            badge:"/favicon.svg",
            silent: false,
          });
        } catch (_) {
          // Notifications blocked in some contexts (e.g. localhost HTTP) — fall through to toast
        }
      }

      // ② Always show in-app toast (reliable fallback + better UX)
      const toastId = ++toastCounter.current;
      setToasts((prev) => [
        ...prev.slice(-3), // max 4 toasts visible
        {
          id:         toastId,
          busId:      bus.id,
          routeName,
          routeColor,
          etaMins:    eta,
          stopName:   bus.targetStop ?? null,
        },
      ]);
    });
  }, [buses, userLocation, activeRouteId, routes]);

  // ── Render ─────────────────────────────────────────────────
  return (
    <>
      {/* Toast stack — bottom-left, above map, below panels */}
      <div
        className="fixed bottom-24 left-4 z-50 flex flex-col gap-2.5 pointer-events-none"
        style={{ maxWidth: 320 }}
      >
        {toasts.map((t) => (
          <Toast key={t.id} {...t} onDismiss={dismissToast} />
        ))}
      </div>

      {/* "Alerts Active" micro-badge — shown when permission granted */}
      {notifPerms === "granted" && (
        <div
          className="fixed top-20 right-4 z-50 pointer-events-none"
          style={{ display: "none" }}   /* hidden by default — can be toggled if desired */
        >
          <span className="flex items-center gap-1 text-xs font-bold text-green-400 px-2.5 py-1
            rounded-full bg-green-400/10 border border-green-400/25">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Alerts ON
          </span>
        </div>
      )}
    </>
  );
}