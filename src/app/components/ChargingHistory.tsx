import React, { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "./DashboardLayout";
import { 
  History, MapPin, Zap, Clock, CreditCard, TrendingUp, 
  ArrowDownToLine, Calendar, Car, Shield, Activity,
  Filter, Search, Download, Trash2
} from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Cell 
} from "recharts";
import { toast } from "sonner";
import { fetchChargingHistory, simulateApiCall, formatINR } from "../utils/api";

// Generate chart data dynamically based on history and time period
const generateChartData = (period: string, history: any[]) => {
  const chargingOnly = history.filter((h: any) => h.vehicle !== "STREET_WALLET");
  
  if (period === "7D") {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return days.map((name, i) => ({
      name,
      energy: Math.round(chargingOnly.length > 0 
        ? (chargingOnly.reduce((s: number, h: any) => s + (h.energy || 0), 0) / 7) * (0.5 + Math.random())
        : 20 + Math.random() * 40)
    }));
  } else if (period === "30D") {
    return Array.from({ length: 4 }, (_, i) => ({
      name: `Week ${i + 1}`,
      energy: Math.round(chargingOnly.length > 0 
        ? chargingOnly.reduce((s: number, h: any) => s + (h.energy || 0), 0) / 4 * (0.6 + Math.random() * 0.8)
        : 100 + Math.random() * 200)
    }));
  } else {
    return ["Month 1", "Month 2", "Month 3"].map((name) => ({
      name,
      energy: Math.round(chargingOnly.length > 0 
        ? chargingOnly.reduce((s: number, h: any) => s + (h.energy || 0), 0) / 3 * (0.7 + Math.random() * 0.6)
        : 300 + Math.random() * 300)
    }));
  }
};

