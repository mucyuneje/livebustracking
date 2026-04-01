/**
 * SearchBar.jsx — Search stops + filter by route.
 * Light theme. Route pills show route color.
 */
import React, { useState } from "react";
import { Search, X, ChevronDown, Check } from "lucide-react";
import { ROUTES } from "../api/mockData";

const card = {
  background:   "rgba(255,255,255,0.94)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border:       "1px solid rgba(0,0,0,0.08)",
  boxShadow:    "0 2px 12px rgba(0,0,0,0.10)",
};

export default function SearchBar({ onRouteFilter, onSearchChange, activeRouteId }) {
  const [query,      setQuery]      = useState("");
  const [showRoutes, setShowRoutes] = useState(false);

  const handleSearch = (v) => { setQuery(v); onSearchChange?.(v); };
  const handleRoute  = (id) => {
    onRouteFilter?.(id === activeRouteId ? null : id);
    setShowRoutes(false);
  };

  const activeRoute = ROUTES.find((r) => r.id === activeRouteId);

  return (
    <div className="absolute top-[72px] left-4 right-4 z-20 flex gap-2 pointer-events-none">

      {/* Search */}
      <div
        className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl pointer-events-auto"
        style={card}
      >
        <Search size={14} className="text-gray-400 flex-shrink-0" />
        <input
          type="text"
          placeholder="Search bus stops…"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          className="flex-1 bg-transparent text-gray-800 text-sm placeholder-gray-400
            outline-none"
        />
        {query && (
          <button
            onClick={() => handleSearch("")}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Route filter */}
      <div className="relative pointer-events-auto">
        <button
          onClick={() => setShowRoutes((v) => !v)}
          className="h-full px-3.5 rounded-2xl flex items-center gap-2 text-sm
            font-semibold transition-all duration-200 min-w-[52px]"
          style={{
            ...card,
            background: activeRoute
              ? `${activeRoute.color}18`
              : card.background,
            border: activeRoute
              ? `1px solid ${activeRoute.color}50`
              : card.border,
          }}
        >
          {activeRoute ? (
            <>
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ background: activeRoute.color }}
              />
              <span className="text-gray-700 hidden sm:block text-xs font-bold max-w-[70px] truncate">
                {activeRoute.shortCode}
              </span>
            </>
          ) : (
            <span className="text-gray-500 text-xs font-medium">Route</span>
          )}
          <ChevronDown
            size={12}
            className={`text-gray-400 transition-transform duration-200 ${showRoutes ? "rotate-180" : ""}`}
          />
        </button>

        {showRoutes && (
          <div
            className="absolute top-full mt-2 right-0 min-w-[220px] rounded-2xl
              overflow-hidden flex flex-col py-1"
            style={{ ...card, boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}
          >
            <div className="px-4 py-2 border-b border-gray-100">
              <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                Filter by route
              </span>
            </div>

            {/* All routes */}
            <button
              onClick={() => handleRoute(null)}
              className="px-4 py-2.5 flex items-center gap-3 text-sm
                hover:bg-gray-50 transition-colors text-left"
            >
              <span className="w-3 h-3 rounded-full bg-gray-300 flex-shrink-0" />
              <span className="text-gray-600 flex-1">All routes</span>
              {!activeRouteId && <Check size={13} className="text-blue-500" />}
            </button>

            {ROUTES.map((r) => (
              <button
                key={r.id}
                onClick={() => handleRoute(r.id)}
                className="px-4 py-2.5 flex items-center gap-3 text-sm
                  hover:bg-gray-50 transition-colors text-left"
              >
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ background: r.color }}
                />
                <span className="text-gray-700 flex-1 leading-tight">{r.name}</span>
                {activeRouteId === r.id && <Check size={13} className="text-blue-500" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
