/**
 * TopBar.jsx v4 — Upgraded top bar
 * - Compact brand + route active indicator
 * - Location status chip
 * - Clean glassmorphism
 */
import React from "react";
import { Bus, Locate, Wifi, WifiOff, MapPin } from "lucide-react";
import { ROUTES } from "../api/mockData";

const glass = {
  background: "rgba(255,255,255,0.95)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(0,0,0,0.08)",
  boxShadow: "0 2px 16px rgba(0,0,0,0.10)",
};

export default function TopBar({ locating, locationError, onRecenter, activeRouteId }) {
  const activeRoute = activeRouteId ? ROUTES.find((r) => r.id === activeRouteId) : null;

  return (
    <div className="absolute top-4 left-4 right-4 z-20 flex items-center gap-2 pointer-events-none">

      {/* Brand */}
      <div
        className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl pointer-events-auto flex-shrink-0"
        style={glass}
      >
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)", boxShadow: "0 2px 8px rgba(37,99,235,0.35)" }}>
          <Bus size={15} className="text-white" />
        </div>
        <div>
          <div className="text-gray-900 font-black text-sm leading-none" style={{ letterSpacing: "-0.03em" }}>
            KigaliBus
          </div>
          <div className="text-blue-500 text-[9px] font-bold uppercase tracking-widest leading-none mt-0.5">
            Live GPS
          </div>
        </div>
      </div>

      {/* Active route badge OR location status */}
      <div className="flex-1 pointer-events-auto" style={{ minWidth: 0 }}>
        {activeRoute ? (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-2xl"
            style={{
              ...glass,
              background: `${activeRoute.color}12`,
              border: `1px solid ${activeRoute.color}35`,
            }}
          >
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: activeRoute.color }} />
            <div className="min-w-0">
              <div className="text-xs font-black truncate" style={{ color: activeRoute.color, letterSpacing: "-0.01em" }}>
                {activeRoute.shortCode} — {activeRoute.name}
              </div>
              <div className="text-[10px] text-gray-500 font-medium">Route active · Filtered view</div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl" style={glass}>
            {locating ? (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
                <span className="text-amber-600 text-xs font-semibold truncate">Finding location…</span>
              </>
            ) : locationError ? (
              <>
                <WifiOff size={11} className="text-red-400 flex-shrink-0" />
                <span className="text-red-500 text-xs truncate">{locationError}</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                <span className="text-emerald-700 text-xs font-semibold">Location active</span>
                <Wifi size={10} className="text-emerald-400 ml-auto flex-shrink-0" />
              </>
            )}
          </div>
        )}
      </div>

      {/* Recenter */}
      <button
        onClick={onRecenter}
        title="Re-center on my location"
        className="w-10 h-10 rounded-2xl flex items-center justify-center pointer-events-auto transition-all duration-200 hover:scale-105 active:scale-95 flex-shrink-0"
        style={{
          background: "rgba(37,99,235,0.12)",
          border: "1px solid rgba(37,99,235,0.28)",
          backdropFilter: "blur(12px)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        <Locate size={16} className="text-blue-600" />
      </button>
    </div>
  );
}