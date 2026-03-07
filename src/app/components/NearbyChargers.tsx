import React, { useState, useEffect } from "react";
import { DashboardLayout } from "./DashboardLayout";
import { MapPin, Zap, Navigation, BatteryCharging } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

// Haversine formula — calculate distance in km
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface Station {
  id: number;
  station_name: string;
  latitude: number;
  longitude: number;
  available_chargers: number;
  price_per_kwh: number;
  distance?: number;
  total_slots: number;
  available_slots: number;
}

// ─── Simulated charger data (deterministic per station, with variety) ───
function getSimulatedChargers(stationId: number): { total: number; available: number } {
  // Predefined data for 22 stations showing green / yellow / red variety
  const simData: [number, number][] = [
    [5, 3],  // 1  — green  (3/5 = 60%)
    [6, 0],  // 2  — red    (0/6 = 0%)
    [4, 2],  // 3  — yellow (2/4 = 50%)
    [8, 5],  // 4  — green  (5/8 = 63%)
    [3, 1],  // 5  — yellow (1/3 = 33%)
    [7, 7],  // 6  — green  (7/7 = 100%)
    [5, 0],  // 7  — red    (0/5 = 0%)
    [6, 4],  // 8  — green  (4/6 = 67%)
    [4, 1],  // 9  — yellow (1/4 = 25%)
    [8, 0],  // 10 — red    (0/8 = 0%)
    [5, 5],  // 11 — green  (5/5 = 100%)
    [7, 2],  // 12 — yellow (2/7 = 29%)
    [3, 3],  // 13 — green  (3/3 = 100%)
    [6, 1],  // 14 — yellow (1/6 = 17%)
    [4, 4],  // 15 — green  (4/4 = 100%)
    [8, 3],  // 16 — yellow (3/8 = 38%)
    [5, 0],  // 17 — red    (0/5 = 0%)
    [7, 5],  // 18 — green  (5/7 = 71%)
    [6, 2],  // 19 — yellow (2/6 = 33%)
    [4, 0],  // 20 — red    (0/4 = 0%)
    [3, 2],  // 21 — green  (2/3 = 67%)
    [5, 1],  // 22 — yellow (1/5 = 20%)
  ];
  const idx = (stationId - 1) % simData.length;
  return { total: simData[idx][0], available: simData[idx][1] };
}

// ─── Availability helpers ─────────────────────────────────────
function getAvailabilityStatus(available: number, total: number) {
  if (total === 0) return { label: 'No Data', statusText: 'No Data', color: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400', barColor: 'bg-gray-300' };
  if (available === 0) return { label: 'Full', statusText: 'Full', color: 'bg-red-50 text-red-700', dot: 'bg-red-500', barColor: 'bg-red-500' };
  if (available <= total / 2) return { label: 'Busy', statusText: 'Moderate Load', color: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500', barColor: 'bg-amber-500' };
  return { label: 'Available', statusText: 'Low Load', color: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500', barColor: 'bg-emerald-500' };
}

const API_BASE = import.meta.env.VITE_API_URL || "";

const NearbyChargers: React.FC = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    // 1. Get user location
    const fallbackLat = 13.0827;
    const fallbackLng = 80.2707;

    const loadStations = async (lat: number, lng: number) => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/api/stations?lat=${lat}&lng=${lng}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data: Station[] = await res.json();
          setStations(data);
        } else {
          // Fallback: empty
          setStations([]);
        }
      } catch {
        setStations([]);
      }
      setLoading(false);
    };

    if (!navigator.geolocation) {
      setUserLoc({ lat: fallbackLat, lng: fallbackLng });
      loadStations(fallbackLat, fallbackLng);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLoc({ lat: latitude, lng: longitude });
        loadStations(latitude, longitude);
      },
      () => {
        setUserLoc({ lat: fallbackLat, lng: fallbackLng });
        loadStations(fallbackLat, fallbackLng);
      }
    );
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-20 text-center font-bold text-gray-500 animate-pulse">
          Detecting your location and loading nearest stations...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Nearest Charging Stations</h1>
          <p className="text-gray-500 font-medium mt-1">
            Sorted by distance from your current location (nearest first).
          </p>
        </div>

        {stations.length === 0 ? (
          <div className="py-20 text-center text-gray-400 font-bold">
            No charging stations found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {stations.map((s) => {
              // Always use simulated charger data for variety (green/yellow/red)
              const simulated = getSimulatedChargers(s.id);
              const totalChargers = simulated.total;
              const availableChargers = simulated.available;
              const status = getAvailabilityStatus(availableChargers, totalChargers);

              return (
                <Card
                  key={s.id}
                  className="border-none shadow-sm hover:shadow-lg transition-all bg-white"
                >
                  <CardContent className="p-5 space-y-3">
                    {/* Station header with name + status badge */}
                    <div className="flex items-center gap-3">
                      <div className="bg-[#5F259F] p-2 rounded-xl text-white flex-shrink-0">
                        <Zap size={18} fill="currentColor" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-sm text-gray-900 truncate">
                            {s.station_name}
                          </h3>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black shrink-0 ${status.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                            {status.label}
                          </span>
                        </div>
                        <p className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                          <MapPin size={10} />
                          {s.latitude.toFixed(4)}, {s.longitude.toFixed(4)}
                        </p>
                      </div>
                    </div>

                    {/* ─── Charger Availability Indicator ─────────── */}
                    <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-wide flex items-center gap-1">
                          <BatteryCharging size={12} className="text-[#5F259F]" />
                          Available Chargers
                        </span>
                        <span className="text-sm font-black text-gray-900">
                          {availableChargers} <span className="text-gray-400">/</span> {totalChargers}
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${status.barColor}`}
                          style={{ width: totalChargers > 0 ? `${(availableChargers / totalChargers) * 100}%` : '0%' }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black ${status.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                          Status: {status.statusText}
                        </span>
                        <span className="text-[9px] font-bold text-gray-400">
                          Total Chargers: {totalChargers}
                        </span>
                      </div>
                    </div>

                    {/* Info grid */}
                    <div className="grid grid-cols-3 gap-2 py-2 border-y border-gray-50">
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase">Distance</p>
                        <p className="text-xs font-black text-gray-900">
                          {s.distance != null ? `${s.distance} km` : "--"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase">Rate</p>
                        <p className="text-xs font-black text-emerald-600">
                          ₹{s.price_per_kwh}/kWh
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase">Connectors</p>
                        <p className="text-xs font-black text-[#5F259F]">
                          {s.available_chargers}
                        </p>
                      </div>
                    </div>

                    {/* Footer with distance */}
                    {s.distance != null && (
                      <div className="flex items-center justify-end">
                        <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                          <Navigation size={10} /> {s.distance} km away
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default NearbyChargers;