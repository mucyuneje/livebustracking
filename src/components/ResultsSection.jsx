/**
 * ResultsSection.jsx
 * ─────────────────────────────────────────────────────────────
 * Renders the top-3 upcoming buses sorted by ETA, plus a live
 * refresh indicator and last-updated timestamp.
 * ─────────────────────────────────────────────────────────────
 */

import React from "react";
import { Clock, RefreshCw, AlertTriangle } from "lucide-react";
import BusCard from "./BusCard";
import { sortByEta, formatTime } from "../utils/utils";

export default function ResultsSection({ buses, loading, error, lastUpdated, stopName, routeColor, onRefresh }) {
  const top3 = sortByEta(buses).slice(0, 3);

  // ── Loading skeleton ──────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <SectionHeader stopName={stopName} lastUpdated={null} onRefresh={onRefresh} />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-white/10 bg-white/5 h-48 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────
  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 flex items-center gap-3">
        <AlertTriangle size={20} className="text-red-400 flex-shrink-0" />
        <div>
          <p className="text-red-300 font-semibold text-sm">Failed to load buses</p>
          <p className="text-red-400/60 text-xs mt-0.5">{error}</p>
        </div>
        <button
          onClick={onRefresh}
          className="ml-auto text-xs text-red-300 border border-red-500/30 rounded-lg px-3 py-1.5 hover:bg-red-500/10 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // ── Empty state ───────────────────────────────────────────
  if (buses.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center">
          <Clock size={24} className="text-white/20" />
        </div>
        <p className="text-white/40 text-sm">Select a route and stop to see upcoming buses.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <SectionHeader stopName={stopName} lastUpdated={lastUpdated} onRefresh={onRefresh} />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {top3.map((bus, i) => (
          <BusCard
            key={bus.id}
            bus={bus}
            stopName={stopName}
            routeColor={routeColor}
            rank={i + 1}
          />
        ))}
      </div>
      {buses.length > 3 && (
        <p className="text-white/30 text-xs text-center">
          Showing 3 of {buses.length} buses on this route
        </p>
      )}
    </div>
  );
}

function SectionHeader({ stopName, lastUpdated, onRefresh }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-white font-bold text-lg">Next Buses</h3>
        {stopName && (
          <p className="text-white/40 text-xs mt-0.5">arriving at {stopName}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        {lastUpdated && (
          <span className="text-white/30 text-xs hidden sm:block">
            Updated {formatTime(lastUpdated)}
          </span>
        )}
        <button
          onClick={onRefresh}
          title="Refresh"
          className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors text-white/50 hover:text-white"
        >
          <RefreshCw size={14} />
        </button>
        {/* Live indicator */}
        <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 rounded-lg px-2.5 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-green-400 text-xs font-medium">Live</span>
        </div>
      </div>
    </div>
  );
}