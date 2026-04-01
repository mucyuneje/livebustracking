/**
 * Home.jsx — v8
 * Full automation:
 * 1. On load → show location permission screen (mobile-friendly)
 * 2. After permission → detect location → auto-select nearest route
 * 3. Show map with buses on real roads
 */
import React, { useState, useCallback, useRef, useEffect } from "react";
import BusMap      from "../components/BusMap";
import BottomPanel from "../components/BottomPanel";
import TopBar      from "../components/TopBar";
import NavControls from "../components/NavControls";
import SearchBar   from "../components/SearchBar";
import {
  useGeolocation, useNearbyStops, useAllBusesLive, useNearestRoute,
} from "../hooks/useBusData";
import { ALL_STOPS } from "../api/mockData";

export default function Home() {
  const {
    userLocation, locationError, locating,
    permissionState, requestLocation,
  } = useGeolocation();

  // Auto-detect nearest route
  const nearestRouteId = useNearestRoute(userLocation);

  const nearbyStops   = useNearbyStops(userLocation, 3);
  const nearestStopId = nearbyStops[0]?.id ?? null;
  const nearestStop   = nearbyStops[0] ?? null;

  const { buses, loading: busesLoading } = useAllBusesLive(userLocation);

  const [selectedStop,  setSelectedStop]  = useState(null);
  const [showBuses,     setShowBuses]     = useState(true);
  const [activeRouteId, setActiveRouteId] = useState(null);
  const [searchQuery,   setSearchQuery]   = useState("");
  const [recenterTick,  setRecenterTick]  = useState(0);
  const [goNearestTick, setGoNearestTick] = useState(0);
  const [autoRouteDone, setAutoRouteDone] = useState(false);

  const mapRef = useRef(null);

  // Auto-select nearest route once location is available
  useEffect(() => {
    if (!autoRouteDone && nearestRouteId && userLocation) {
      setActiveRouteId(nearestRouteId);
      setAutoRouteDone(true);
    }
  }, [nearestRouteId, userLocation, autoRouteDone]);

  const handleRecenter  = useCallback(() => setRecenterTick((t) => t + 1), []);
  const handleGoNearest = useCallback(() => setGoNearestTick((t) => t + 1), []);

  // ── Location permission splash screen ──────────────────────
  const needsPermission = permissionState === "prompt" && !userLocation && !locating;

  if (needsPermission) {
    return (
      <div
        className="fixed inset-0 flex flex-col items-center justify-center"
        style={{
          background: "linear-gradient(160deg, #1e3a5f 0%, #1a2d4a 40%, #0f1e33 100%)",
        }}
      >
        {/* Animated background dots */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width:  `${80 + i * 40}px`,
                height: `${80 + i * 40}px`,
                left:   `${10 + i * 14}%`,
                top:    `${20 + (i % 3) * 20}%`,
                background: "rgba(37,99,235,0.08)",
                animation: `pulse ${2 + i * 0.4}s ease-in-out infinite alternate`,
                animationDelay: `${i * 0.3}s`,
              }}
            />
          ))}
        </div>

        {/* Card */}
        <div
          className="relative mx-6 rounded-3xl overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            backdropFilter: "blur(20px)",
            maxWidth: 360,
            width: "100%",
          }}
        >
          {/* Header */}
          <div className="px-8 pt-10 pb-6 text-center">
            {/* Bus icon */}
            <div
              className="w-20 h-20 mx-auto mb-5 rounded-3xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #2563EB, #1d4ed8)",
                boxShadow: "0 8px 32px rgba(37,99,235,0.45)",
              }}
            >
              <svg width="42" height="42" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="5" y="9" width="32" height="22" rx="5" fill="white" fillOpacity="0.95"/>
                <rect x="8" y="13" width="9" height="6" rx="2" fill="#2563EB"/>
                <rect x="25" y="13" width="9" height="6" rx="2" fill="#2563EB"/>
                <rect x="18" y="13" width="6" height="6" rx="2" fill="#2563EB"/>
                <circle cx="12" cy="33" r="4" fill="white" fillOpacity="0.9"/>
                <circle cx="30" cy="33" r="4" fill="white" fillOpacity="0.9"/>
                <rect x="5" y="28" width="32" height="4" rx="2" fill="white" fillOpacity="0.4"/>
              </svg>
            </div>

            <h1 className="text-white font-black text-2xl tracking-tight mb-1">
              KigaliBus Live
            </h1>
            <p className="text-blue-300 text-sm font-medium">
              Real-time bus tracking
            </p>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "rgba(255,255,255,0.08)" }} />

          {/* Body */}
          <div className="px-8 py-6">
            {/* Location icon */}
            <div className="flex items-start gap-4 mb-6">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: "rgba(37,99,235,0.20)", border: "1px solid rgba(37,99,235,0.30)" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
                  <circle cx="12" cy="12" r="8" strokeOpacity="0.4"/>
                </svg>
              </div>
              <div>
                <p className="text-white font-semibold text-sm mb-1">Allow Location Access</p>
                <p className="text-blue-200 text-xs leading-relaxed opacity-80">
                  KigaliBus needs your location to show nearby buses, detect your nearest route, and give accurate arrival times.
                </p>
              </div>
            </div>

            {/* Features */}
            {[
              { icon: "🚌", text: "Auto-detect your nearest bus route" },
              { icon: "⏱️", text: "Live ETAs to your closest stop" },
              { icon: "📍", text: "See buses near you in real time" },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3 mb-3">
                <span className="text-base">{f.icon}</span>
                <span className="text-blue-100 text-xs opacity-85">{f.text}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="px-8 pb-8">
            <button
              onClick={requestLocation}
              className="w-full py-4 rounded-2xl font-bold text-white text-base
                transition-all duration-200 active:scale-95"
              style={{
                background: "linear-gradient(135deg, #2563EB, #1d4ed8)",
                boxShadow: "0 6px 24px rgba(37,99,235,0.50)",
              }}
            >
              📍 Allow Location & Continue
            </button>

            <button
              onClick={() => {
                requestLocation();
                // Force use Kigali center if denied
                setTimeout(() => {
                  if (!userLocation) setActiveRouteId(1);
                }, 200);
              }}
              className="w-full mt-3 py-3 rounded-2xl font-medium text-blue-300 text-sm
                transition-all duration-200 active:scale-95"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              Skip — Use Kigali Centre
            </button>
          </div>
        </div>

        {/* Footer note */}
        <p className="mt-6 text-blue-400 text-xs opacity-60 text-center px-8">
          Your location is only used locally and never stored.
        </p>

        <style>{`
          @keyframes pulse {
            from { transform: scale(1); opacity: 0.5; }
            to   { transform: scale(1.15); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  // ── Loading screen ─────────────────────────────────────────
  if (locating) {
    return (
      <div
        className="fixed inset-0 flex flex-col items-center justify-center gap-4"
        style={{ background: "linear-gradient(160deg, #1e3a5f 0%, #0f1e33 100%)" }}
      >
        <div
          className="w-16 h-16 rounded-3xl flex items-center justify-center"
          style={{ background: "rgba(37,99,235,0.20)", border: "1px solid rgba(37,99,235,0.35)" }}
        >
          <span className="w-7 h-7 border-3 border-blue-400 border-t-blue-600 rounded-full animate-spin"
            style={{ borderWidth: 3 }} />
        </div>
        <p className="text-white font-semibold text-sm">Detecting your location…</p>
        <p className="text-blue-300 text-xs opacity-70">Finding nearest bus route</p>
      </div>
    );
  }

  // ── Main map ───────────────────────────────────────────────
  return (
    <div className="relative w-full" style={{ height: "100dvh", overflow: "hidden" }}>

      <BusMap
        ref={mapRef}
        buses={buses}
        allStops={ALL_STOPS}
        userLocation={userLocation}
        selectedStop={selectedStop}
        nearestStopId={nearestStopId}
        onStopSelect={setSelectedStop}
        recenterTick={recenterTick}
        goNearestTick={goNearestTick}
        showBuses={showBuses}
        searchQuery={searchQuery}
        activeRouteId={activeRouteId}
      />

      <TopBar
        locating={locating}
        locationError={locationError}
        onRecenter={handleRecenter}
        activeRouteId={activeRouteId}
      />

      <SearchBar
        onRouteFilter={setActiveRouteId}
        onSearchChange={setSearchQuery}
        activeRouteId={activeRouteId}
      />

      <NavControls
        onZoomIn={() => mapRef.current?.zoomIn()}
        onZoomOut={() => mapRef.current?.zoomOut()}
        onRecenter={handleRecenter}
        onGoNearest={handleGoNearest}
        showBuses={showBuses}
        onToggleBuses={() => setShowBuses((v) => !v)}
        nearestStopName={nearestStop?.name}
      />

      {busesLoading && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
          z-20 pointer-events-none">
          <div className="px-5 py-3.5 rounded-2xl flex items-center gap-3"
            style={{
              background: "rgba(255,255,255,0.95)",
              border: "1px solid rgba(0,0,0,0.08)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.10)",
              backdropFilter: "blur(16px)",
            }}>
            <span className="w-4 h-4 border-2 border-blue-200 border-t-blue-600
              rounded-full animate-spin" />
            <span className="text-gray-600 text-sm font-medium">Loading buses…</span>
          </div>
        </div>
      )}

      {!selectedStop && !busesLoading && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20
          pointer-events-none whitespace-nowrap">
          <div className="px-4 py-2 rounded-full text-xs text-gray-500 flex items-center gap-2"
            style={{
              background: "rgba(255,255,255,0.90)",
              border: "1px solid rgba(0,0,0,0.07)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              backdropFilter: "blur(10px)",
            }}>
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Tap a bus stop to see live arrivals
          </div>
        </div>
      )}

      <BottomPanel stop={selectedStop} onClose={() => setSelectedStop(null)} />
    </div>
  );
}
