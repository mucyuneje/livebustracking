/**
 * BusCard.jsx
 * ─────────────────────────────────────────────────────────────
 * Displays a single bus ETA result card with SMS notification
 * trigger. Designed as a shadcn/ui-style card.
 * ─────────────────────────────────────────────────────────────
 */

import React, { useState } from "react";
import { Bus, Navigation, MessageSquare, Clock, CheckCircle } from "lucide-react";
import { formatEta, etaColorClass, etaBadgeBg, buildSmsMessage } from "../utils/utils";

export default function BusCard({ bus, stopName, routeColor = "#F97316", rank }) {
  const [smsSent, setSmsSent] = useState(false);

  const handleSms = () => {
    const msg = buildSmsMessage(bus.id, bus.etaToNextStop, stopName);
    alert(`📱 SMS Notification Sent!\n\n${msg}`);
    setSmsSent(true);
    setTimeout(() => setSmsSent(false), 4000);
  };

  const eta = bus.etaToNextStop;

  return (
    <div
      className="bus-card relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 flex flex-col gap-3 overflow-hidden transition-all duration-300 hover:border-white/20 hover:bg-white/8 hover:-translate-y-0.5 hover:shadow-xl"
      style={{ boxShadow: `0 0 0 1px ${routeColor}22, 0 4px 24px rgba(0,0,0,0.3)` }}
    >
      {/* Rank badge */}
      <div
        className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
        style={{ background: routeColor }}
      >
        #{rank}
      </div>

      {/* Accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
        style={{ background: routeColor }}
      />

      {/* Header row */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${routeColor}22`, border: `1px solid ${routeColor}44` }}
        >
          <Bus size={20} style={{ color: routeColor }} />
        </div>
        <div>
          <p className="text-white font-bold font-mono tracking-wider text-sm">{bus.id}</p>
          <p className="text-white/40 text-xs">→ {stopName}</p>
        </div>
      </div>

      {/* ETA Highlight */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${etaBadgeBg(eta)}`}>
        <Clock size={14} className={etaColorClass(eta)} />
        <span className={`font-black text-2xl tabular-nums ${etaColorClass(eta)}`}>
          {formatEta(eta)}
        </span>
        {eta <= 3 && (
          <span className="ml-auto text-xs text-green-400 font-semibold animate-pulse">
            ARRIVING
          </span>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-1.5 bg-white/5 rounded-lg px-3 py-1.5">
          <Navigation size={12} className="text-white/40" />
          <span className="text-white/60 text-xs">{bus.speed} km/h</span>
        </div>
        <div className="flex items-center gap-1.5 bg-white/5 rounded-lg px-3 py-1.5">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-white/60 text-xs">Live tracking</span>
        </div>
      </div>

      {/* SMS button */}
      <button
        onClick={handleSms}
        className={`
          w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold
          transition-all duration-200 border
          ${smsSent
            ? "bg-green-500/20 border-green-500/40 text-green-400"
            : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white hover:border-white/20"
          }
        `}
      >
        {smsSent ? (
          <><CheckCircle size={15} /> SMS Sent!</>
        ) : (
          <><MessageSquare size={15} /> Notify via SMS</>
        )}
      </button>
    </div>
  );
}