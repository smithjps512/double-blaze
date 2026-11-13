"use client";

import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { Circle, CircleMarker, MapContainer, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import type { LatLng } from "@/lib/geo";

export interface MapPoint {
  id: string;
  point: LatLng;
  kind: "lost" | "found" | "reunited" | "exact";
  label: string;
  href?: string;
}

const COLOR: Record<MapPoint["kind"], string> = {
  lost: "#D9481F",
  found: "#1F4E4A",
  reunited: "#C99A12",
  exact: "#1E1B18",
};

/**
 * OpenStreetMap tiles: no key needed, attribution required. Their usage
 * policy limits heavy traffic; switch to a paid tile provider at scale
 * (build plan, Phase 2 notes).
 */
export default function LeafletMap({
  center,
  zoom = 13,
  points = [],
  radius,
  picked,
  onPick,
  className = "h-80",
}: {
  center: LatLng;
  zoom?: number;
  points?: MapPoint[];
  /** Draw each public point as a circle of this many meters (approximate area). */
  radius?: number;
  picked?: LatLng | null;
  onPick?: (p: LatLng) => void;
  className?: string;
}) {
  return (
    <MapContainer center={[center.lat, center.lng]} zoom={zoom} scrollWheelZoom={false} className={`z-0 w-full rounded-3xl ${className}`}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {points.map((p) =>
        radius && p.kind !== "exact" ? (
          <Circle key={p.id} center={[p.point.lat, p.point.lng]} radius={radius} pathOptions={{ color: COLOR[p.kind], fillOpacity: 0.2 }}>
            <Popup>{p.href ? <a href={p.href}>{p.label}</a> : p.label}</Popup>
          </Circle>
        ) : (
          <CircleMarker key={p.id} center={[p.point.lat, p.point.lng]} radius={9} pathOptions={{ color: "#fff", weight: 2, fillColor: COLOR[p.kind], fillOpacity: 1 }}>
            <Popup>{p.href ? <a href={p.href}>{p.label}</a> : p.label}</Popup>
          </CircleMarker>
        ),
      )}
      {picked && (
        <CircleMarker center={[picked.lat, picked.lng]} radius={10} pathOptions={{ color: "#fff", weight: 3, fillColor: "#D9481F", fillOpacity: 1 }} />
      )}
      {onPick && <ClickToPick onPick={onPick} />}
      {picked && <KeepInView point={picked} />}
    </MapContainer>
  );
}

function ClickToPick({ onPick }: { onPick: (p: LatLng) => void }) {
  useMapEvents({ click: (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }) });
  return null;
}

/** Pans to a picked spot that is off screen (e.g. after "use where I am"), without moving the map on every tap. */
function KeepInView({ point }: { point: LatLng }) {
  const map = useMap();
  useEffect(() => {
    if (!map.getBounds().contains([point.lat, point.lng])) map.setView([point.lat, point.lng], 16);
  }, [map, point]);
  return null;
}