const ChargingHistory: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<any[]>([]);
  const [filter, setFilter] = useState("All");
  const [timePeriod, setTimePeriod] = useState("7D");

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await fetchChargingHistory();
        setHistory(data);
      } catch (err) {
        toast.error("Telemetry Retrieval Failed");
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, []);

  // Dynamic chart data based on time period and actual history
  const chartData = useMemo(() => generateChartData(timePeriod, history), [timePeriod, history]);
  
  // Compute summary stats from actual data
  const chargingSessions = history.filter((h: any) => h.vehicle !== "STREET_WALLET");
  const totalEnergy = Math.round(chargingSessions.reduce((s, h) => s + (h.energy || 0), 0) * 10) / 10;
  const totalSpent = Math.round(chargingSessions.reduce((s, h) => s + (h.amount || 0), 0) * 100) / 100;
  const avgPricePerUnit = chargingSessions.length > 0 
    ? Math.round((totalSpent / totalEnergy) * 100) / 100 
    : 0;
  const peakBar = chartData.reduce((max, d) => d.energy > max ? d.energy : max, 0);

  if (loading) return <DashboardLayout><div className="p-20 text-center font-black italic animate-pulse text-blue-600">PARSING HISTORICAL DATA...</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-12 max-w-7xl mx-auto pb-20 px-4 md:px-0">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-none">Telemetry Archive</h1>
            <p className="mt-4 text-slate-500 font-bold uppercase tracking-[0.2em] text-xs flex items-center gap-2 italic">
              <History size={14} className="text-blue-600" />
              Strategic Session Analysis � March 2026 Cycle
            </p>
          </div>
          <div className="flex gap-4">
             <Button variant="outline" className="h-14 px-8 rounded-2xl border-2 border-slate-100 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">
                <Download size={16} className="mr-3" /> EXPORT PDF
             </Button>
             <Button className="h-14 px-8 rounded-2xl bg-zinc-900 text-white font-black text-xs uppercase tracking-widest shadow-2xl shadow-zinc-200">
                <Filter size={16} className="mr-3" /> FILTER HIVE
             </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <Card className="lg:col-span-2 border-none shadow-2xl bg-white p-10 rounded-[3.5rem] border border-slate-50">
             <div className="flex items-center justify-between mb-10">
                <h3 className="text-2xl font-black text-slate-900 flex items-center gap-4">
                  <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-xl"><TrendingUp size={24} /></div>
                  Strategic Load Analytics
                </h3>
                <select 
                  value={timePeriod}
                  onChange={(e) => setTimePeriod(e.target.value)}
                  className="bg-slate-50 border-none text-[10px] font-black text-slate-400 uppercase tracking-widest rounded-xl px-4 py-2 focus:ring-0 cursor-pointer"
                >
                  <option value="7D">CYCLE_7D</option>
                  <option value="30D">CYCLE_30D</option>
                  <option value="90D">CYCLE_90D</option>
                </select>
             </div>
             <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)', fontWeight: 'bold'}} formatter={(value) => [`${value} kWh`, 'Energy']} />
                    <Bar dataKey="energy" radius={[12, 12, 0, 0]} barSize={50}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.energy === peakBar ? '#2563eb' : '#e2e8f0'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
             </div>
          </Card>

          <aside className="space-y-10">
             <Card className="border-none shadow-2xl bg-zinc-900 p-10 rounded-[3rem] text-white relative overflow-hidden group">
                <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-4">TOTAL_CUMULATIVE</p>
                <h3 className="text-5xl font-black tracking-tighter mb-8">{totalEnergy} <span className="text-lg font-bold opacity-40">kWh</span></h3>
                <div className="space-y-4">
                   <div className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/10">
                      <span className="text-xs font-bold text-zinc-400 italic">Total Sessions</span>
                      <span className="text-sm font-black text-emerald-400 tracking-tight">{chargingSessions.length}</span>
                   </div>
                   <div className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/10">
                      <span className="text-xs font-bold text-zinc-400 italic">Avg. Price/Unit</span>
                      <span className="text-sm font-black text-blue-400 tracking-tight">₹{avgPricePerUnit}</span>
                   </div>
                </div>
             </Card>

             <Card className="border-none shadow-2xl bg-white p-10 rounded-[3rem] border border-slate-50">
                <h4 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
                  <CreditCard size={22} className="text-blue-600" />
                  Financial Impact
                </h4>
                <div className="space-y-6">
                   <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 italic">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">TOTAL_OUTFLOW</p>
                      <p className="text-3xl font-black text-slate-900 tracking-tighter">{formatINR(totalSpent)}</p>
                   </div>
                   <div className="flex items-center gap-4 p-4 text-emerald-600 bg-emerald-50 rounded-2xl">
                      <div className="p-2 bg-white rounded-xl shadow-sm"><Shield size={16} /></div>
                      <p className="text-xs font-black uppercase tracking-tight">Saved {formatINR(totalSpent * 0.35)} vs Petrol ICE</p>
                   </div>
                </div>
             </Card>
          </aside>
        </div>

        <Card className="border-none shadow-2xl bg-white overflow-hidden rounded-[3.5rem] border border-slate-50">
          <div className="px-12 py-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
             <h3 className="text-2xl font-black text-slate-900 tracking-tight">System Event Log</h3>
             <div className="relative w-64 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={18} />
                <input placeholder="Filter log ID..." className="w-full pl-12 pr-6 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-blue-600 transition-all font-bold text-sm outline-none shadow-sm" />
             </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white border-b border-slate-50">
                  <th className="px-12 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Deployment Asset</th>
                  <th className="px-12 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Station Node</th>
                  <th className="px-12 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Energy Delta</th>
                  <th className="px-12 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Time Vector</th>
                  <th className="px-12 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Transaction</th>
                  <th className="px-12 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Date Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-bold">
                {history.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-12 py-8">
                       <div className="flex items-center gap-4">
                          <div className="p-3 bg-white rounded-xl shadow-sm text-slate-400 group-hover:text-blue-600 transition-colors">
                             <Car size={18} />
                          </div>
                          <span className="text-slate-900 tracking-tight">{row.vehicle}</span>
                       </div>
                    </td>
                    <td className="px-12 py-8 text-slate-500 italic text-sm">{row.station}</td>
                    <td className="px-12 py-8">
                       <Badge className="bg-blue-50 text-blue-600 border-none font-black px-3 py-1.5 rounded-lg text-[10px]">{row.energy} kWh</Badge>
                    </td>
                    <td className="px-12 py-8 text-slate-400 text-xs font-black uppercase tracking-widest">{row.duration}</td>
                    <td className="px-12 py-8 text-slate-900 font-black tracking-tighter italic">₹{row.amount}</td>
                    <td className="px-12 py-8">
                       <span className="px-4 py-2 bg-slate-100 rounded-xl text-[10px] text-slate-500 font-black uppercase tracking-widest">{row.date}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ChargingHistory;
