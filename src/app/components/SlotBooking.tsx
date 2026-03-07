import React, { useState } from "react";
import { DashboardLayout } from "./DashboardLayout";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { toast } from "sonner";
import {
  Zap,
  Clock,
  MapPin,
  CalendarCheck,
  CheckCircle2,
  XCircle,
  BatteryCharging,
  Timer,
  ArrowRight,
} from "lucide-react";

// ─── Dummy station + slot data ────────────────────────────────
interface Slot {
  id: number;
  slotNumber: number;
  status: "AVAILABLE" | "BOOKED" | "CHARGING";
  connectorType: string;
  power: string;
}

interface Station {
  id: number;
  name: string;
  location: string;
  distance: string;
  pricePerKwh: number;
  slots: Slot[];
}

const DUMMY_STATIONS: Station[] = [
  {
    id: 1, name: "Madurai Bypass Tata Power", location: "NH44, Madurai",
    distance: "59.6 km", pricePerKwh: 14.5,
    slots: [
      { id: 1, slotNumber: 1, status: "AVAILABLE", connectorType: "CCS2", power: "50 kW" },
      { id: 2, slotNumber: 2, status: "CHARGING", connectorType: "CCS2", power: "50 kW" },
      { id: 3, slotNumber: 3, status: "AVAILABLE", connectorType: "CHAdeMO", power: "30 kW" },
      { id: 4, slotNumber: 4, status: "BOOKED", connectorType: "Type 2", power: "22 kW" },
      { id: 5, slotNumber: 5, status: "AVAILABLE", connectorType: "Bharat DC", power: "15 kW" },
    ],
  },
  {
    id: 2, name: "Madurai Meenakshi EV Hub", location: "KK Nagar, Madurai",
    distance: "62.3 km", pricePerKwh: 12.0,
    slots: [
      { id: 6, slotNumber: 1, status: "AVAILABLE", connectorType: "CCS2", power: "50 kW" },
      { id: 7, slotNumber: 2, status: "AVAILABLE", connectorType: "Type 2", power: "22 kW" },
      { id: 8, slotNumber: 3, status: "CHARGING", connectorType: "CCS2", power: "50 kW" },
      { id: 9, slotNumber: 4, status: "CHARGING", connectorType: "CHAdeMO", power: "30 kW" },
    ],
  },
  {
    id: 3, name: "Trichy TNEB SmartCharge", location: "Srirangam, Trichy",
    distance: "175.9 km", pricePerKwh: 11.5,
    slots: [
      { id: 10, slotNumber: 1, status: "AVAILABLE", connectorType: "CCS2", power: "60 kW" },
      { id: 11, slotNumber: 2, status: "BOOKED", connectorType: "CCS2", power: "60 kW" },
      { id: 12, slotNumber: 3, status: "AVAILABLE", connectorType: "Type 2", power: "22 kW" },
      { id: 13, slotNumber: 4, status: "AVAILABLE", connectorType: "Bharat DC", power: "15 kW" },
    ],
  },
  {
    id: 4, name: "Gandhipuram EV Fast Charge", location: "Gandhipuram, Coimbatore",
    distance: "178.2 km", pricePerKwh: 15.5,
    slots: [
      { id: 14, slotNumber: 1, status: "CHARGING", connectorType: "CCS2", power: "120 kW" },
      { id: 15, slotNumber: 2, status: "CHARGING", connectorType: "CCS2", power: "120 kW" },
      { id: 16, slotNumber: 3, status: "CHARGING", connectorType: "CHAdeMO", power: "50 kW" },
      { id: 17, slotNumber: 4, status: "BOOKED", connectorType: "Type 2", power: "22 kW" },
    ],
  },
  {
    id: 5, name: "Salem Highway EV Point", location: "NH44, Salem",
    distance: "238.1 km", pricePerKwh: 12.0,
    slots: [
      { id: 18, slotNumber: 1, status: "AVAILABLE", connectorType: "CCS2", power: "50 kW" },
      { id: 19, slotNumber: 2, status: "AVAILABLE", connectorType: "CCS2", power: "50 kW" },
      { id: 20, slotNumber: 3, status: "BOOKED", connectorType: "Type 2", power: "22 kW" },
    ],
  },
  {
    id: 6, name: "Coimbatore RS Puram Charge", location: "RS Puram, Coimbatore",
    distance: "178.9 km", pricePerKwh: 13.0,
    slots: [
      { id: 21, slotNumber: 1, status: "AVAILABLE", connectorType: "CCS2", power: "50 kW" },
      { id: 22, slotNumber: 2, status: "CHARGING", connectorType: "CHAdeMO", power: "30 kW" },
      { id: 23, slotNumber: 3, status: "AVAILABLE", connectorType: "Type 2", power: "22 kW" },
    ],
  },
];

// ─── Booking state ────────────────────────────────────────────
interface Booking {
  slotId: number;
  stationName: string;
  slotNumber: number;
  connectorType: string;
  power: string;
  bookedAt: string;
  expiresAt: string;
}

