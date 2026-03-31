/**
 * RouteSelector.jsx
 * ─────────────────────────────────────────────────────────────
 * Dropdown panel for selecting a bus route and stop, then
 * triggering the "Show Next Buses" query.
 * ─────────────────────────────────────────────────────────────
 */

import React from "react";
import { MapPin, Bus, Search, ChevronDown } from "lucide-react";

export default function RouteSelector({
  routes,
  stops,
  selectedRouteId,
  selectedStopId,
  onRouteChange,
  onStopChange,
  onSubmit,
  loadingRoutes,
  loadingStops,
  loadingBuses,
}) {
  const canSubmit = selectedRouteId && selectedStopId && !loadingBuses;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 flex flex-col gap-5">
      {/* Title */}
      <div className="flex items-center gap-2">
        <Search size={18} className="text-orange-400" />
        <h2 className="text-white font-bold text-lg">Find Your Bus</h2>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Route selector */}
        <div className="flex flex-col gap-2">
          <label className="text-white/50 text-xs font-medium uppercase tracking-widest flex items-center gap-1.5">
            <Bus size={12} /> Route
          </label>
          <div className="relative">
            <select
              className="
                w-full appearance-none bg-white/8 border border-white/15 rounded-xl
                text-white px-4 py-3 pr-10 text-sm focus:outline-none
                focus:border-orange-400/60 focus:ring-2 focus:ring-orange-400/20
                transition-all cursor-pointer disabled:opacity-40
              "
              value={selectedRouteId ?? ""}
              onChange={(e) => onRouteChange(e.target.value ? Number(e.target.value) : null)}
              disabled={loadingRoutes}
            >
              <option value="" className="bg-gray-900">
                {loadingRoutes ? "Loading…" : "Select a route"}
              </option>
              {routes.map((r) => (
                <option key={r.id} value={r.id} className="bg-gray-900">
                  {r.name}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
          </div>
        </div>

        {/* Stop selector */}
        <div className="flex flex-col gap-2">
          <label className="text-white/50 text-xs font-medium uppercase tracking-widest flex items-center gap-1.5">
            <MapPin size={12} /> Stop
          </label>
          <div className="relative">
            <select
              className="
                w-full appearance-none bg-white/8 border border-white/15 rounded-xl
                text-white px-4 py-3 pr-10 text-sm focus:outline-none
                focus:border-orange-400/60 focus:ring-2 focus:ring-orange-400/20
                transition-all cursor-pointer disabled:opacity-40
              "
              value={selectedStopId ?? ""}
              onChange={(e) => onStopChange(e.target.value ? Number(e.target.value) : null)}
              disabled={!selectedRouteId || loadingStops}
            >
              <option value="" className="bg-gray-900">
                {!selectedRouteId ? "Select route first" : loadingStops ? "Loading…" : "Select a stop"}
              </option>
              {stops.map((s) => (
                <option key={s.id} value={s.id} className="bg-gray-900">
                  {s.name}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={onSubmit}
        disabled={!canSubmit}
        className="
          w-full py-3.5 rounded-xl font-bold text-sm text-white tracking-wide
          transition-all duration-200 flex items-center justify-center gap-2
          disabled:opacity-40 disabled:cursor-not-allowed
          bg-gradient-to-r from-orange-500 to-amber-500
          hover:from-orange-400 hover:to-amber-400
          active:scale-95 shadow-lg shadow-orange-500/20
        "
      >
        {loadingBuses ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Fetching buses…
          </>
        ) : (
          <>
            <Search size={16} />
            Show Next Buses
          </>
        )}
      </button>
    </div>
  );
}