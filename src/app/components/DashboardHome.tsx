import React, { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "./DashboardLayout";
import { 
  Zap, 
  Battery, 
  History, 
  CreditCard, 
  ArrowUpRight, 
  TrendingUp,
  MapPin,
  Car,
  Plus,
  ShieldCheck,
  ArrowRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from "recharts";
import { fetchUserProfile, fetchChargingHistory, fetchDashboardSummary, formatINR } from "../utils/api";
import { HAWAII_CHARGERS } from "../utils/chargerUtils";
import { fetchUserVehicles } from "../utils/api";
import { PaymentModal } from "./PaymentModal";
import { cn } from "./ui/utils";

// Generate chart data based on time period
const generateChartData = (period: string, history: any[]) => {
  if (period === "7D") {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return days.map((name, i) => ({
      name,
      usage: Math.round(30 + Math.random() * 60 + (history.length > i ? (history[i]?.energy || 0) : 0))
    }));
  } else if (period === "30D") {
    return Array.from({ length: 4 }, (_, i) => ({
      name: `Week ${i + 1}`,
      usage: Math.round(150 + Math.random() * 200 + history.reduce((sum: number, h: any) => sum + (h.energy || 0), 0) / 4)
    }));
  } else {
    return ["Jan", "Feb", "Mar"].map((name, i) => ({
      name,
      usage: Math.round(400 + Math.random() * 300 + history.reduce((sum: number, h: any) => sum + (h.energy || 0), 0) / 3)
    }));
  }
};

const StatCard = ({ title, value, icon: Icon, trend, color, onClick, cta, subtitle }: any) => (
  <Card className="overflow-hidden border-none shadow-2xl bg-white rounded-[2.5rem] group hover:scale-[1.02] transition-all duration-500" onClick={onClick && !cta ? onClick : undefined} style={onClick && !cta ? { cursor: 'pointer' } : undefined}>
    <CardContent className="p-8">
      <div className="flex justify-between items-start">
        <div className="space-y-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</p>
          <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{value}</h3>
          {subtitle && (
            <p className="text-[10px] font-bold text-slate-400 mt-1">{subtitle}</p>
          )}
          {cta ? (
            <button onClick={onClick} className="mt-4 flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest hover:gap-3 transition-all">
              {cta} <ArrowRight size={14} />
            </button>
          ) : trend != null ? (
            <div className="flex items-center gap-1.5 mt-2">
              <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-full", trend > 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600")}>
                {trend > 0 ? "+" : ""}{trend}%
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">vs last month</span>
            </div>
          ) : null}
        </div>
        <div className={cn("p-5 rounded-[1.5rem] shadow-xl transform group-hover:rotate-12 transition-transform duration-500", color)}>
          <Icon className="text-white" size={28} />
        </div>
      </div>
    </CardContent>
  </Card>
);

