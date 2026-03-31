/**
 * NavControls.jsx — Right-side floating nav buttons.
 * Light theme. Zoom, recenter, nearest stop, toggle buses.
 */
import React from "react";
import { Plus, Minus, Locate, Bus, Navigation, Layers } from "lucide-react";

const btn = {
  background:   "rgba(255,255,255,0.94)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  border:       "1px solid rgba(0,0,0,0.08)",
  boxShadow:    "0 2px 10px rgba(0,0,0,0.09)",
};

function NavBtn({ onClick, title, active, activeColor, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="w-11 h-11 flex items-center justify-center rounded-2xl
        transition-all duration-200 hover:scale-105 active:scale-95"
      style={{
        ...btn,
        background: active ? `${activeColor ?? "#2563EB"}18` : btn.background,
        border:     active ? `1px solid ${activeColor ?? "#2563EB"}40` : btn.border,
      }}
    >
      {children}
    </button>
  );
}

export default function NavControls({
  onZoomIn, onZoomOut,
  onRecenter, onGoNearest,
  showBuses, onToggleBuses,
  showAllRoutes, onToggleRoutes,
  nearestStopName,
}) {
  return (
    <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20
      flex flex-col gap-2 pointer-events-none">

      {/* Zoom */}
      <div className="flex flex-col gap-1.5 pointer-events-auto">
        <NavBtn onClick={onZoomIn} title="Zoom in">
          <Plus size={18} className="text-gray-600" />
        </NavBtn>
        <NavBtn onClick={onZoomOut} title="Zoom out">
          <Minus size={18} className="text-gray-600" />
        </NavBtn>
      </div>

      <div className="h-px bg-gray-200 mx-1" />

      {/* Location */}
      <div className="flex flex-col gap-1.5 pointer-events-auto">
        <NavBtn onClick={onRecenter} title="Center on my location" active activeColor="#2563EB">
          <Locate size={17} className="text-blue-600" />
        </NavBtn>
        {nearestStopName && (
          <NavBtn onClick={onGoNearest} title={`Nearest stop: ${nearestStopName}`}>
            <Navigation size={16} className="text-amber-500" />
          </NavBtn>
        )}
      </div>

      <div className="h-px bg-gray-200 mx-1" />

      {/* Toggles */}
      <div className="flex flex-col gap-1.5 pointer-events-auto">
        <NavBtn
          onClick={onToggleBuses}
          title={showBuses ? "Hide buses" : "Show buses"}
          active={showBuses}
          activeColor="#EA580C"
        >
          <Bus size={16} className={showBuses ? "text-orange-500" : "text-gray-400"} />
        </NavBtn>
        <NavBtn
          onClick={onToggleRoutes}
          title={showAllRoutes ? "Nearby stops only" : "Show all stops"}
          active={showAllRoutes}
          activeColor="#7C3AED"
        >
          <Layers size={16} className={showAllRoutes ? "text-purple-600" : "text-gray-400"} />
        </NavBtn>
      </div>
    </div>
  );
}
