/**
 * Header.jsx
 * Sticky top navigation bar for the Kigali Bus Arrival System.
 */

import React from "react";
import { Bus, MapPin } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/8 bg-[#0a0f1a]/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
            <Bus size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-white font-black text-base tracking-tight leading-none">
              KigaliBus
            </h1>
            <p className="text-orange-400/70 text-[10px] font-medium tracking-widest uppercase leading-none mt-0.5">
              Real-Time Arrivals
            </p>
          </div>
        </div>

        {/* Location badge */}
        <div className="flex items-center gap-1.5 text-white/40 text-xs">
          <MapPin size={12} className="text-orange-400" />
          <span>Kigali, Rwanda</span>
        </div>
      </div>
    </header>
  );
}