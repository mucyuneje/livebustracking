/**
 * Home.jsx v4 — Wires upgraded components together
 * - Passes activeRouteId to TopBar for route indicator
 * - Route active state flows through to BusMap for full filtering
 * - Clean mobile-first layout
 */
import React, { useState, useCallback, useRef } from "react";
import BusMap from "../components/BusMap";
import BottomPanel from "../components/BottomPanel";
import TopBar from "../components/TopBar";
import MapLegend from "../components/MapLegend";
import NavControls from "../components/NavControls";
import SearchBar from "../components/SearchBar";
import {
  useGeolocation, useNearbyStops, useAllBusesLive,
} from "../hooks/useBusData";
import { ALL_STOPS, STOPS_BY_ROUTE, ROUTES } from "../api/mockData";

export default function Home() {
  const { userLocation, locationError, locating } = useGeolocation();
  const nearbyStops = useNearbyStops(userLocation, 3);
  const nearestStopId = nearbyStops[0]?.id ?? null;
  const nearestStop = nearbyStops[0] ?? null;
  const { buses, loading: busesLoading } = useAllBusesLive(userLocation);

  const [selectedStop, setSelectedStop] = useState(null);
  const [showBuses, setShowBuses] = useState(true);
  const [showAllRoutes, setShowAllRoutes] = useState(true);
  const [activeRouteId, setActiveRouteId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [recenterTick, setRecenterTick] = useState(0);
  const [goNearestTick, setGoNearestTick] = useState(0);

  const mapRef = useRef(null);

  const handleRecenter = useCallback(() => setRecenterTick((t) => t + 1), []);
  const handleGoNearest = useCallback(() => setGoNearestTick((t) => t + 1), []);
  const handleToggleBuses = useCallback(() => setShowBuses((v) => !v), []);
  const handleToggleRoutes = useCallback(() => {
    setShowAllRoutes((v) => !v);
    setActiveRouteId(null);
  }, []);

  // When a route is selected, also clear selected stop (it may be off-route)
  const handleRouteFilter = useCallback((id) => {
    setActiveRouteId(id);
    setSelectedStop(null);
  }, []);

  // Compute visible bus count for legend
  const visibleBusCount = activeRouteId
    ? buses.filter((b) => b.routeId === activeRouteId).length
    : buses.length;

  const visibleStopCount = activeRouteId
    ? (STOPS_BY_ROUTE[activeRouteId]?.length ?? 0)
    : ALL_STOPS.length;

  return (
    <div className="relative w-full" style={{ height: "100dvh", overflow: "hidden" }}>

      {/* Map — full screen behind everything */}
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

      {/* Top bar — shows active route name when filtering */}
      <TopBar
        locating={locating}
        locationError={locationError}
        onRecenter={handleRecenter}
        activeRouteId={activeRouteId}
      />

      {/* Search + route filter */}
      <SearchBar
        onRouteFilter={handleRouteFilter}
        onSearchChange={setSearchQuery}
        activeRouteId={activeRouteId}
      />

      {/* Right nav controls */}
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

      {/* Route active banner — shown when filtering */}
      {activeRouteId && (
        <div
          className="absolute top-[120px] left-4 z-20 pointer-events-auto"
          style={{
            background: `${ROUTES.find((r) => r.id === activeRouteId)?.color}18`,
            border: `1.5px solid ${ROUTES.find((r) => r.id === activeRouteId)?.color}40`,
            borderRadius: 12,
            padding: "5px 12px",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
          }}
        >
          <button
            onClick={() => handleRouteFilter(null)}
            className="text-xs font-bold flex items-center gap-1.5 transition-opacity hover:opacity-70"
            style={{ color: ROUTES.find((r) => r.id === activeRouteId)?.color }}
          >
            <span>✕</span>
            <span>Clear route filter</span>
          </button>
        </div>
      )}

      {/* Map legend */}
      <MapLegend busCount={visibleBusCount} stopCount={visibleStopCount} />

      {/* Loading overlay */}
      {busesLoading && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
          <div
            className="px-5 py-3.5 rounded-2xl flex items-center gap-3"
            style={{
              background: "rgba(255,255,255,0.96)",
              border: "1px solid rgba(0,0,0,0.08)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.10)",
              backdropFilter: "blur(16px)",
            }}
          >
            <span className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            <span className="text-gray-600 text-sm font-medium">Loading buses…</span>
          </div>
        </div>
      )}

      {/* Tap hint — shown when no stop selected */}
      {!selectedStop && !busesLoading && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none whitespace-nowrap">
          <div
            className="px-4 py-2 rounded-full text-xs text-gray-500 flex items-center gap-2"
            style={{
              background: "rgba(255,255,255,0.92)",
              border: "1px solid rgba(0,0,0,0.07)",
              boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
              backdropFilter: "blur(12px)",
            }}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            {activeRouteId
              ? "Tap a stop on this route to see live arrivals"
              : "Select a route or tap any stop for live arrivals"}
          </div>
        </div>
      )}

      {/* Bottom panel */}
      <BottomPanel stop={selectedStop} onClose={() => setSelectedStop(null)} />
    </div>
  );
}