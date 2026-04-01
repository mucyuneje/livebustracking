/**
 * MapLegend.jsx — Bottom-left floating legend.
 * Light theme. Shows what each icon means.
 */
import React, { useState } from "react";
import { Info } from "lucide-react";
import { ROUTES } from "../api/mockData";

const card = {
  background:   "rgba(255,255,255,0.96)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  border:       "1px solid rgba(0,0,0,0.08)",
  boxShadow:    "0 4px 20px rgba(0,0,0,0.10)",
};

export default function MapLegend({ busCount, stopCount }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="absolute bottom-6 left-4 z-20">

      {/* Collapsed pill */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs
          text-gray-500 hover:text-gray-800 transition-all duration-200"
        style={card}
      >
        <Info size={12} className="text-gray-400" />
        <span className="font-medium">{busCount} buses</span>
        <span className="text-gray-300">·</span>
        <span className="font-medium">{stopCount} stops</span>
      </button>

      {/* Expanded panel */}
      {open && (
        <div
          className="absolute bottom-full mb-2 left-0 p-4 rounded-2xl min-w-[200px]"
          style={card}
        >
          <p className="text-gray-400 font-bold text-[10px] uppercase tracking-wider mb-3">
            Map Legend
          </p>

          {/* Fixed icons */}
          <div className="flex flex-col gap-2.5 mb-3">
            <Row color="#2563EB" type="dot"   label="Your location" />
            <Row color="#16A34A" type="pin"   label="Route start (A)" />
            <Row color="#DC2626" type="pin"   label="Route end (B)" />
            <Row color="#F59E0B" type="pin"   label="Nearest stop" />
            <Row color="#64748B" type="pin"   label="Bus stop" />
            <Row color="#EA580C" type="bus"   label="Live bus" />
          </div>

          {/* Route color key */}
          <div className="border-t border-gray-100 pt-3">
            <p className="text-gray-400 font-bold text-[10px] uppercase tracking-wider mb-2">
              Routes
            </p>
            {ROUTES.map((r) => (
              <div key={r.id} className="flex items-center gap-2 mb-1.5">
                <div
                  className="w-6 h-2 rounded-full flex-shrink-0"
                  style={{ background: r.color }}
                />
                <span className="text-gray-600 text-[11px] leading-tight">{r.name}</span>
              </div>
            ))}
          </div>

          <p className="text-gray-300 text-[10px] mt-3 border-t border-gray-100 pt-2">
            Tap any stop to see ETAs
          </p>
        </div>
      )}
    </div>
  );
}

function Row({ color, type, label }) {
  return (
    <div className="flex items-center gap-2.5">
      {type === "dot" ? (
        <div className="w-4 h-4 rounded-full flex-shrink-0 border-2 border-white shadow-sm"
          style={{ background: color }} />
      ) : type === "bus" ? (
        <svg width="16" height="16" viewBox="0 0 16 16">
          <circle cx="8" cy="8" r="8" fill={color}/>
          <rect x="4" y="4" width="8" height="6" rx="1.5" fill="white" fillOpacity="0.9"/>
        </svg>
      ) : (
        <svg width="12" height="16" viewBox="0 0 12 16">
          <path d="M6 0C2.7 0 0 2.7 0 6c0 4 6 10 6 10s6-6 6-10c0-3.3-2.7-6-6-6z"
            fill={color}/>
        </svg>
      )}
      <span className="text-gray-600 text-[11px]">{label}</span>
    </div>
  );
}
