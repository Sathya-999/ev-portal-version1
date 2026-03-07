import React, { useState, useEffect } from "react";
import { DashboardLayout } from "./DashboardLayout";
import { 
  Zap, MapPin, Search, Car, History, Navigation, 
  Activity, Clock, Battery, Shield, ArrowRight,
  TrendingUp, Star, Filter, Locate
} from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { toast } from "sonner";
import { 
  fetchUserProfile, 
  fetchUserVehicles, 
  fetchChargingHistory
} from "../utils/api";

// Haversine formula for distance calculation
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

const OPENCAGE_KEY = "8308a66a7b2847a4b91623183b07794c";

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [chargers, setChargers] = useState<any[]>([
    { id: 1, name: "Tata Power EZ Charge", lat: 12.9716, lng: 77.5946, power: "60kW", type: "CCS2", price: 18, status: "Available" },
    { id: 2, name: "Jio-bp pulse", lat: 12.9352, lng: 77.6245, power: "120kW", type: "CCS2", price: 22, status: "Busy" },
    { id: 3, name: "Ather Grid 4.0", lat: 12.9141, lng: 77.6411, power: "22kW", type: "Type 2", price: 15, status: "Available" },
    { id: 4, name: "Magenta ChargeGrid", lat: 12.9591, lng: 77.6974, power: "50kW", type: "CCS2", price: 19, status: "Available" }
  ]);

  useEffect(() => {
    const initDashboard = async () => {
      try {
        const [userData, vehicleData, historyData] = await Promise.all([
          fetchUserProfile(),
          fetchUserVehicles(),
          fetchChargingHistory()
        ]);
        setUser(userData);
        setVehicles(vehicleData);
        setHistory(historyData);
        
        // Browser Geolocation
        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition((pos) => {
            setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          });
        }
      } catch (err) {
        toast.error("Telemetry Link Failure: Systems Offline");
      } finally {
        setLoading(false);
      }
    };
    initDashboard();
  }, []);

  const sortedChargers = React.useMemo(() => {
    if (!location) return chargers;
    return [...chargers].sort((a, b) => {
      const distA = calculateDistance(location.lat, location.lng, a.lat, a.lng);
      const distB = calculateDistance(location.lat, location.lng, b.lat, b.lng);
      return distA - distB;
    });
  }, [location, chargers]);

  if (loading) return (
    <DashboardLayout>
      <div className="p-20 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-black italic text-blue-600 tracking-tighter uppercase">Initializing Command Center...</p>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-10 pb-20 px-4 md:px-0">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-none">
              Welcome, <span className="text-blue-600">{user?.firstName || 'User'} {user?.lastName || ''}</span>
            </h1>
            <p className="mt-4 text-slate-500 font-bold uppercase tracking-[0.2em] text-xs flex items-center gap-2">
              <Activity size={14} className="text-blue-600 animate-pulse" />
              Live Link: Connected to Bangalore Nexus
            </p>
          </div>
          <div className="flex items-center gap-4 bg-white p-2 rounded-[2rem] shadow-xl border border-slate-100">
             <div className="px-6 py-3 bg-zinc-900 text-white rounded-[1.5rem] flex items-center gap-3">
               <Zap size={18} className="text-amber-400" fill="currentColor" />
               <span className="text-sm font-black italic tracking-tight">GRID: STABLE</span>
             </div>
             <div className="pr-6 pl-2 flex items-center gap-2">
               <div className="w-4 h-4 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
               <span className="text-xs font-black uppercase text-slate-400 tracking-widest">System Online</span>
             </div>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { label: "Wallet Balance", val: `₹${(user?.walletBalance || 0).toLocaleString("en-IN")}`, icon: Zap, color: "text-blue-600" },
            { label: "Loyalty Tier", val: user?.membership, icon: Star, color: "text-amber-500" },
            { label: "Vehicles Sync", val: `${vehicles.length} Active`, icon: Car, color: "text-indigo-600" },
            { label: "Monthly Carbon", val: "-120kg CO2", icon: Shield, color: "text-emerald-600" }
          ].map((stat, i) => (
            <Card key={i} className="border-none shadow-2xl bg-white p-8 rounded-[2.5rem] group hover:scale-[1.02] transition-transform duration-300 border border-slate-50">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-4 rounded-2xl bg-slate-50 ${stat.color} group-hover:bg-zinc-900 group-hover:text-white transition-colors`}>
                  <stat.icon size={24} />
                </div>
                <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[10px] uppercase">+12%</Badge>
              </div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-3xl font-black text-slate-900 mt-2 tracking-tighter">{stat.val}</p>
            </Card>
          ))}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            <Card className="border-none shadow-2xl bg-white p-10 rounded-[3rem] border border-slate-100 min-h-[600px] flex flex-col">
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-2xl font-black text-slate-900 flex items-center gap-4">
                  <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-200"><MapPin size={24} /></div>
                  Strategic Hub Mapping
                </h3>
                <div className="flex gap-3">
                  <Button variant="outline" className="rounded-2xl border-2 border-slate-100 font-black text-xs h-12 px-6 hover:bg-slate-50">
                    <Filter size={14} className="mr-2" /> FILTER
                  </Button>
                  <Button onClick={() => setLocation({ lat: 12.9716, lng: 77.5946 })} className="rounded-2xl bg-zinc-900 font-black text-xs h-12 px-6 shadow-xl shadow-zinc-200">
                    <Locate size={14} className="mr-2" /> RELOCATE
                  </Button>
                </div>
              </div>

              <div className="flex-1 space-y-6">
                {sortedChargers.map(charger => {
                  const dist = location ? calculateDistance(location.lat, location.lng, charger.lat, charger.lng) : null;
                  return (
                    <div key={charger.id} className="group p-8 bg-slate-50/50 rounded-[2rem] border-2 border-transparent hover:border-blue-600 hover:bg-white transition-all duration-500 cursor-pointer relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-bl-[5rem] group-hover:bg-blue-600 transition-colors duration-500"></div>
                      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-start gap-6">
                          <div className="p-5 bg-white rounded-3xl shadow-xl group-hover:bg-zinc-900 group-hover:text-white transition-colors duration-500">
                            <Zap size={32} className={charger.status === "Available" ? "text-emerald-500" : "text-amber-500"} fill="currentColor" />
                          </div>
                          <div>
                            <div className="flex items-center gap-3">
                              <h4 className="text-2xl font-black text-slate-900 tracking-tight">{charger.name}</h4>
                              <Badge className={charger.status === "Available" ? "bg-emerald-50 text-emerald-600 border-none" : "bg-amber-50 text-amber-600 border-none"}>
                                {charger.status}
                              </Badge>
                            </div>
                            <p className="text-xs font-black text-slate-400 mt-2 uppercase tracking-[0.2em] flex items-center gap-2">
                              {charger.type} � {charger.power} � ?{charger.price}/kWh
                            </p>
                            <div className="mt-4 flex items-center gap-4">
                               <div className="flex items-center gap-1.5 text-blue-600">
                                 <Navigation size={14} />
                                 <span className="text-sm font-black italic">{dist ? `${dist.toFixed(1)} KM` : "Detecting..."}</span>
                               </div>
                               <span className="text-slate-300 font-black text-xs">|</span>
                               <span className="text-slate-500 text-xs font-black uppercase tracking-widest">ETA: {dist ? Math.round(dist * 2.5) : "--"} MIN</span>
                            </div>
                          </div>
                        </div>
                        <Button className="md:w-32 h-16 bg-blue-600 hover:bg-black rounded-2xl shadow-xl shadow-blue-100 font-black text-sm tracking-tighter uppercase transition-all">
                          START <ArrowRight size={18} className="ml-2" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          <aside className="space-y-10">
            <Card className="border-none shadow-2xl bg-zinc-900 p-10 rounded-[3rem] text-white overflow-hidden relative group">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-600/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
              <h4 className="text-xl font-black mb-8 flex items-center gap-3">
                <TrendingUp size={20} className="text-blue-400" />
                Grid Optimization
              </h4>
              <div className="space-y-8">
                <div>
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-3 opacity-60">
                    <span>Power Load</span>
                    <span className="text-blue-400">78% - Sustained</span>
                  </div>
                  <div className="h-4 bg-white/10 rounded-full overflow-hidden border border-white/5">
                    <div className="h-full bg-blue-600 w-[78%] shadow-[0_0_15px_rgba(37,99,235,0.6)]"></div>
                  </div>
                </div>

                <div className="p-6 bg-white/5 rounded-3xl border border-white/10 border-dashed">
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Clock size={12} /> Optimization Node
                  </p>
                  <p className="text-sm font-bold leading-relaxed text-zinc-300 italic">
                    Grid load decreases in <span className="text-white font-black">2h 14m</span>. 
                    Charge then to save <span className="text-emerald-400 font-black tracking-tighter">?4.20/kWh</span>.
                  </p>
                </div>

                <Button className="w-full bg-white text-zinc-900 border-none hover:bg-blue-600 hover:text-white py-8 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl">
                  ACTIVATE ECO-MODE
                </Button>
              </div>
            </Card>

            <Card className="border-none shadow-2xl bg-white p-10 rounded-[3rem] border border-slate-100">
               <h4 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
                 <Battery size={22} className="text-emerald-500" />
                 Active Vehicle
               </h4>
               {vehicles[0] ? (
                 <div className="space-y-6">
                    <div className="flex items-center gap-6">
                       <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center border-2 border-slate-100">
                          <Car size={32} className="text-slate-900" />
                       </div>
                       <div>
                          <p className="text-sm font-black text-slate-900 tracking-tight">{vehicles[0].name}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{vehicles[0].regNo}</p>
                       </div>
                    </div>
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
                       <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Battery Status</span>
                       <span className="text-emerald-700 font-black tracking-tighter">84% SOH</span>
                    </div>
                 </div>
               ) : (
                 <p className="text-center py-10 text-slate-400 font-black italic">SEARCHING FOR TELEMETRY...</p>
               )}
            </Card>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
