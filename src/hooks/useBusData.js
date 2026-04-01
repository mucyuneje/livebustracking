/**
 * useBusData.js — v8
 * - useGeolocation: explicit mobile permission request with prompt UI state
 * - useNearestRoute: auto-selects closest route to user
 * - useAllBusesLive: polls all routes every 3s
 */
import { useState, useEffect, useCallback, useRef } from "react";
import {
  getBuses, simulateBusMovement,
  STOPS_BY_ROUTE, ROUTES, ALL_STOPS,
} from "../api/mockData";
import { getNearbyStops, haversineKm } from "../utils/utils";

const KIGALI_CENTER = { lat: -1.9441, lng: 30.0619 };

// ─── Geolocation — asks permission explicitly, with state for UI ──
export function useGeolocation() {
  const [userLocation,    setUserLocation]    = useState(null);
  const [locationError,   setLocationError]   = useState(null);
  const [locating,        setLocating]        = useState(false);
  const [permissionState, setPermissionState] = useState("prompt"); // "prompt"|"granted"|"denied"

  // Try to read permission state (supported in most browsers)
  useEffect(() => {
    if (!navigator.permissions) return;
    navigator.permissions.query({ name: "geolocation" }).then((result) => {
      setPermissionState(result.state);
      result.onchange = () => setPermissionState(result.state);
    }).catch(() => {});
  }, []);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported on this device");
      setUserLocation(KIGALI_CENTER);
      setPermissionState("denied");
      return;
    }
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
        setPermissionState("granted");
      },
      (err) => {
        const msg =
          err.code === 1 ? "Location permission denied" :
          err.code === 2 ? "Location unavailable" :
          "Location request timed out";
        setLocationError(msg);
        setUserLocation(KIGALI_CENTER);
        setLocating(false);
        setPermissionState("denied");
      },
      { timeout: 12000, maximumAge: 60000, enableHighAccuracy: true }
    );
  }, []);

  // Auto-request if already granted
  useEffect(() => {
    if (permissionState === "granted") {
      requestLocation();
    }
  }, [permissionState]); // eslint-disable-line

  return { userLocation, locationError, locating, permissionState, requestLocation };
}

// ─── Auto-detect nearest route from user position ─────────────
export function useNearestRoute(userLocation) {
  const [nearestRouteId, setNearestRouteId] = useState(null);

  useEffect(() => {
    if (!userLocation) return;
    let bestRouteId = null;
    let bestDist = Infinity;

    ROUTES.forEach((route) => {
      const stops = STOPS_BY_ROUTE[route.id] ?? [];
      stops.forEach((stop) => {
        const d = haversineKm(userLocation.lat, userLocation.lng, stop.lat, stop.lng);
        if (d < bestDist) { bestDist = d; bestRouteId = route.id; }
      });
    });

    setNearestRouteId(bestRouteId);
  }, [userLocation?.lat, userLocation?.lng]); // eslint-disable-line

  return nearestRouteId;
}

// ─── Nearby stops ────────────────────────────────────────────
export function useNearbyStops(userLocation, radiusKm = 3) {
  const [nearbyStops, setNearbyStops] = useState([]);
  useEffect(() => {
    if (!userLocation) return;
    setNearbyStops(getNearbyStops(ALL_STOPS, userLocation.lat, userLocation.lng, radiusKm));
  }, [userLocation, radiusKm]);
  return nearbyStops;
}

// ─── All buses live, 3s polling ──────────────────────────────
export function useAllBusesLive(userLocation) {
  const [buses,   setBuses]   = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const results = await Promise.all(
        ROUTES.map(async (route) => {
          const stops = STOPS_BY_ROUTE[route.id] ?? [];
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
    }, 3000); // 3s refresh for smooth movement
    return () => clearInterval(id);
  }, [fetchAll]);

  return { buses, loading };
}

// ─── Buses for a specific stop ───────────────────────────────
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
  }, [stop?.id, stop?.routeId]); // eslint-disable-line

  useEffect(() => { setBuses([]); fetch(); }, [fetch]);
  useEffect(() => {
    if (!stop) return;
    const id = setInterval(() => {
      simulateBusMovement();
      if (stopRef.current) fetch();
    }, 3000);
    return () => clearInterval(id);
  }, [stop?.id, fetch]); // eslint-disable-line

  return { buses, loading, lastUpdated, refresh: fetch };
}
