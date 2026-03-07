import React, { useState, useEffect } from "react";
import { DashboardLayout } from "./DashboardLayout";
import { 
  Plus, Trash2, Zap, Battery, Shield, ArrowRight,
  CheckCircle2, AlertCircle, Info, Settings, Car
} from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { toast } from "sonner";
import { fetchUserVehicles, simulateApiCall } from "../utils/api";

const VehicleManagement: React.FC = () => {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newVehicle, setNewVehicle] = useState({ 
    name: "", 
    model: "Tata Nexon EV", 
    batteryCapacity: "40.5", 
    connectorType: "CCS2",
    regNo: "" 
  });

  useEffect(() => {
    const loadVehicles = async () => {
      try {
        const data = await fetchUserVehicles();
        setVehicles(data);
      } catch (err) {
        toast.error("Telemetry Sync Error");
      } finally {
        setLoading(false);
      }
    };
    loadVehicles();
  }, []);

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVehicle.regNo) return toast.error("Registration Number Required");
    
    try {
      toast.loading("Registering with RTO Nexus...");
      await simulateApiCall(newVehicle);
      const vehicle = {
        id: Math.random().toString(36).substr(2, 9),
        ...newVehicle,
        status: "Ready"
      };
      setVehicles([...vehicles, vehicle]);
      setIsAdding(false);
      setNewVehicle({ name: "", model: "Tata Nexon EV", batteryCapacity: "40.5", connectorType: "CCS2", regNo: "" });
      toast.dismiss();
      toast.success("Vehicle Deployment Successful");
    } catch (err) {
      toast.error("Registration Failed");
    }
  };

  const removeVehicle = async (id: string) => {
    try {
      toast.loading("De-registering...");
      await simulateApiCall(null);
      setVehicles(vehicles.filter(v => v.id !== id));
      toast.dismiss();
      toast.error("Vehicle Purged from System");
    } catch (err) {
      toast.error("Purge Failed");
    }
  };

  if (loading) return <DashboardLayout><div className="p-20 text-center font-black italic animate-pulse text-blue-600">SYNCING VEHICLE TELEMETRY...</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-12 max-w-7xl mx-auto pb-20 px-4 md:px-0">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-none">Fleet Management</h1>
            <p className="mt-4 text-slate-500 font-bold uppercase tracking-[0.2em] text-xs flex items-center gap-2 italic">
              <Shield size={14} className="text-blue-600" />
              Secure Digital Registry • Indian RTO Compliant
            </p>
          </div>
          <Button 
            onClick={() => setIsAdding(!isAdding)}
            className={`h-16 px-10 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl transition-all ${
              isAdding ? "bg-zinc-100 text-zinc-900 border-2 border-zinc-200" : "bg-blue-600 text-white shadow-blue-200 hover:bg-black"
            }`}
          >
            {isAdding ? "ABORT OPERATION" : <><Plus size={20} className="mr-3" /> ADD NEW VEHICLE</>}
          </Button>
        </div>

        {isAdding && (
          <Card className="border-none shadow-[0_40px_100px_rgba(0,0,0,0.1)] bg-white p-10 md:p-14 rounded-[3.5rem] border border-slate-50 animate-in fade-in slide-in-from-top-10 duration-500">
            <h3 className="text-2xl font-black text-slate-900 mb-10 flex items-center gap-4">
               <div className="p-3 bg-zinc-900 rounded-2xl text-white shadow-xl"><Plus size={24} /></div>
               Register New Strategic Asset
            </h3>
            <form onSubmit={handleAddVehicle} className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                <div className="space-y-4">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">ASSET_NICKNAME</label>
                  <input required value={newVehicle.name} onChange={e => setNewVehicle({...newVehicle, name: e.target.value})} placeholder="e.g. Stormbreaker" className="w-full px-6 py-5 bg-zinc-50 border-2 border-transparent focus:bg-white focus:border-black rounded-3xl transition-all font-bold text-slate-900 outline-none shadow-inner" />
                </div>
                <div className="space-y-4">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">MODEL_SPEC</label>
                  <select value={newVehicle.model} onChange={e => setNewVehicle({...newVehicle, model: e.target.value})} className="w-full px-6 py-5 bg-zinc-50 border-2 border-transparent focus:bg-white focus:border-black rounded-3xl transition-all font-bold text-slate-900 outline-none shadow-inner appearance-none">
                    <option value="Tata Nexon EV">Tata Nexon EV</option>
                    <option value="MG ZS EV">MG ZS EV</option>
                    <option value="Tata Tiago EV">Tata Tiago EV</option>
                    <option value="Mahindra XUV400">Mahindra XUV400</option>
                    <option value="Hyundai IONIQ 5">Hyundai IONIQ 5</option>
                  </select>
                </div>
                <div className="space-y-4">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">BATTERY_CAPACITY_KWH</label>
                  <input required type="number" value={newVehicle.batteryCapacity} onChange={e => setNewVehicle({...newVehicle, batteryCapacity: e.target.value})} className="w-full px-6 py-5 bg-zinc-50 border-2 border-transparent focus:bg-white focus:border-black rounded-3xl transition-all font-bold text-slate-900 outline-none shadow-inner" />
                </div>
                <div className="space-y-4">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">RTO_REG_NUMBER</label>
                  <input required value={newVehicle.regNo} onChange={e => setNewVehicle({...newVehicle, regNo: e.target.value})} placeholder="KA 03 MS 1234" className="w-full px-6 py-5 bg-zinc-50 border-2 border-transparent focus:bg-white focus:border-black rounded-3xl transition-all font-bold text-slate-900 outline-none shadow-inner uppercase" />
                </div>
              </div>
              <Button type="submit" className="w-full bg-black hover:bg-zinc-800 py-9 text-sm font-black rounded-3xl shadow-2xl shadow-zinc-200 transition-all group">
                INDUCT VEHICLE INTO FLEET <ArrowRight size={20} className="ml-3 group-hover:translate-x-2 transition-transform" />
              </Button>
            </form>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {vehicles.map((v) => (
            <Card key={v.id} className="border-none shadow-2xl hover:shadow-[0_50px_100px_rgba(0,0,0,0.1)] transition-all duration-500 overflow-hidden group bg-white rounded-[3.5rem] border border-slate-50 relative">
              <div className="h-4 w-full bg-blue-600"></div>
              <div className="p-10">
                <div className="flex justify-between items-start mb-10">
                  <div className="p-5 bg-slate-50 rounded-[2rem] text-slate-900 group-hover:bg-zinc-900 group-hover:text-white transition-all duration-500 transform group-hover:rotate-6 shadow-xl">
                    <Zap size={32} fill="currentColor" />
                  </div>
                  <button onClick={() => removeVehicle(v.id)} className="p-4 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all">
                    <Trash2 size={24} />
                  </button>
                </div>

                <div className="space-y-8">
                  <div>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{v.name}</h3>
                    <p className="text-xs font-black text-slate-400 mt-2 uppercase tracking-[0.25em]">{v.model}</p>
                  </div>

                  <div className="flex items-center gap-4 py-6 border-y-2 border-slate-50 border-dashed">
                     <div className="flex-1 flex flex-col gap-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Plate Info</span>
                        <span className="text-sm font-black text-blue-600">{v.regNo}</span>
                     </div>
                     <div className="flex-1 flex flex-col gap-1 border-l-2 border-slate-50 pl-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Capacity</span>
                        <span className="text-sm font-black text-slate-900">{v.batteryCapacity} kWh</span>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                           <Battery size={12} className="text-emerald-500" /> System Integrity
                        </span>
                        <span className="text-[10px] font-black text-emerald-600 uppercase">92% Health</span>
                     </div>
                     <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 w-[92%] shadow-[0_0_10px_rgba(16,185,129,0.4)]"></div>
                     </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                     <Badge className="bg-emerald-50 text-emerald-600 border-none px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">
                        OPERATIONAL
                     </Badge>
                     <Badge className="bg-blue-50 text-blue-600 border-none px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">
                        {v.connectorType}
                     </Badge>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {vehicles.length === 0 && (
            <div className="col-span-full py-32 text-center bg-slate-50/50 rounded-[4rem] border-4 border-dashed border-slate-100">
               <div className="mb-6 opacity-20 flex justify-center"><Car size={80} /></div>
               <p className="text-2xl font-black text-slate-300 italic">NO ACTIVE TELEMETRY LINKS FOUND</p>
               <Button onClick={() => setIsAdding(true)} variant="ghost" className="mt-6 text-blue-600 font-black uppercase tracking-widest text-xs hover:bg-transparent">
                  INITIATE REGISTRATION SEQUENCE
               </Button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default VehicleManagement;
