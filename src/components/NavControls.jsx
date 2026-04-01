/**
 * NavControls.jsx — v10
 * NEW: Map style switcher (Light / Dark / Satellite)
 * NEW: Map rotation toggle (CSS rotate on container)
 * NEW: Compass rose that shows current rotation
 */
import React, { useState } from "react";
import { Plus, Minus, Locate, Bus, Navigation, Layers, RotateCw } from "lucide-react";

const glass = {
  background: "rgba(255,255,255,0.94)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  border: "1px solid rgba(0,0,0,0.08)",
  boxShadow: "0 2px 10px rgba(0,0,0,0.10)",
};

function NavBtn({ onClick, title, active, activeColor = "#2563EB", children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="w-11 h-11 flex items-center justify-center rounded-2xl
        transition-all duration-200 hover:scale-105 active:scale-95"
      style={{
        ...glass,
        background: active ? `${activeColor}18` : glass.background,
        border: active ? `1px solid ${activeColor}40` : glass.border,
      }}
    >
      {children}
    </button>
  );
}

const MAP_STYLES = [
  { id: "light",     label: "Light",     icon: "☀️" },
  { id: "dark",      label: "Dark",      icon: "🌙" },
  { id: "satellite", label: "Satellite", icon: "🛰️" },
];

export default function NavControls({
  onZoomIn, onZoomOut,
  onRecenter, onGoNearest,
  showBuses, onToggleBuses,
  nearestStopName,
  mapStyle, onMapStyleChange,
  rotation, onRotationChange,
}) {
  const [showStylePanel, setShowStylePanel] = useState(false);

  return (
    <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20
      flex flex-col gap-2 pointer-events-none">

      {/* ── Zoom ──────────────────────────────────────────── */}
      <div className="flex flex-col gap-1.5 pointer-events-auto">
        <NavBtn onClick={onZoomIn} title="Zoom in">
          <Plus size={18} className="text-gray-600" />
        </NavBtn>
        <NavBtn onClick={onZoomOut} title="Zoom out">
          <Minus size={18} className="text-gray-600" />
        </NavBtn>
      </div>

      <div className="h-px bg-gray-200 mx-1" />

      {/* ── Location ──────────────────────────────────────── */}
      <div className="flex flex-col gap-1.5 pointer-events-auto">
        <NavBtn onClick={onRecenter} title="Center on my location" active activeColor="#2563EB">
          <Locate size={17} className="text-blue-600" />
        </NavBtn>
        {nearestStopName && (
          <NavBtn onClick={onGoNearest} title={`Nearest: ${nearestStopName}`}>
            <Navigation size={16} className="text-amber-500" />
          </NavBtn>
        )}
      </div>

      <div className="h-px bg-gray-200 mx-1" />

      {/* ── Toggles ───────────────────────────────────────── */}
      <div className="flex flex-col gap-1.5 pointer-events-auto">
        <NavBtn
          onClick={onToggleBuses}
          title={showBuses ? "Hide buses" : "Show buses"}
          active={showBuses} activeColor="#EA580C"
        >
          <Bus size={16} className={showBuses ? "text-orange-500" : "text-gray-400"} />
        </NavBtn>
      </div>

      <div className="h-px bg-gray-200 mx-1" />

      {/* ── Map Style ─────────────────────────────────────── */}
      <div className="relative flex flex-col gap-1.5 pointer-events-auto">
        <NavBtn
          onClick={() => setShowStylePanel((v) => !v)}
          title="Map style"
          active={showStylePanel} activeColor="#7C3AED"
        >
          <Layers size={16} className={showStylePanel ? "text-purple-600" : "text-gray-500"} />
        </NavBtn>

        {showStylePanel && (
          <div
            className="absolute right-14 top-0 rounded-2xl overflow-hidden"
            style={{ ...glass, width: 148, boxShadow: "0 8px 24px rgba(0,0,0,0.14)" }}
          >
            <div className="px-3 pt-3 pb-1">
              <p className="text-gray-500 text-[9px] font-800 uppercase tracking-widest mb-2">
                Map Style
              </p>
              {MAP_STYLES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { onMapStyleChange?.(s.id); setShowStylePanel(false); }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl mb-1
                    transition-all duration-150 text-left"
                  style={{
                    background: mapStyle === s.id ? "rgba(124,58,237,0.10)" : "transparent",
                    border: mapStyle === s.id ? "1px solid rgba(124,58,237,0.25)" : "1px solid transparent",
                  }}
                >
                  <span className="text-base leading-none">{s.icon}</span>
                  <span className="text-gray-700 text-xs font-semibold">{s.label}</span>
                  {mapStyle === s.id && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-purple-600 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>

            {/* ── Rotation control ───────────────────────── */}
            <div className="px-3 pb-3 pt-1 border-t border-gray-100 mt-1">
              <p className="text-gray-500 text-[9px] font-800 uppercase tracking-widest mb-2 mt-2">
                Rotation
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="range" min="0" max="360" step="5"
                  value={rotation ?? 0}
                  onChange={(e) => onRotationChange?.(Number(e.target.value))}
                  className="flex-1 h-1.5 rounded-full accent-purple-600"
                  style={{ accentColor: "#7C3AED" }}
                />
                <button
                  onClick={() => onRotationChange?.(0)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center
                    text-gray-500 transition-all hover:bg-gray-100"
                  title="Reset rotation"
                >
                  <RotateCw size={13} />
                </button>
              </div>
              <p className="text-gray-400 text-[9px] mt-1 text-center">{rotation ?? 0}°</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Compass rose ──────────────────────────────────── */}
      {(rotation ?? 0) !== 0 && (
        <div className="pointer-events-auto">
          <button
            onClick={() => onRotationChange?.(0)}
            title="Reset map north"
            className="w-11 h-11 flex items-center justify-center rounded-2xl
              transition-all duration-200 hover:scale-105 active:scale-95"
            style={glass}
          >
            <svg
              width="22" height="22" viewBox="0 0 22 22"
              style={{ transform: `rotate(${-(rotation ?? 0)}deg)`, transition: "transform 0.2s" }}
            >
              {/* N arrow red */}
              <polygon points="11,2 13.5,11 11,9 8.5,11" fill="#DC2626"/>
              {/* S arrow gray */}
              <polygon points="11,20 13.5,11 11,13 8.5,11" fill="#94A3B8"/>
              <circle cx="11" cy="11" r="2" fill="#1E293B"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
