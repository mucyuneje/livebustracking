/**
 * TopBar.jsx — Floating top bar: branding, location status, recenter.
 * Light theme.
 */
import React from "react";
import { Bus, Locate, Wifi, WifiOff } from "lucide-react";

const card = {
  background:   "rgba(255,255,255,0.94)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border:       "1px solid rgba(0,0,0,0.08)",
  boxShadow:    "0 2px 12px rgba(0,0,0,0.10)",
};

export default function TopBar({ locating, locationError, onRecenter }) {
  return (
    <div className="absolute top-4 left-4 right-4 z-20 flex items-center gap-2.5 pointer-events-none">

      {/* Brand */}
      <div
        className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl pointer-events-auto"
        style={card}
      >
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500
          flex items-center justify-center shadow-sm">
          <Bus size={15} className="text-white" />
        </div>
        <div>
          <div className="text-gray-900 font-black text-sm leading-none tracking-tight">
            KigaliBus
          </div>
          <div className="text-blue-500 text-[9px] font-semibold uppercase tracking-widest
            leading-none mt-0.5">
            Real-Time
          </div>
        </div>
      </div>

      {/* Location pill */}
      <div
        className="flex-1 px-3 py-2 rounded-2xl pointer-events-none"
        style={card}
      >
        {locating ? (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
            <span className="text-amber-600 text-xs font-medium">Detecting location…</span>
          </div>
        ) : locationError ? (
          <div className="flex items-center gap-2">
            <WifiOff size={11} className="text-red-400 flex-shrink-0" />
            <span className="text-red-500 text-xs truncate">{locationError}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
            <span className="text-green-700 text-xs font-medium">Location active</span>
            <Wifi size={11} className="text-green-400 ml-auto" />
          </div>
        )}
      </div>

      {/* Recenter */}
      <button
        onClick={onRecenter}
        title="Re-center on my location"
        className="w-10 h-10 rounded-2xl flex items-center justify-center
          pointer-events-auto transition-all duration-200 hover:scale-105 active:scale-95"
        style={{
          background: "rgba(37,99,235,0.12)",
          border:     "1px solid rgba(37,99,235,0.30)",
          backdropFilter: "blur(12px)",
          boxShadow:  "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        <Locate size={17} className="text-blue-600" />
      </button>
    </div>
  );
}