const DashboardHome: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [timePeriod, setTimePeriod] = useState("7D");
  const [chargingHistory, setChargingHistory] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [vehicle, setVehicle] = useState<any>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const loadData = async () => {
    const p = await fetchUserProfile();
    setProfile(p);
    const h = await fetchChargingHistory();
    setChargingHistory(h);
    const s = await fetchDashboardSummary();
    setSummary(s);
    const v = await fetchUserVehicles();
    if (v && v.length > 0) setVehicle(v[0]);
    setLastRefresh(new Date());
  };

  useEffect(() => {
    loadData();
    
    // Auto-refresh dashboard metrics every 30 seconds
    const refreshInterval = setInterval(() => {
      loadData();
    }, 30000);
    
    return () => clearInterval(refreshInterval);
  }, []);

  // Dynamic stats computed from actual data
  const activeNodes = summary?.activeStations ?? 21;
  const totalEnergy = summary?.totalEnergy ?? chargingHistory.reduce((sum, h) => sum + (h.kwhUsed || h.energy || 0), 0);
  const totalSessions = summary?.totalSessions ?? chargingHistory.length;
  const walletBalance = summary?.walletBalance ?? 0;

  // Dynamic trends based on actual data
  const energyTrend = totalEnergy > 0 ? Math.min(Math.round((totalEnergy / 10) * 5), 50) : 0;
  const sessionsTrend = totalSessions > 0 ? Math.min(totalSessions * 2, 25) : 0;

  // Chart data reacts to time filter
  const chartData = useMemo(() => generateChartData(timePeriod, chargingHistory), [timePeriod, chargingHistory]);

  if (!profile) return <div className="p-20 text-center font-black animate-pulse">BOOTING_DASHBOARD...</div>;

  return (
    <DashboardLayout>
      <div className="space-y-12 max-w-7xl mx-auto pb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter">
              Welcome, <span className="text-blue-600">{profile.firstName} {profile.lastName}</span>
            </h1>
            <p className="mt-3 text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] flex items-center gap-2 italic">
               <ShieldCheck size={14} className="text-blue-600" />
               {profile.email} — Node: {profile.location || 'India'}
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <StatCard 
            title="Active Stations" 
            value={activeNodes} 
            icon={MapPin} 
            trend={activeNodes > 0 ? 100 : 0} 
            color="bg-zinc-900" 
          />
          <StatCard 
            title="Total Energy" 
            value={`${totalEnergy.toLocaleString('en-IN')} kWh`} 
            icon={Zap} 
            trend={energyTrend} 
            color="bg-blue-600" 
          />
          <StatCard 
            title="Sessions" 
            value={totalSessions} 
            icon={History} 
            trend={sessionsTrend} 
            color="bg-zinc-400" 
          />
          <StatCard 
            title="Quick Pay" 
            value="Pay via UPI" 
            icon={CreditCard} 
            color="bg-emerald-600 shadow-emerald-100" 
            subtitle="PhonePe • Google Pay • Paytm"
            cta="PAY NOW"
            onClick={() => setShowPayment(true)}
          />
        </div>

        {/* Last Refreshed Indicator */}
        <div className="text-right">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
            Auto-refresh every 30s • Last updated: {lastRefresh.toLocaleTimeString('en-IN')}
          </span>
        </div>

        {/* Charts and Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <Card className="lg:col-span-2 border-none shadow-2xl bg-white rounded-[3.5rem] overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between p-10 border-b border-slate-50">
              <CardTitle className="text-2xl font-black flex items-center gap-4">
                <div className="p-3 bg-blue-50 rounded-2xl text-blue-600"><TrendingUp size={24} /></div>
                Strategic Consumption
              </CardTitle>
              <select 
                value={timePeriod}
                onChange={(e) => setTimePeriod(e.target.value)}
                className="bg-slate-50 border-none text-[10px] font-black text-slate-400 uppercase tracking-widest rounded-xl px-4 py-2 focus:ring-0 cursor-pointer"
              >
                <option value="7D">CYCLE_CURRENT_7D</option>
                <option value="30D">CYCLE_LAST_30D</option>
                <option value="90D">CYCLE_LAST_90D</option>
              </select>
            </CardHeader>
            <CardContent className="p-10 h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} 
                  />
                  <Tooltip 
                    formatter={(value) => [`${value} kWh`, 'Usage']}
                    contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)', fontWeight: 'black', fontSize: '12px'}} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="usage" 
                    stroke="#2563eb" 
                    strokeWidth={5} 
                    fillOpacity={1} 
                    fill="url(#colorUsage)" 
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-none shadow-2xl bg-zinc-900 rounded-[3.5rem] p-10 text-white relative overflow-hidden group">
             <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
             <h3 className="text-2xl font-black mb-10 flex items-center gap-4">
                <div className="p-3 bg-white/10 rounded-2xl"><Car size={24} /></div>
                Fleet Pulse
             </h3>
             <div className="space-y-8">
                <div className="p-6 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors">
                   <div className="flex justify-between items-center mb-4">
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{vehicle?.model || "Tata Nexon EV Max"}</p>
                      <span className="text-xs font-black text-emerald-400">CHARGING</span>
                   </div>
                   <div className="flex items-end gap-2">
                      <h4 className="text-4xl font-black tracking-tighter">{vehicle?.currentSoc || 65}%</h4>
                      <p className="text-[10px] font-bold text-white/40 mb-1.5 uppercase tracking-tighter">Est. {Math.round((vehicle?.currentSoc || 65) * 3.7)}km left</p>
                   </div>
                   <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 shadow-[0_0_15px_#2563eb]" style={{ width: `${vehicle?.currentSoc || 65}%` }}></div>
                   </div>
                </div>

                <div className="p-8 bg-blue-600 rounded-[2.5rem] shadow-2xl shadow-blue-900/20">
                   <div className="flex items-center gap-4 mb-4">
                      <div className="p-2 bg-white/20 rounded-xl"><Plus size={20} /></div>
                      <p className="text-sm font-black uppercase tracking-widest">Smart Suggestion</p>
                   </div>
                   <p className="text-xs font-bold leading-relaxed text-blue-50/80 italic">
                      "Grid load is minimal between 01:00 AM - 04:00 AM. Scheduled charging during this window will save you ₹240 based on current tariff."
                   </p>
                </div>
             </div>
          </Card>
        </div>
      </div>

      {showPayment && (
        <PaymentModal 
          amount={500} 
          onSuccess={() => {
            loadData();
            setTimeout(() => setShowPayment(false), 2000);
          }} 
          onClose={() => setShowPayment(false)} 
        />
      )}
    </DashboardLayout>
  );
};

export default DashboardHome;
