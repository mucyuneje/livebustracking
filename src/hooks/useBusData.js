/**
 * useBusData.js — v10
 * - useGeolocation: permission-aware, mobile-safe
 * - useNearestRoute: auto picks closest route
 * - useAllBusesLive: 2.5s polling for GPS-like smoothness
 */
import { useState, useEffect, useCallback, useRef } from "react";
import {
  getBuses, getAllBuses, simulateBusMovement,
  OUTBOUND_STOPS, ROUTES, ALL_STOPS,
} from "../api/mockData";
import { getNearbyStops, haversineKm } from "../utils/utils";

const KIGALI_CENTER = { lat: -1.9441, lng: 30.0619 };

// ─── useGeolocation ──────────────────────────────────────────
export function useGeolocation() {
  const [userLocation,    setUserLocation]    = useState(null);
  const [locationError,   setLocationError]   = useState(null);
  const [locating,        setLocating]        = useState(false);
  const [permissionState, setPermissionState] = useState("prompt");

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setPermissionState("unsupported");
      setLocationError("Geolocation not supported");
      setUserLocation(KIGALI_CENTER);
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setPermissionState("granted");
        setLocating(false);
      },
      (err) => {
        const msg = err.code === 1 ? "Location permission denied"
          : err.code === 2 ? "Location unavailable"
          : "Location request timed out";
        setLocationError(msg);
        setUserLocation(KIGALI_CENTER);
        setPermissionState("denied");
        setLocating(false);
      },
      { timeout: 12000, maximumAge: 60000, enableHighAccuracy: true }
    );
  }, []);

  // On mount — check existing permission state
  useEffect(() => {
    if (!navigator.geolocation) {
      setPermissionState("unsupported");
      setUserLocation(KIGALI_CENTER);
      return;
    }
    if (navigator.permissions) {
      navigator.permissions.query({ name: "geolocation" }).then((result) => {
        if (result.state === "granted") {
          setPermissionState("granted");
          requestLocation();
        } else if (result.state === "denied") {
          setPermissionState("denied");
          setLocationError("Location access denied — showing Kigali centre");
          setUserLocation(KIGALI_CENTER);
        } else {
          setPermissionState("prompt");
        }
        result.onchange = () => setPermissionState(result.state);
      }).catch(() => setPermissionState("prompt"));
    } else {
      setPermissionState("prompt");
    }
  }, []); // eslint-disable-line

  return { userLocation, locationError, locating, permissionState, requestLocation };
}

// ─── useNearbyStops ─────────────────────────────────────────
export function useNearbyStops(userLocation, radiusKm = 3) {
  const [nearbyStops, setNearbyStops] = useState([]);
  useEffect(() => {
    if (!userLocation) return;
    setNearbyStops(getNearbyStops(ALL_STOPS, userLocation.lat, userLocation.lng, radiusKm));
  }, [userLocation, radiusKm]);
  return nearbyStops;
}

// ─── useNearestRoute ────────────────────────────────────────
export function useNearestRoute(userLocation) {
  const [nearestRouteId, setNearestRouteId] = useState(null);
  useEffect(() => {
    if (!userLocation) return;
    let bestRouteId = null, bestDist = Infinity;
    ROUTES.forEach((route) => {
      (OUTBOUND_STOPS[route.id] ?? []).forEach((stop) => {
        const d = haversineKm(userLocation.lat, userLocation.lng, stop.lat, stop.lng);
        if (d < bestDist) { bestDist = d; bestRouteId = route.id; }
      });
    });
    setNearestRouteId(bestRouteId);
  }, [userLocation]); // eslint-disable-line
  return nearestRouteId;
}

// ─── useAllBusesLive — 2.5s polling for smooth GPS movement ─
export function useAllBusesLive() {
  const [buses,   setBuses]   = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const raw = await getAllBuses();
      setBuses(raw.map((b) => {
        const route = ROUTES.find((r) => r.id === b.routeId);
        return { ...b, routeColor: route?.color, routeName: route?.name, shortCode: route?.shortCode };
      }));
    } catch (e) {
      console.error("Bus fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    // 2.5s: fast enough for smooth movement, not too heavy
    const id = setInterval(() => {
      simulateBusMovement();
      fetchAll();
    }, 2500);
    return () => clearInterval(id);
  }, [fetchAll]);

  return { buses, loading };
}

// ─── useBusesForStop ─────────────────────────────────────────
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
      const data  = await getBuses(stop.routeId, stop.id);
      const route = ROUTES.find((r) => r.id === stop.routeId);
      setBuses(data.map((b) => ({ ...b, routeColor: route?.color, routeName: route?.name })));
      setLastUpdated(new Date());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [stop?.id, stop?.routeId]); // eslint-disable-line

  useEffect(() => { setBuses([]); fetch(); }, [fetch]);
  useEffect(() => {
    if (!stop) return;
    const id = setInterval(() => {
      simulateBusMovement();
      if (stopRef.current) fetch();
    }, 2500);
    return () => clearInterval(id);
  }, [stop?.id, fetch]); // eslint-disable-line

  return { buses, loading, lastUpdated, refresh: fetch };
}
