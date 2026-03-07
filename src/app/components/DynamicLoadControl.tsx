import React, { useState, useEffect } from "react";
import { DashboardLayout } from "./DashboardLayout";
import {
  Gauge,
  Zap,
  Battery,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Clock,
  Activity,
  Shield,
  Sun,
  Moon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { HAWAII_CHARGERS, isPeakHour } from "../utils/chargerUtils";
import { cn } from "./ui/utils";

// Simulated grid load data over 24 hours
const gridLoadData = [
  { hour: "00", load: 22, solar: 0 },
  { hour: "02", load: 18, solar: 0 },
  { hour: "04", load: 15, solar: 0 },
  { hour: "06", load: 25, solar: 8 },
  { hour: "08", load: 55, solar: 35 },
  { hour: "10", load: 62, solar: 60 },
  { hour: "12", load: 70, solar: 75 },
  { hour: "14", load: 68, solar: 65 },
  { hour: "16", load: 72, solar: 40 },
  { hour: "18", load: 88, solar: 12 },
  { hour: "20", load: 82, solar: 0 },
  { hour: "22", load: 45, solar: 0 },
];

interface StationLoad {
  name: string;
  totalCapacity: number;
  activeVehicles: number;
  currentDraw: number;
  maxDraw: number;
  status: "optimal" | "high" | "critical";
}

const stationLoads: StationLoad[] = [
  { name: "Tata Power EZ Charge", totalCapacity: 120, activeVehicles: 3, currentDraw: 85, maxDraw: 120, status: "optimal" },
  { name: "Jio-bp Pulse Hub", totalCapacity: 50, activeVehicles: 2, currentDraw: 42, maxDraw: 50, status: "high" },
  { name: "Statcon Energiaa", totalCapacity: 22, activeVehicles: 0, currentDraw: 0, maxDraw: 22, status: "optimal" },
  { name: "Ather Grid Station", totalCapacity: 250, activeVehicles: 8, currentDraw: 210, maxDraw: 250, status: "critical" },
];

const schedulerSlots = [
  { time: "01:00 - 04:00", label: "Off-Peak", tariff: 8.5, savings: "₹240", recommended: true, icon: Moon },
  { time: "06:00 - 08:00", label: "Morning Low", tariff: 12.0, savings: "₹120", recommended: false, icon: Sun },
  { time: "10:00 - 16:00", label: "Solar Peak", tariff: 10.0, savings: "₹180", recommended: true, icon: Sun },
  { time: "18:00 - 21:00", label: "Peak Hours", tariff: 22.0, savings: "₹0", recommended: false, icon: AlertTriangle },
];

const DynamicLoadControl: React.FC = () => {
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const currentHour = new Date().getHours();
  const isCurrentPeak = currentHour >= 18 && currentHour <= 21;

  const totalGridLoad = stationLoads.reduce((sum, s) => sum + s.currentDraw, 0);
  const totalCapacity = stationLoads.reduce((sum, s) => sum + s.totalCapacity, 0);
  const gridUtilization = Math.round((totalGridLoad / totalCapacity) * 100);

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-7xl mx-auto pb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Dynamic Load Control
            </h1>
            <p className="text-gray-500 font-medium mt-1">
              Real-time power allocation & smart charging scheduler.
            </p>
          </div>
          {isCurrentPeak && (
            <Badge className="bg-amber-50 text-amber-600 border-amber-200 px-4 py-2 text-xs font-black uppercase tracking-widest animate-pulse">
              <AlertTriangle size={14} className="mr-1.5" /> Peak Hours Active
            </Badge>
          )}
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-none shadow-lg bg-white overflow-hidden">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Grid Load</p>
                  <h3 className="text-3xl font-black text-gray-900">{totalGridLoad} kW</h3>
                  <p className="text-xs font-bold text-gray-400">{gridUtilization}% utilization</p>
                </div>
                <div className={cn(
                  "p-3 rounded-2xl",
                  gridUtilization > 80 ? "bg-red-50 text-red-600" : gridUtilization > 60 ? "bg-amber-50 text-amber-600" : "bg-green-50 text-green-600"
                )}>
                  <Gauge size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-white overflow-hidden">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Vehicles</p>
                  <h3 className="text-3xl font-black text-gray-900">
                    {stationLoads.reduce((s, l) => s + l.activeVehicles, 0)}
                  </h3>
                  <p className="text-xs font-bold text-gray-400">Across {stationLoads.length} stations</p>
                </div>
                <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
                  <Battery size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-white overflow-hidden">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Current Tariff</p>
                  <h3 className="text-3xl font-black text-gray-900">
                    ₹{isCurrentPeak ? "22.0" : "12.0"}
                  </h3>
                  <p className="text-xs font-bold text-gray-400">per kWh (TNEB rate)</p>
                </div>
                <div className={cn("p-3 rounded-2xl", isCurrentPeak ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600")}>
                  {isCurrentPeak ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-white overflow-hidden">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Solar Available</p>
                  <h3 className="text-3xl font-black text-gray-900">
                    {currentHour >= 6 && currentHour <= 18 ? "Active" : "Offline"}
                  </h3>
                  <p className="text-xs font-bold text-gray-400">Tamil Nadu solar grid</p>
                </div>
                <div className={cn("p-3 rounded-2xl", currentHour >= 6 && currentHour <= 18 ? "bg-yellow-50 text-yellow-600" : "bg-gray-50 text-gray-400")}>
                  <Sun size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 24h Grid Load Chart */}
          <Card className="lg:col-span-2 border-none shadow-xl bg-white overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between px-8 py-6 border-b border-gray-50">
              <CardTitle className="text-lg font-black flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-xl text-blue-600"><Activity size={20} /></div>
                24-Hour Grid Load Profile
              </CardTitle>
              <Badge className="bg-gray-50 text-gray-500 border-none font-black text-[10px]">LIVE</Badge>
            </CardHeader>
            <CardContent className="p-8 h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={gridLoadData}>
                  <defs>
                    <linearGradient id="loadGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="solarGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#eab308" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 700 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 700 }} unit="%" />
                  <Tooltip
                    contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.1)", fontWeight: "bold" }}
                    formatter={(value: number, name: string) => [`${value}%`, name === "load" ? "Grid Load" : "Solar Input"]}
                  />
                  <Area type="monotone" dataKey="load" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#loadGrad)" />
                  <Area type="monotone" dataKey="solar" stroke="#eab308" strokeWidth={3} fillOpacity={1} fill="url(#solarGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Smart Charging Scheduler */}
          <Card className="border-none shadow-xl bg-gray-900 text-white overflow-hidden">
            <CardHeader className="px-6 py-6 border-b border-white/10">
              <CardTitle className="text-lg font-black flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl"><Clock size={20} /></div>
                Smart Scheduler
              </CardTitle>
              <p className="text-xs text-gray-400 font-bold mt-1">AI-optimized charging windows</p>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              {schedulerSlots.map((slot, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedSlot(i)}
                  className={cn(
                    "w-full p-4 rounded-2xl border transition-all text-left",
                    selectedSlot === i
                      ? "border-blue-500 bg-blue-600/20"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <slot.icon size={16} className={slot.recommended ? "text-green-400" : "text-gray-400"} />
                      <div>
                        <p className="text-sm font-black">{slot.time}</p>
                        <p className="text-[10px] font-bold text-gray-400">{slot.label}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-blue-400">₹{slot.tariff}/kWh</p>
                      {slot.recommended && (
                        <Badge className="bg-green-500/20 text-green-400 border-none text-[10px] font-black mt-1">
                          SAVE {slot.savings}
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              ))}
              {selectedSlot !== null && (
                <Button className="w-full bg-blue-600 hover:bg-blue-700 h-12 font-black text-xs uppercase tracking-widest rounded-2xl mt-4 shadow-lg shadow-blue-600/30">
                  Schedule Charging: {schedulerSlots[selectedSlot].time}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Station-Level Load Breakdown */}
        <Card className="border-none shadow-xl bg-white overflow-hidden">
          <CardHeader className="px-8 py-6 border-b border-gray-50">
            <CardTitle className="text-lg font-black flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-xl text-blue-600"><Zap size={20} /></div>
              Station Power Allocation
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-6">
              {stationLoads.map((station, i) => {
                const pct = Math.round((station.currentDraw / station.totalCapacity) * 100);
                return (
                  <div key={i} className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          station.status === "optimal" ? "bg-green-500" : station.status === "high" ? "bg-amber-500" : "bg-red-500"
                        )} />
                        <span className="font-black text-sm text-gray-900">{station.name}</span>
                        <Badge className={cn(
                          "border-none text-[10px] font-black uppercase",
                          station.status === "optimal" ? "bg-green-50 text-green-600" : station.status === "high" ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"
                        )}>
                          {station.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="font-bold text-gray-400">{station.activeVehicles} vehicles</span>
                        <span className="font-black text-gray-900">
                          {station.currentDraw}/{station.totalCapacity} kW
                        </span>
                      </div>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-1000",
                          pct > 85 ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]" :
                          pct > 60 ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]" :
                          "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Regulatory Notice */}
        <div className="flex items-start gap-4 p-6 bg-blue-50/50 rounded-2xl border border-blue-100/50">
          <Shield size={20} className="text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-black text-blue-900">Tamil Nadu Electricity Regulatory Commission (TNERC)</p>
            <p className="text-xs text-blue-700 mt-1">
              Dynamic load management follows TNERC tariff regulations for EV charging infrastructure.
              Peak-hour surcharges apply between 18:00-21:00 as per Order No. TNERC/EV/2024. Solar incentives
              available during 10:00-16:00 window under Tamil Nadu Solar Energy Policy.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DynamicLoadControl;
