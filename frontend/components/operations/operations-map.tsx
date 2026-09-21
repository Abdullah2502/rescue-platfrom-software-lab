"use client";

import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import type { DistributionResponse, ShelterResponse } from "@/lib/types";

const shelterIcon = L.divIcon({
  className: "nexora-map-marker",
  html: '<span class="nexora-map-marker__dot nexora-map-marker__dot--shelter"></span>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const distributionIcon = L.divIcon({
  className: "nexora-map-marker",
  html: '<span class="nexora-map-marker__dot nexora-map-marker__dot--distribution"></span>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

export function OperationsMap({
  shelters,
  distributions,
}: {
  shelters: ShelterResponse[];
  distributions: DistributionResponse[];
}) {
  const geocodedDistributions = distributions.filter((item) => item.latitude != null && item.longitude != null);
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-[0_14px_35px_-24px_rgba(15,23,42,0.35)]">
      <MapContainer center={[23.685, 90.3563]} zoom={7} scrollWheelZoom className="h-[520px] w-full" aria-label="Operational map of Bangladesh">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {shelters.map((shelter) => (
          <Marker key={`shelter-${shelter.id}`} position={[shelter.latitude, shelter.longitude]} icon={shelterIcon}>
            <Popup>
              <strong>{shelter.name}</strong><br />
              {shelter.currentOccupancy}/{shelter.capacity} occupied<br />
              {shelter.status} · {shelter.ngoName}<br />
              {shelter.address}
            </Popup>
          </Marker>
        ))}
        {geocodedDistributions.map((distribution) => (
          <Marker key={`distribution-${distribution.id}`} position={[distribution.latitude!, distribution.longitude!]} icon={distributionIcon}>
            <Popup>
              <strong>{distribution.inventoryItemName}</strong><br />
              {distribution.quantity} {distribution.unit} for {distribution.recipientGroup}<br />
              {distribution.locationDescription}<br />
              {distribution.status} · {distribution.ngoName}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <div className="flex flex-wrap items-center gap-5 border-t border-slate-800 px-4 py-3 text-xs text-slate-400">
        <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Emergency shelter</span>
        <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Aid distribution</span>
        <span className="ml-auto">Map tiles require connectivity; cached records remain available offline.</span>
      </div>
    </div>
  );
}
