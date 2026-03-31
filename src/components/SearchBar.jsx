/**
 * SearchBar.jsx v4 — Upgraded route selector + stop search
 * - Route cards with color, stop count, bus count
 * - Clear visual active state
 * - Mobile-first compact layout
 */
import React, { useState } from "react";
import { Search, X, ChevronDown, Check, Bus, MapPin } from "lucide-react";
import { ROUTES, STOPS_BY_ROUTE } from "../api/mockData";

const glass = {
  background: "rgba(255,255,255,0.95)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(0,0,0,0.08)",
  boxShadow: "0 2px 14px rgba(0,0,0,0.10)",
};

export default function SearchBar({ onRouteFilter, onSearchChange, activeRouteId }) {
  const [query, setQuery] = useState("");
  const [showRoutes, setShowRoutes] = useState(false);

  const handleSearch = (v) => { setQuery(v); onSearchChange?.(v); };
  const handleRoute = (id) => {
    onRouteFilter?.(id === activeRouteId ? null : id);
    setShowRoutes(false);
  };

  const activeRoute = ROUTES.find((r) => r.id === activeRouteId);

  return (
    <div className="absolute top-[72px] left-4 right-4 z-20 flex gap-2 pointer-events-none">

      {/* Search input */}
      <div
        className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl pointer-events-auto"
        style={glass}
      >
        <Search size={14} className="text-gray-400 flex-shrink-0" />
        <input
          type="text"
          placeholder="Search stops…"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          className="flex-1 bg-transparent text-gray-800 text-sm placeholder-gray-400 outline-none"
          style={{ minWidth: 0 }}
        />
        {query && (
          <button onClick={() => handleSearch("")} className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0">
            <X size={13} />
          </button>
        )}
      </div>

      {/* Route filter button */}
      <div className="relative pointer-events-auto flex-shrink-0">
        <button
          onClick={() => setShowRoutes((v) => !v)}
          className="h-full px-3.5 rounded-2xl flex items-center gap-2 font-semibold transition-all duration-200 active:scale-95"
          style={{
            ...glass,
            background: activeRoute ? `${activeRoute.color}16` : glass.background,
            border: activeRoute ? `1.5px solid ${activeRoute.color}45` : glass.border,
            minWidth: 80,
          }}
        >
          {activeRoute ? (
            <>
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: activeRoute.color }} />
              <span className="text-xs font-black" style={{ color: activeRoute.color }}>{activeRoute.shortCode}</span>
            </>
          ) : (
            <span className="text-gray-500 text-xs font-semibold">Routes</span>
          )}
          <ChevronDown
            size={11}
            className={`text-gray-400 transition-transform duration-200 ${showRoutes ? "rotate-180" : ""}`}
          />
        </button>

        {/* Route dropdown */}
        {showRoutes && (
          <div
            className="absolute top-full mt-2 right-0 rounded-2xl overflow-hidden flex flex-col"
            style={{
              ...glass,
              boxShadow: "0 10px 32px rgba(0,0,0,0.14)",
              width: 260,
              zIndex: 50,
            }}
          >
            {/* Header */}
            <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid #F1F5F9" }}>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Filter by route</span>
              {activeRouteId && (
                <button
                  onClick={() => handleRoute(null)}
                  className="text-[10px] font-bold text-blue-500 hover:text-blue-700 transition-colors"
                >
                  Clear filter
                </button>
              )}
            </div>

            {/* All routes option */}
            <button
              onClick={() => handleRoute(null)}
              className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
            >
              <span className="w-3 h-3 rounded-full bg-gray-300 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-600">All routes</div>
                <div className="text-[10px] text-gray-400">Show everything</div>
              </div>
              {!activeRouteId && <Check size={13} className="text-blue-500" />}
            </button>

            {/* Individual routes */}
            {ROUTES.map((r) => {
              const stopCount = STOPS_BY_ROUTE[r.id]?.length ?? 0;
              const isActive = activeRouteId === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => handleRoute(r.id)}
                  className="px-4 py-3 flex items-center gap-3 transition-colors text-left"
                  style={{
                    background: isActive ? `${r.color}08` : "transparent",
                    borderLeft: isActive ? `3px solid ${r.color}` : "3px solid transparent",
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "#F8FAFC"; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                >
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${r.color}18` }}>
                    <Bus size={13} style={{ color: r.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-gray-800 leading-tight truncate">{r.name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className="text-[10px] font-black px-1.5 py-0.5 rounded"
                        style={{ background: `${r.color}18`, color: r.color }}
                      >
                        {r.shortCode}
                      </span>
                      <span className="text-[10px] text-gray-400 flex items-center gap-1">
                        <MapPin size={8} />{stopCount} stops
                      </span>
                    </div>
                  </div>
                  {isActive && <Check size={14} style={{ color: r.color }} className="flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}