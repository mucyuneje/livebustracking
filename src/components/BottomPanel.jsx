/**
 * BottomPanel.jsx — Slide-up panel: buses approaching selected stop.
 * Light theme. Shows top-3 buses with ETA + notify.
 */
import React, { useState, useEffect } from "react";
import { X, MapPin, Bus, MessageSquare, RefreshCw, CheckCircle } from "lucide-react";
import { useBusesForStop } from "../hooks/useBusData";
import {
  sortByEta, formatEta, formatDistance, formatTime,
  etaColor, etaBadgeBg, etaColorClass, buildSmsMessage,
} from "../utils/utils";
import { ROUTES } from "../api/mockData";

export default function BottomPanel({ stop, onClose }) {
  const { buses, loading, lastUpdated, refresh } = useBusesForStop(stop);
  const [visible,     setVisible]     = useState(false);
  const [notifiedBus, setNotifiedBus] = useState(null);

  useEffect(() => {
    if (stop) requestAnimationFrame(() => setVisible(true));
    else      setVisible(false);
  }, [stop]);

  if (!stop) return null;

  const route = ROUTES.find((r) => r.id === stop.routeId);
  const color = route?.color ?? "#2563EB";
  const top3  = sortByEta(buses).slice(0, 3);

  const handleNotify = (bus) => {
    alert(`📱 SMS Sent!\n\n${buildSmsMessage(bus.id, bus.etaToNextStop, stop.name)}`);
    setNotifiedBus(bus.id);
    setTimeout(() => setNotifiedBus(null), 4000);
  };

  const handleClose = () => { setVisible(false); setTimeout(onClose, 280); };

  return (
    <>
      {/* Dim backdrop */}
      <div
        className="fixed inset-0 z-30 transition-opacity duration-300"
        style={{
          background:    "rgba(0,0,0,0.25)",
          backdropFilter: "blur(1px)",
          opacity:       visible ? 1 : 0,
          pointerEvents: visible ? "auto" : "none",
        }}
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 transition-transform duration-300 ease-out"
        style={{ transform: visible ? "translateY(0)" : "translateY(100%)" }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-2 pb-0" onClick={handleClose}>
          <div className="w-10 h-1.5 rounded-full bg-gray-300 cursor-pointer
            hover:bg-gray-400 transition-colors" />
        </div>

        <div
          className="mx-0 md:mx-auto md:max-w-xl rounded-t-3xl overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.98)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderTop:    `3px solid ${color}`,
            borderLeft:   "1px solid rgba(0,0,0,0.07)",
            borderRight:  "1px solid rgba(0,0,0,0.07)",
            boxShadow:    "0 -8px 40px rgba(0,0,0,0.12)",
          }}
        >
          {/* Header */}
          <div className="px-5 pt-4 pb-3 flex items-start justify-between gap-3
            border-b border-gray-100">
            <div className="flex items-start gap-3 min-w-0">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center
                  flex-shrink-0"
                style={{ background: `${color}15`, border: `1.5px solid ${color}35` }}
              >
                <MapPin size={18} style={{ color }} />
              </div>
              <div className="min-w-0">
                <h3 className="text-gray-900 font-bold text-base leading-tight truncate">
                  {stop.name}
                </h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span
                    className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                    style={{ background: `${color}18`, color }}
                  >
                    {route?.name ?? "Bus Stop"}
                  </span>
                  {stop.distanceKm != null && (
                    <span className="text-gray-400 text-xs">
                      {formatDistance(stop.distanceKm)} away
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {lastUpdated && (
                <button
                  onClick={refresh}
                  title="Refresh"
                  className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-200 flex
                    items-center justify-center hover:bg-gray-200 transition-colors
                    text-gray-400 hover:text-gray-600"
                >
                  <RefreshCw size={13} />
                </button>
              )}
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-200 flex
                  items-center justify-center hover:bg-gray-200 transition-colors
                  text-gray-400 hover:text-gray-700"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Live status bar */}
          <div className="px-5 py-2 flex items-center gap-2 border-b border-gray-50">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-green-700 text-xs font-semibold">Live tracking</span>
            {lastUpdated && (
              <span className="ml-auto text-gray-400 text-xs">
                Updated {formatTime(lastUpdated)}
              </span>
            )}
          </div>

          {/* Bus list */}
          <div className="px-5 py-4 flex flex-col gap-3 max-h-[52vh] overflow-y-auto">
            {loading ? (
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-[88px] rounded-2xl bg-gray-100 animate-pulse" />
                ))}
              </div>
            ) : top3.length === 0 ? (
              <div className="py-10 text-center flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                  <Bus size={22} className="text-gray-300" />
                </div>
                <p className="text-gray-400 text-sm">No buses approaching right now</p>
              </div>
            ) : (
              top3.map((bus, i) => {
                const eta        = bus.etaToNextStop;
                const isNotified = notifiedBus === bus.id;
                return (
                  <div
                    key={bus.id}
                    className="rounded-2xl border p-4 flex items-center gap-4
                      transition-all duration-200 hover:shadow-sm"
                    style={{
                      background:  i === 0 ? `${color}08` : "white",
                      borderColor: i === 0 ? `${color}30` : "#E5E7EB",
                    }}
                  >
                    {/* Rank + bus icon */}
                    <div className="flex flex-col items-center gap-1 flex-shrink-0">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: `${color}18` }}
                      >
                        <Bus size={18} style={{ color }} />
                      </div>
                      <span className="text-gray-400 text-[10px] font-bold">#{i + 1}</span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-gray-900 font-bold font-mono text-sm">
                          {bus.id}
                        </span>
                        <span className="text-gray-400 text-xs">{bus.speed} km/h</span>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span
                          className="font-black text-2xl tabular-nums"
                          style={{ color: etaColor(eta) }}
                        >
                          {formatEta(eta)}
                        </span>
                        {eta <= 3 && (
                          <span className="text-green-600 text-xs font-bold animate-pulse">
                            ARRIVING
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Notify */}
                    <button
                      onClick={() => handleNotify(bus)}
                      className="flex-shrink-0 flex items-center gap-1.5 rounded-xl
                        px-3 py-2 text-xs font-semibold transition-all duration-200 border"
                      style={isNotified ? {
                        background: "#DCFCE7", border: "1px solid #86EFAC", color: "#16A34A",
                      } : {
                        background: "#F9FAFB", border: "1px solid #E5E7EB", color: "#6B7280",
                      }}
                    >
                      {isNotified
                        ? <><CheckCircle size={13} /> Sent!</>
                        : <><MessageSquare size={13} /> Notify</>
                      }
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Safe area */}
          <div className="h-4 md:hidden" />
        </div>
      </div>
    </>
  );
}
