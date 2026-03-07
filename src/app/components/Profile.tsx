import React from "react";
import { DashboardLayout } from "./DashboardLayout";
import { 
  Settings, 
  Shield, 
  Camera, 
  LogOut,
  ArrowRight,
  CheckCircle2
} from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { toast } from "sonner";
import { fetchUserProfile, fetchChargingHistory, apiUpdateProfile } from "../utils/api";

const Profile: React.FC = () => {
  const [loading, setLoading] = React.useState(true);
  const [user, setUser] = React.useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    location: "",
    membership: "",
    walletBalance: 0,
    loyaltyPoints: 0
  });
  const [stats, setStats] = React.useState({ totalEnergy: 0, totalSessions: 0 });

  React.useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await fetchUserProfile();
        setUser(data);
        const history = await fetchChargingHistory();
        const chargingSessions = history.filter((h: any) => h.vehicle !== "STREET_WALLET");
        setStats({
          totalEnergy: Math.round(chargingSessions.reduce((s: number, h: any) => s + (h.energy || 0), 0) * 10) / 10,
          totalSessions: chargingSessions.length,
        });
      } catch (err) {
        toast.error("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      toast.loading("Synchronizing...");
      const updated = await apiUpdateProfile({
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        location: user.location,
        email: user.email,
      });
      setUser({ ...user, ...updated });
      toast.dismiss();
      toast.success("Profile updated!");
    } catch (err: any) {
      toast.dismiss();
      toast.error(err.message || "Update failed.");
    }
  };

  if (loading) return <DashboardLayout><div className="p-20 text-center font-black italic tracking-tighter text-blue-600 animate-pulse">BOOTING PROFILE SYSTEM...</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-5xl mx-auto pb-10">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter">System Interface / User Profile</h1>
          <p className="text-gray-500 font-bold mt-1 uppercase text-xs tracking-[0.3em] italic text-blue-600">EV-Portal Control Center</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-8 lg:col-span-1">
            <Card className="border-none shadow-2xl bg-white overflow-hidden p-8 text-center relative group rounded-[3rem] border border-gray-100">
              <div className="absolute top-6 right-6 text-emerald-500 group-hover:scale-125 transition-transform duration-500">
                <CheckCircle2 size={32} fill="currentColor" />
              </div>
              <div className="relative mx-auto w-40 h-40 mb-8 group cursor-pointer">
                <Avatar className="w-40 h-40 border-[12px] border-gray-50 p-1.5 bg-white shadow-2xl transition-all hover:scale-105 duration-500 hover:rotate-2">
                  <AvatarImage 
                    src={`https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=000&color=fff&size=256&bold=true`} 
                    className="rounded-full"
                  />
                  <AvatarFallback className="bg-black text-white font-black text-4xl">{user.firstName?.[0]}</AvatarFallback>
                </Avatar>
                <div className="absolute bottom-2 right-2 bg-blue-600 text-white p-3.5 rounded-3xl shadow-2xl border-4 border-white opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
                  <Camera size={20} />
                </div>
              </div>
              <h2 className="text-3xl font-black text-gray-900 tracking-tight">{user.firstName} {user.lastName}</h2>
              <p className="text-[11px] font-black text-gray-400 mt-3 flex items-center justify-center gap-2 uppercase tracking-[0.3em] leading-none">
                <Shield size={14} className="text-blue-600" />
                {user.membership}
              </p>

              <div className="mt-10 grid grid-cols-2 gap-6 py-8 border-y-2 border-dashed border-gray-100">
                <div className="text-center">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">ENERGY</p>
                  <p className="text-2xl font-black text-blue-600">{stats.totalEnergy} <span className="text-xs font-bold text-gray-400">kWh</span></p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">SESSIONS</p>
                  <p className="text-2xl font-black text-blue-600">{stats.totalSessions}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">LOYALTY</p>
                  <p className="text-2xl font-black text-amber-500">{user.loyaltyPoints}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">BALANCE</p>
                  <p className="text-2xl font-black text-emerald-500">₹{(user.walletBalance || 0).toLocaleString("en-IN")}</p>
                </div>
              </div>

              <div className="mt-10 space-y-4">
                <Button onClick={() => (document.getElementById("f_name") as any)?.focus()} className="w-full bg-black hover:bg-zinc-800 py-8 text-xs font-black rounded-3xl shadow-2xl shadow-zinc-200 uppercase tracking-widest">
                  ACCESS SETTINGS
                </Button>
                <button onClick={() => { localStorage.clear(); window.location.href="/signin"; }} className="w-full py-5 text-gray-400 font-black text-[10px] uppercase tracking-widest hover:text-red-500 transition-colors flex items-center justify-center gap-2">
                  <LogOut size={16} /> TERMINATE SESSION
                </button>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <Card className="border-none shadow-2xl bg-white p-10 md:p-14 rounded-[3.5rem] border border-gray-50">
              <h3 className="text-2xl font-black text-gray-900 mb-12 flex items-center gap-4">
                <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100 shadow-sm"><Settings size={28} className="text-zinc-900" /></div>
                Core Identification
              </h3>
              <form onSubmit={handleUpdate} className="space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] ml-2">USER_FIRST_NAME</label>
                    <input id="f_name" value={user.firstName} onChange={(e)=>setUser({...user, firstName: e.target.value})} className="w-full px-6 py-5 bg-zinc-50 border-2 border-transparent focus:bg-white focus:border-black rounded-3xl transition-all font-bold text-gray-900 outline-none shadow-inner" />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] ml-2">USER_LAST_NAME</label>
                    <input value={user.lastName} onChange={(e)=>setUser({...user, lastName: e.target.value})} className="w-full px-6 py-5 bg-zinc-50 border-2 border-transparent focus:bg-white focus:border-black rounded-3xl transition-all font-bold text-gray-900 outline-none shadow-inner" />
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] ml-2">COMMUNICATION_SECURE_EMAIL</label>
                  <input value={user.email} onChange={(e)=>setUser({...user, email: e.target.value})} className="w-full px-6 py-5 bg-zinc-50 border-2 border-transparent focus:bg-white focus:border-black rounded-3xl transition-all font-bold text-gray-900 outline-none shadow-inner" />
                </div>
                <div className="space-y-4">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] ml-2">TELEMETRY_PHONE_LINK</label>
                  <input value={user.phone} onChange={(e)=>setUser({...user, phone: e.target.value})} className="w-full px-6 py-5 bg-zinc-50 border-2 border-transparent focus:bg-white focus:border-black rounded-3xl transition-all font-bold text-gray-900 outline-none shadow-inner" />
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 py-9 text-sm font-black rounded-3xl shadow-2xl shadow-blue-200 group">
                  UPDATING CENTRAL DATABASE <ArrowRight size={20} className="ml-3 group-hover:translate-x-2 transition-transform" />
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
