/**
 * Home.jsx — Full-screen map layout wiring all overlays together.
 * Light theme. All fixed bus stops always visible on map.
 */
import React, { useState, useCallback, useRef } from "react";
import BusMap      from "../components/BusMap";
import BottomPanel from "../components/BottomPanel";
import TopBar      from "../components/TopBar";
import MapLegend   from "../components/MapLegend";
import NavControls from "../components/NavControls";
import SearchBar   from "../components/SearchBar";
import {
  useGeolocation, useNearbyStops, useAllBusesLive,
} from "../hooks/useBusData";
import { ALL_STOPS, STOPS_BY_ROUTE } from "../api/mockData";

export default function Home() {
  const { userLocation, locationError, locating } = useGeolocation();

  // Nearby stops (used to find nearest, but ALL stops always shown on map)
  const nearbyStops   = useNearbyStops(userLocation, 3);
  const nearestStopId = nearbyStops[0]?.id ?? null;
  const nearestStop   = nearbyStops[0] ?? null;

  // Live buses — all routes
  const { buses, loading: busesLoading } = useAllBusesLive(userLocation);

  // UI state
  const [selectedStop,  setSelectedStop]  = useState(null);
  const [showBuses,     setShowBuses]     = useState(true);
  const [showAllRoutes, setShowAllRoutes] = useState(true);
  const [activeRouteId, setActiveRouteId] = useState(null);
  const [searchQuery,   setSearchQuery]   = useState("");
  const [recenterTick,  setRecenterTick]  = useState(0);
  const [goNearestTick, setGoNearestTick] = useState(0);

  const mapRef = useRef(null);

  const handleRecenter    = useCallback(() => setRecenterTick((t) => t + 1), []);
  const handleGoNearest   = useCallback(() => setGoNearestTick((t) => t + 1), []);
  const handleToggleBuses = useCallback(() => setShowBuses((v) => !v), []);
  const handleToggleRoutes = useCallback(() => {
    setShowAllRoutes((v) => !v);
    setActiveRouteId(null);
  }, []);

  // ALWAYS show ALL fixed stops — not just nearby.
  // BusMap itself filters by activeRouteId if set.
  const allStops = ALL_STOPS;

  return (
    <div
      className="relative w-full"
      style={{ height: "100dvh", overflow: "hidden" }}
    >
      {/* ── Map (full screen, behind everything) ──────── */}
      <BusMap
        ref={mapRef}
        buses={buses}
        allStops={allStops}
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

      {/* ── Top bar ───────────────────────────────────── */}
      <TopBar
        locating={locating}
        locationError={locationError}
        onRecenter={handleRecenter}
      />

      {/* ── Search + route filter ─────────────────────── */}
      <SearchBar
        onRouteFilter={setActiveRouteId}
        onSearchChange={setSearchQuery}
        activeRouteId={activeRouteId}
      />

      {/* ── Right nav controls ────────────────────────── */}
      <NavControls
        onZoomIn={() => mapRef.current?.zoomIn()}
        onZoomOut={() => mapRef.current?.zoomOut()}
        onRecenter={handleRecenter}
        onGoNearest={handleGoNearest}
        showBuses={showBuses}
        onToggleBuses={handleToggleBuses}
        showAllRoutes={showAllRoutes}
        onToggleRoutes={handleToggleRoutes}
        nearestStopName={nearestStop?.name}
      />

      {/* ── Map legend ────────────────────────────────── */}
      <MapLegend busCount={buses.length} stopCount={allStops.length} />

      {/* ── Loading spinner ───────────────────────────── */}
      {busesLoading && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
          z-20 pointer-events-none">
          <div
            className="px-5 py-3.5 rounded-2xl flex items-center gap-3"
            style={{
              background:   "rgba(255,255,255,0.95)",
              border:       "1px solid rgba(0,0,0,0.08)",
              boxShadow:    "0 4px 20px rgba(0,0,0,0.10)",
              backdropFilter: "blur(16px)",
            }}
          >
            <span className="w-4 h-4 border-2 border-blue-200 border-t-blue-600
              rounded-full animate-spin" />
            <span className="text-gray-600 text-sm font-medium">Loading buses…</span>
          </div>
        </div>
      )}

      {/* ── "Tap a stop" hint ─────────────────────────── */}
      {!selectedStop && !busesLoading && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20
          pointer-events-none whitespace-nowrap">
          <div
            className="px-4 py-2 rounded-full text-xs text-gray-500 flex items-center gap-2"
            style={{
              background: "rgba(255,255,255,0.90)",
              border:     "1px solid rgba(0,0,0,0.07)",
              boxShadow:  "0 2px 8px rgba(0,0,0,0.08)",
              backdropFilter: "blur(10px)",
            }}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Tap a bus stop to see live arrival times
          </div>
        </div>
      )}

      {/* ── Bottom panel (selected stop ETAs) ─────────── */}
      <BottomPanel
        stop={selectedStop}
        onClose={() => setSelectedStop(null)}
      />
    </div>
  );
}
