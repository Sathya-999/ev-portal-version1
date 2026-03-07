import React, { useState, useEffect } from "react";
import { DashboardLayout } from "./DashboardLayout";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { Zap, MapPin, Navigation } from "lucide-react";

// Fix default marker icons for leaflet + bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const availableIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const busyIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const userIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const RecenterMap = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  useEffect(() => { map.setView([lat, lng], 13); }, [lat, lng, map]);
  return null;
};

// Haversine
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

interface Station {
  id: number;
  station_name: string;
  latitude: number;
  longitude: number;
  available_chargers: number;
  price_per_kwh: number;
  distance?: number;
}

const API_BASE = import.meta.env.VITE_API_URL || "";

const StationsMap: React.FC = () => {
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const defaultCenter = { lat: 13.0827, lng: 80.2707 };

  useEffect(() => {
    const loadStations = async (lat: number, lng: number) => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/api/stations?lat=${lat}&lng=${lng}&radius=50`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          setStations(await res.json());
        }
      } catch {
        setStations([]);
      }
    };

    if (!navigator.geolocation) {
      toast.error("Geolocation not supported. Showing default area.");
      loadStations(defaultCenter.lat, defaultCenter.lng);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLoc({ lat: latitude, lng: longitude });
        loadStations(latitude, longitude);
      },
      () => {
        toast.error("Location access denied. Showing default area.");
        loadStations(defaultCenter.lat, defaultCenter.lng);
      }
    );
  }, []);

  const center = userLoc || defaultCenter;
  const selected = stations.find((s) => s.id === selectedId);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Stations Map</h1>
            <p className="text-gray-500 font-medium mt-1">Interactive map — click a marker to see details.</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
            <span className="w-3 h-3 bg-green-500 rounded-full inline-block" /> Available
            <span className="w-3 h-3 bg-red-500 rounded-full inline-block ml-2" /> Full
            <span className="w-3 h-3 bg-blue-500 rounded-full inline-block ml-2" /> You
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Map */}
          <div className="lg:col-span-3">
            <Card className="border-none shadow-xl overflow-hidden rounded-2xl h-[600px]">
              <MapContainer center={[center.lat, center.lng]} zoom={13} scrollWheelZoom className="h-full w-full z-0">
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {userLoc && <RecenterMap lat={userLoc.lat} lng={userLoc.lng} />}

                {/* User Location Marker */}
                {userLoc && (
                  <Marker position={[userLoc.lat, userLoc.lng]} icon={userIcon}>
                    <Popup><strong>Your Location</strong></Popup>
                  </Marker>
                )}

                {/* Station Markers */}
                {stations.map((s) => (
                  <Marker
                    key={s.id}
                    position={[s.latitude, s.longitude]}
                    icon={s.available_chargers > 0 ? availableIcon : busyIcon}
                    eventHandlers={{ click: () => setSelectedId(s.id) }}
                  >
                    <Popup>
                      <div className="text-sm space-y-2 min-w-[200px]">
                        <p className="font-black text-gray-900">{s.station_name}</p>
                        {s.distance != null && (
                          <p className="text-xs font-bold text-blue-600">{s.distance} km away</p>
                        )}
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-emerald-600">
                            {s.available_chargers} chargers available
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">₹{s.price_per_kwh}/kWh</p>
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${s.latitude},${s.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full mt-1 px-3 py-2 bg-[#5F259F] text-white text-xs font-black rounded-lg hover:bg-[#4A1D7A] transition-colors text-center"
                        >
                          Get Directions
                        </a>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </Card>
          </div>

          {/* Station List Sidebar — sorted nearest first */}
          <div className="lg:col-span-1 space-y-4 max-h-[600px] overflow-y-auto pr-1">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
              {stations.length} Stations (nearest first)
            </p>
            {stations.map((s) => (
              <div
                key={s.id}
                onClick={() => setSelectedId(s.id)}
                className={`p-4 bg-white rounded-2xl shadow-sm border-2 cursor-pointer transition-all hover:shadow-md ${
                  selectedId === s.id ? "border-blue-600 shadow-blue-100" : "border-transparent"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl ${s.available_chargers > 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
                    <Zap size={16} fill="currentColor" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm text-gray-900 truncate">{s.station_name}</p>
                    <p className="text-[10px] text-gray-400 font-bold mt-0.5 truncate">
                      {s.latitude.toFixed(4)}, {s.longitude.toFixed(4)}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] font-black text-gray-500">
                        {s.distance != null ? `${s.distance} km` : "--"}
                      </span>
                      <span className="text-[10px] font-black text-emerald-600">
                        ₹{s.price_per_kwh}/kWh
                      </span>
                      <span className="text-[10px] font-black text-blue-600">
                        {s.available_chargers} avail
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StationsMap;