const statusConfig = {
  AVAILABLE: { label: "Available", color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  BOOKED:    { label: "Booked",    color: "bg-amber-100 text-amber-700",     dot: "bg-amber-500" },
  CHARGING:  { label: "Charging",  color: "bg-blue-100 text-blue-700",       dot: "bg-blue-500" },
};

const SlotBooking: React.FC = () => {
  const [stations, setStations] = useState<Station[]>(DUMMY_STATIONS);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{ slot: Slot; station: Station } | null>(null);

  const handleBook = (station: Station, slot: Slot) => {
    setConfirmDialog({ slot, station });
  };

  const confirmBooking = () => {
    if (!confirmDialog) return;
    const { slot, station } = confirmDialog;
    const now = new Date();
    const expires = new Date(now.getTime() + 15 * 60 * 1000); // 15 min expiry

    // Update slot status
    setStations((prev) =>
      prev.map((s) =>
        s.id === station.id
          ? { ...s, slots: s.slots.map((sl) => (sl.id === slot.id ? { ...sl, status: "BOOKED" as const } : sl)) }
          : s
      )
    );

    // Add to bookings
    setMyBookings((prev) => [
      ...prev,
      {
        slotId: slot.id,
        stationName: station.name,
        slotNumber: slot.slotNumber,
        connectorType: slot.connectorType,
        power: slot.power,
        bookedAt: now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        expiresAt: expires.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      },
    ]);

    setConfirmDialog(null);
    toast.success(`Slot #${slot.slotNumber} booked at ${station.name}!`, {
      description: "Arrive within 15 minutes to start charging.",
    });
  };

  const cancelBooking = (slotId: number) => {
    const booking = myBookings.find((b) => b.slotId === slotId);
    if (!booking) return;

    // Re-enable the slot
    setStations((prev) =>
      prev.map((s) => ({
        ...s,
        slots: s.slots.map((sl) => (sl.id === slotId ? { ...sl, status: "AVAILABLE" as const } : sl)),
      }))
    );
    setMyBookings((prev) => prev.filter((b) => b.slotId !== slotId));
    toast.info("Booking cancelled.");
  };

  const availableCount = (s: Station) => s.slots.filter((sl) => sl.status === "AVAILABLE").length;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <CalendarCheck className="text-[#5F259F]" size={28} />
            Slot Booking
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            Book a charging slot at any station. Slots are reserved for 15 minutes.
          </p>
        </div>

        {/* My Active Bookings */}
        {myBookings.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-black text-gray-700 uppercase tracking-wide">
              My Active Bookings ({myBookings.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {myBookings.map((b) => (
                <Card key={b.slotId} className="border-2 border-[#5F259F]/20 bg-[#5F259F]/5 shadow-sm">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-black text-sm text-gray-900">{b.stationName}</h3>
                      <Badge className="bg-amber-100 text-amber-700 font-black text-[10px]">
                        <Clock size={10} className="mr-1" /> BOOKED
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="font-bold text-gray-400">Slot</span>
                        <p className="font-black text-gray-900">#{b.slotNumber}</p>
                      </div>
                      <div>
                        <span className="font-bold text-gray-400">Connector</span>
                        <p className="font-black text-gray-900">{b.connectorType}</p>
                      </div>
                      <div>
                        <span className="font-bold text-gray-400">Power</span>
                        <p className="font-black text-[#5F259F]">{b.power}</p>
                      </div>
                      <div>
                        <span className="font-bold text-gray-400">Expires</span>
                        <p className="font-black text-red-600">{b.expiresAt}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        size="sm"
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black"
                        onClick={() => {
                          // Simulate confirm arrival
                          setStations((prev) =>
                            prev.map((s) => ({
                              ...s,
                              slots: s.slots.map((sl) =>
                                sl.id === b.slotId ? { ...sl, status: "CHARGING" as const } : sl
                              ),
                            }))
                          );
                          setMyBookings((prev) => prev.filter((bk) => bk.slotId !== b.slotId));
                          toast.success("Arrival confirmed! Charging started.", {
                            description: `Slot #${b.slotNumber} is now active.`,
                          });
                        }}
                      >
                        <CheckCircle2 size={14} className="mr-1" /> Confirm Arrival
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs font-black text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => cancelBooking(b.slotId)}
                      >
                        <XCircle size={14} className="mr-1" /> Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Station Cards */}
        <div className="space-y-3">
          <h2 className="text-sm font-black text-gray-700 uppercase tracking-wide">
            Available Stations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {stations.map((station) => {
              const avail = availableCount(station);
              const total = station.slots.length;
              const pct = total > 0 ? (avail / total) * 100 : 0;
              const isSelected = selectedStation?.id === station.id;

              return (
                <Card
                  key={station.id}
                  className={`border shadow-sm hover:shadow-lg transition-all cursor-pointer ${
                    isSelected ? "border-[#5F259F] ring-2 ring-[#5F259F]/20" : "border-gray-100"
                  }`}
                  onClick={() => setSelectedStation(isSelected ? null : station)}
                >
                  <CardContent className="p-5 space-y-3">
                    {/* Station header */}
                    <div className="flex items-center gap-3">
                      <div className="bg-[#5F259F] p-2 rounded-xl text-white flex-shrink-0">
                        <Zap size={18} fill="currentColor" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-sm text-gray-900 truncate">
                            {station.name}
                          </h3>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black shrink-0 ${
                              avail === 0
                                ? "bg-red-50 text-red-700"
                                : avail <= total / 2
                                ? "bg-amber-50 text-amber-700"
                                : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                avail === 0 ? "bg-red-500" : avail <= total / 2 ? "bg-amber-500" : "bg-emerald-500"
                              }`}
                            />
                            {avail === 0 ? "Full" : avail <= total / 2 ? "Busy" : "Available"}
                          </span>
                        </div>
                        <p className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                          <MapPin size={10} /> {station.location} • {station.distance}
                        </p>
                      </div>
                    </div>

                    {/* Availability indicator */}
                    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-gray-500 uppercase flex items-center gap-1">
                          <BatteryCharging size={12} className="text-[#5F259F]" /> Available Chargers
                        </span>
                        <span className="text-sm font-black text-gray-900">
                          {avail} <span className="text-gray-400">/</span> {total}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            avail === 0 ? "bg-red-500" : avail <= total / 2 ? "bg-amber-500" : "bg-emerald-500"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black ${
                            avail === 0
                              ? "bg-red-50 text-red-700"
                              : avail <= total / 2
                              ? "bg-amber-50 text-amber-700"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              avail === 0 ? "bg-red-500" : avail <= total / 2 ? "bg-amber-500" : "bg-emerald-500"
                            }`}
                          />
                          Status: {avail === 0 ? "Full" : avail <= total / 2 ? "Moderate Load" : "Low Load"}
                        </span>
                        <span className="text-[9px] font-bold text-gray-400">₹{station.pricePerKwh}/kWh</span>
                      </div>
                    </div>

                    {/* Expand arrow */}
                    <div className="flex items-center justify-center">
                      <span className={`text-[10px] font-black text-[#5F259F] flex items-center gap-1 transition-transform ${isSelected ? "rotate-90" : ""}`}>
                        <ArrowRight size={12} /> {isSelected ? "Hide Slots" : "View Slots & Book"}
                      </span>
                    </div>

                    {/* Expanded slots */}
                    {isSelected && (
                      <div className="space-y-2 pt-2 border-t border-gray-100">
                        <h4 className="text-[10px] font-black text-gray-500 uppercase">Individual Slots</h4>
                        {station.slots.map((slot) => {
                          const cfg = statusConfig[slot.status];
                          const isBooked = myBookings.some((b) => b.slotId === slot.id);
                          return (
                            <div
                              key={slot.id}
                              className="flex items-center justify-between bg-white border border-gray-100 rounded-lg p-3"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center font-black text-xs text-gray-700">
                                  #{slot.slotNumber}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-black text-gray-900">{slot.connectorType}</span>
                                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-black ${cfg.color}`}>
                                      <span className={`w-1 h-1 rounded-full ${cfg.dot}`} />
                                      {cfg.label}
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                                    <Zap size={9} /> {slot.power}
                                  </span>
                                </div>
                              </div>
                              {slot.status === "AVAILABLE" ? (
                                <Button
                                  size="sm"
                                  className="bg-[#5F259F] hover:bg-[#4a1d7a] text-white text-[10px] font-black h-7 px-3"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleBook(station, slot);
                                  }}
                                >
                                  Book Now
                                </Button>
                              ) : slot.status === "BOOKED" && isBooked ? (
                                <Badge className="bg-amber-100 text-amber-700 text-[9px] font-black">
                                  <Timer size={10} className="mr-1" /> Your Booking
                                </Badge>
                              ) : (
                                <Badge className={`${cfg.color} text-[9px] font-black`}>
                                  {cfg.label}
                                </Badge>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Confirm Booking Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <Card className="w-full max-w-sm mx-4 shadow-2xl border-0">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-[#5F259F] p-2.5 rounded-xl text-white">
                  <CalendarCheck size={22} />
                </div>
                <div>
                  <h3 className="font-black text-base text-gray-900">Confirm Booking</h3>
                  <p className="text-xs text-gray-500 font-medium">This slot will be held for 15 minutes</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-gray-400">Station</span>
                  <span className="font-black text-gray-900">{confirmDialog.station.name}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-gray-400">Slot</span>
                  <span className="font-black text-gray-900">#{confirmDialog.slot.slotNumber}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-gray-400">Connector</span>
                  <span className="font-black text-gray-900">{confirmDialog.slot.connectorType}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-gray-400">Power</span>
                  <span className="font-black text-[#5F259F]">{confirmDialog.slot.power}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-gray-400">Rate</span>
                  <span className="font-black text-emerald-600">₹{confirmDialog.station.pricePerKwh}/kWh</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  className="flex-1 bg-[#5F259F] hover:bg-[#4a1d7a] text-white font-black"
                  onClick={confirmBooking}
                >
                  <CheckCircle2 size={16} className="mr-1" /> Confirm Booking
                </Button>
                <Button
                  variant="outline"
                  className="font-black"
                  onClick={() => setConfirmDialog(null)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
};

export default SlotBooking;
