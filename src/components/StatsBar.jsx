/**
 * StatsBar.jsx
 * Quick summary stats shown below the header.
 */

import React from "react";
import { Bus, MapPin, Route, Activity } from "lucide-react";
import { ROUTES, STOPS_BY_ROUTE } from "../api/mockData";

export default function StatsBar() {
  const totalRoutes = ROUTES.length;
  const totalStops  = Object.values(STOPS_BY_ROUTE).flat().length;
  const totalBuses  = totalRoutes * 3; // 3 per route

  const stats = [
    { icon: Route,    label: "Routes",       value: totalRoutes },
    { icon: MapPin,   label: "Stops",        value: totalStops  },
    { icon: Bus,      label: "Active Buses", value: totalBuses  },
    { icon: Activity, label: "Update Freq",  value: "10s"       },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map(({ icon: Icon, label, value }) => (
        <div
          key={label}
          className="rounded-xl bg-white/4 border border-white/8 px-4 py-3 flex items-center gap-3"
        >
          <Icon size={16} className="text-orange-400/70 flex-shrink-0" />
          <div>
            <p className="text-white font-bold text-lg leading-none">{value}</p>
            <p className="text-white/35 text-xs mt-0.5">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}