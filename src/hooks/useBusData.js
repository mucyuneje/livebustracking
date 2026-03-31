/**
 * useBusData.js — React hooks for geolocation, stops, and live buses.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import {
  getBuses,
  simulateBusMovement,
  STOPS_BY_ROUTE,
  ROUTES,
  ALL_STOPS,
} from "../api/mockData";
import { getNearbyStops, haversineKm } from "../utils/utils";

const KIGALI_CENTER = { lat: -1.9441, lng: 30.0619 };

// ─── Geolocation ──────────────────────────────────────────────
export function useGeolocation() {
  const [userLocation,  setUserLocation]  = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [locating,      setLocating]      = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported");
      setUserLocation(KIGALI_CENTER);
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocationError("Location access denied — showing Kigali centre");
        setUserLocation(KIGALI_CENTER);
        setLocating(false);
      },
      { timeout: 8000, maximumAge: 30000 }
    );
  }, []);

  return { userLocation, locationError, locating };
}

// ─── Nearby stops (all routes) ────────────────────────────────
export function useNearbyStops(userLocation, radiusKm = 3) {
  const [nearbyStops, setNearbyStops] = useState([]);

  useEffect(() => {
    if (!userLocation) return;
    const nearby = getNearbyStops(ALL_STOPS, userLocation.lat, userLocation.lng, radiusKm);
    setNearbyStops(nearby);
  }, [userLocation, radiusKm]);

  return nearbyStops;
}

// ─── All live buses, all routes, 10s polling ─────────────────
export function useAllBusesLive(userLocation) {
  const [buses,   setBuses]   = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const results = await Promise.all(
        ROUTES.map(async (route) => {
          const stops = STOPS_BY_ROUTE[route.id] ?? [];
          // ETA target = stop nearest to user on this route
          let target = stops[0];
          if (userLocation && stops.length) {
            target = stops.reduce((best, s) => {
              const d  = haversineKm(userLocation.lat, userLocation.lng, s.lat, s.lng);
              const bd = haversineKm(userLocation.lat, userLocation.lng, best.lat, best.lng);
              return d < bd ? s : best;
            }, stops[0]);
          }
          const buses = await getBuses(route.id, target?.id);
          return buses.map((b) => ({
            ...b,
            routeColor: route.color,
            routeName:  route.name,
            shortCode:  route.shortCode,
          }));
        })
      );
      setBuses(results.flat());
    } catch (e) {
      console.error("Bus fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, [userLocation]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    const id = setInterval(() => {
      simulateBusMovement();
      fetchAll();
    }, 10_000);
    return () => clearInterval(id);
  }, [fetchAll]);

  return { buses, loading };
}

// ─── Buses for a specific stop (bottom panel) ─────────────────
export function useBusesForStop(stop) {
  const [buses,       setBuses]       = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const stopRef = useRef(stop);
  stopRef.current = stop;

  const fetch = useCallback(async () => {
    if (!stop) return;
    setLoading(true);
    try {
      const data = await getBuses(stop.routeId, stop.id);
      const route = ROUTES.find((r) => r.id === stop.routeId);
      setBuses(data.map((b) => ({ ...b, routeColor: route?.color, routeName: route?.name })));
      setLastUpdated(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [stop?.id, stop?.routeId]);

  useEffect(() => { setBuses([]); fetch(); }, [fetch]);

  useEffect(() => {
    if (!stop) return;
    const id = setInterval(() => {
      simulateBusMovement();
      if (stopRef.current) fetch();
    }, 10_000);
    return () => clearInterval(id);
  }, [stop?.id, fetch]);

  return { buses, loading, lastUpdated, refresh: fetch };
}
