import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";

export interface UserLocation {
  lat: number | null;
  lng: number | null;
  city: string;
  locality: string;
  address: string;
  source: "gps" | "manual" | "none";
}

export type PermissionState = "unknown" | "granted" | "denied" | "prompt";

interface LocationContextType {
  location: UserLocation;
  permission: PermissionState;
  isLocating: boolean;
  sheetOpen: boolean;
  openSheet: () => void;
  closeSheet: () => void;
  detectLocation: () => Promise<void>;
  setManualLocation: (city: string, locality?: string) => void;
  distanceFrom: (lat?: number | null, lng?: number | null) => number | null;
}

const STORAGE_KEY = "ls_user_location";
const ASKED_KEY = "ls_location_asked";

const emptyLocation: UserLocation = {
  lat: null,
  lng: null,
  city: "",
  locality: "",
  address: "",
  source: "none",
};

const LocationContext = createContext<LocationContextType | undefined>(undefined);

function readStored(): UserLocation {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyLocation;
    return { ...emptyLocation, ...JSON.parse(raw) } as UserLocation;
  } catch {
    return emptyLocation;
  }
}

async function reverseGeocode(lat: number, lng: number) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=14`,
      { headers: { Accept: "application/json" } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const a = data.address ?? {};
    return {
      city: a.city || a.town || a.village || a.county || a.state_district || "",
      locality: a.suburb || a.neighbourhood || a.residential || a.hamlet || "",
      address: data.display_name || "",
    };
  } catch {
    return null;
  }
}

export const LocationProvider = ({ children }: { children: ReactNode }) => {
  const [location, setLocation] = useState<UserLocation>(() => readStored());
  const [permission, setPermission] = useState<PermissionState>("unknown");
  const [isLocating, setIsLocating] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const persist = (next: UserLocation) => {
    setLocation(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable — keep in memory only */
    }
  };

  const detectLocation = useCallback(async () => {
    if (!("geolocation" in navigator)) {
      setPermission("denied");
      return;
    }
    setIsLocating(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000,
        })
      );
      const { latitude, longitude } = pos.coords;
      const geo = await reverseGeocode(latitude, longitude);
      persist({
        lat: latitude,
        lng: longitude,
        city: geo?.city ?? "",
        locality: geo?.locality ?? "",
        address: geo?.address ?? "",
        source: "gps",
      });
      setPermission("granted");
      setSheetOpen(false);
    } catch {
      setPermission("denied");
    } finally {
      setIsLocating(false);
      localStorage.setItem(ASKED_KEY, "1");
    }
  }, []);

  const setManualLocation = useCallback((city: string, locality = "") => {
    persist({
      lat: null,
      lng: null,
      city,
      locality,
      address: [locality, city].filter(Boolean).join(", "),
      source: "manual",
    });
    localStorage.setItem(ASKED_KEY, "1");
    setSheetOpen(false);
  }, []);

  const distanceFrom = useCallback(
    (lat?: number | null, lng?: number | null) => {
      if (location.lat == null || location.lng == null || lat == null || lng == null) return null;
      const R = 6371;
      const dLat = ((lat - location.lat) * Math.PI) / 180;
      const dLng = ((lng - location.lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((location.lat * Math.PI) / 180) *
          Math.cos((lat * Math.PI) / 180) *
          Math.sin(dLng / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    },
    [location.lat, location.lng]
  );

  // Ask once on first visit
  useEffect(() => {
    if (localStorage.getItem(ASKED_KEY)) return;
    if (location.source !== "none") return;
    const t = setTimeout(() => setSheetOpen(true), 1200);
    return () => clearTimeout(t);
  }, [location.source]);

  // Read browser permission state where supported
  useEffect(() => {
    if (!navigator.permissions?.query) return;
    navigator.permissions
      .query({ name: "geolocation" as PermissionName })
      .then((status) => {
        setPermission(status.state as PermissionState);
        status.onchange = () => setPermission(status.state as PermissionState);
      })
      .catch(() => undefined);
  }, []);

  return (
    <LocationContext.Provider
      value={{
        location,
        permission,
        isLocating,
        sheetOpen,
        openSheet: () => setSheetOpen(true),
        closeSheet: () => {
          localStorage.setItem(ASKED_KEY, "1");
          setSheetOpen(false);
        },
        detectLocation,
        setManualLocation,
        distanceFrom,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useUserLocation = () => {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useUserLocation must be used within LocationProvider");
  return ctx;
};
