"use client";

import { useEffect, useState } from "react";
import { MapPin, Lock, AlertTriangle } from "lucide-react";

// ── Restaurant location boundary ────────────────────────────────────────
// How to get your coordinates: open Google Maps, find your restaurant,
// right-click the exact spot -> click the "lat, lng" numbers that appear
// at the top of the menu to copy them. Paste the two numbers in below.
const RESTAURANT_LAT = 21.369791; // TODO: replace with your restaurant's latitude
const RESTAURANT_LNG = 80.3772362; // TODO: replace with your restaurant's longitude

// How close someone has to be (in meters) for the menu to unlock.
// GPS is rarely exact, especially indoors — 150-250m is a sane starting
// point. Go too tight (e.g. 20m) and real customers inside the building
// may get rejected because their GPS fix is slightly off.
const ALLOWED_RADIUS_METERS = 150;
// ──────────────────────────────────────────────────────────────────────

type Status =
  | "idle" // waiting for the visitor to tap "Share Location"
  | "checking"
  | "allowed"
  | "too-far"
  | "permission-denied"
  | "unsupported"
  | "error";

type Variant = "food" | "bar";

// Just enough theming to match whichever menu this screen is guarding —
// the food page stays light, the bar page stays dark, so there's no
// jarring flash between this screen and the menu underneath it.
const THEME: Record<Variant, { bg: string; ink: string; inkMuted: string; accent: string; accentSoft: string }> = {
  food: {
    bg: "#fdf6ec",
    ink: "#1a120b",
    inkMuted: "rgba(26,18,11,0.6)",
    accent: "#c1440e",
    accentSoft: "rgba(193,68,14,0.1)",
  },
  bar: {
    bg: "#100d0a",
    ink: "#f3e7d3",
    inkMuted: "rgba(243,231,211,0.6)",
    accent: "#c9a227",
    accentSoft: "rgba(201,162,39,0.12)",
  },
};

function distanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000; // Earth's radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function LocationGate({ children, variant = "food" }: { children: React.ReactNode; variant?: Variant }) {
  const theme = THEME[variant];
  const [status, setStatus] = useState<Status>("idle");
  const [distance, setDistance] = useState<number | null>(null);

  // The actual permission request — this is what makes the browser show
  // its native "Allow this site to use your location?" popup (same family
  // of prompt as camera/mic). Calling it from inside a button's onClick is
  // what makes that popup reliably appear on every device, including
  // iOS Safari and the in-app browsers inside WhatsApp/Instagram/QR-scanner
  // apps — those commonly swallow permission requests that aren't tied to
  // a direct tap.
  const requestLocation = () => {
    setStatus("checking");

    if (!("geolocation" in navigator)) {
      setStatus("unsupported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const d = distanceInMeters(
          pos.coords.latitude,
          pos.coords.longitude,
          RESTAURANT_LAT,
          RESTAURANT_LNG
        );
        setDistance(d);
        setStatus(d <= ALLOWED_RADIUS_METERS ? "allowed" : "too-far");
      },
      (err) => {
        setStatus(err.code === err.PERMISSION_DENIED ? "permission-denied" : "error");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // On return visits, if the browser already remembers "granted" for this
  // site, skip straight to checking — no popup needed, and none will show.
  // (Safari doesn't support this query; it just falls through to "idle" and
  // shows the tap-to-share screen, which works everywhere regardless.)
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setStatus("unsupported");
      return;
    }
    if (navigator.permissions?.query) {
      navigator.permissions
        .query({ name: "geolocation" as PermissionName })
        .then((result) => {
          if (result.state === "granted") requestLocation();
        })
        .catch(() => {
          /* Permissions API not supported for geolocation — stay on "idle" */
        });
    }
  }, []);

  if (status === "allowed") {
    return <>{children}</>;
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center px-6 text-center"
      style={{ background: theme.bg, color: theme.ink }}
    >
      <div className="max-w-sm">
        {status === "idle" && (
          <>
            <div
              className="w-16 h-16 mx-auto mb-5 rounded-full grid place-items-center"
              style={{ background: theme.accentSoft }}
            >
              <MapPin size={28} style={{ color: theme.accent }} />
            </div>
            <p className="font-[family-name:var(--font-display)] text-2xl font-bold mb-2">
              This menu needs your location
            </p>
            <p className="text-sm mb-6" style={{ color: theme.inkMuted }}>
              It only unlocks while you&apos;re at the restaurant. Your browser will ask you
              to confirm — tap &quot;Allow&quot; on that prompt.
            </p>
            <button
              onClick={requestLocation}
              className="inline-flex items-center gap-2 font-semibold text-sm px-6 py-3 rounded-full text-white"
              style={{ background: theme.accent }}
            >
              <MapPin size={16} /> Share My Location
            </button>
          </>
        )}

        {status === "checking" && (
          <>
            <div
              className="w-12 h-12 mx-auto mb-5 rounded-full border-4 animate-spin"
              style={{ borderColor: theme.accentSoft, borderTopColor: theme.accent }}
            />
            <p className="font-semibold text-lg">Finding your location…</p>
            <p className="text-sm mt-2" style={{ color: theme.inkMuted }}>
              This menu is only available on-site.
            </p>
          </>
        )}

        {status === "too-far" && (
          <>
            <div
              className="w-16 h-16 mx-auto mb-5 rounded-full grid place-items-center"
              style={{ background: theme.accentSoft }}
            >
              <MapPin size={28} style={{ color: theme.accent }} />
            </div>
            <p className="font-[family-name:var(--font-display)] text-2xl font-bold mb-2">
              You&apos;re not at the restaurant
            </p>
            <p className="text-sm mb-6" style={{ color: theme.inkMuted }}>
              This menu only works within {ALLOWED_RADIUS_METERS}m of the restaurant
              {distance !== null && ` — you're about ${Math.round(distance)}m away`}.
            </p>
            <button
              onClick={requestLocation}
              className="font-semibold text-sm px-5 py-2.5 rounded-full text-white"
              style={{ background: theme.accent }}
            >
              Check again
            </button>
          </>
        )}

        {status === "permission-denied" && (
          <>
            <div
              className="w-16 h-16 mx-auto mb-5 rounded-full grid place-items-center"
              style={{ background: theme.accentSoft }}
            >
              <Lock size={28} style={{ color: theme.accent }} />
            </div>
            <p className="font-[family-name:var(--font-display)] text-2xl font-bold mb-2">
              Location access needed
            </p>
            <p className="text-sm mb-6" style={{ color: theme.inkMuted }}>
              You&apos;ll need to allow location access for this site in your browser
              settings, then try again.
            </p>
            <button
              onClick={requestLocation}
              className="font-semibold text-sm px-5 py-2.5 rounded-full text-white"
              style={{ background: theme.accent }}
            >
              Try again
            </button>
          </>
        )}

        {(status === "unsupported" || status === "error") && (
          <>
            <div
              className="w-16 h-16 mx-auto mb-5 rounded-full grid place-items-center"
              style={{ background: theme.accentSoft }}
            >
              <AlertTriangle size={28} style={{ color: theme.accent }} />
            </div>
            <p className="font-[family-name:var(--font-display)] text-2xl font-bold mb-2">
              Couldn&apos;t check your location
            </p>
            <p className="text-sm mb-6" style={{ color: theme.inkMuted }}>
              {status === "unsupported"
                ? "Your browser doesn't support location access."
                : "Something went wrong getting your location."}
            </p>
            <button
              onClick={requestLocation}
              className="font-semibold text-sm px-5 py-2.5 rounded-full text-white"
              style={{ background: theme.accent }}
            >
              Try again
            </button>
          </>
        )}
      </div>
    </main>
  );
}
