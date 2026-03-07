import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  MapPin, 
  History, 
  User, 
  LogOut, 
  Menu, 
  X, 
  Zap,
  Bell,
  ChevronLeft,
  ChevronRight,
  Map,
  Gauge,
  Settings,
  CalendarCheck
} from "lucide-react";
import { cn } from "./ui/utils";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { MessageSquareReply, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { ChatbotModule } from "./chatbot/ChatbotModule";
import { apiUpdateProfile } from "../utils/api";

/** Global Error Boundary for the Dashboard UI **/
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: any) { console.error("Layout Error:", error); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6 text-center">
          <AlertCircle size={48} className="text-red-500 mb-4" />
          <h2 className="text-xl font-black italic">PANIC: Something went wrong in the dashboard.</h2>
          <Button onClick={() => window.location.reload()} className="mt-4 bg-blue-600">RELOAD SYSTEM</Button>
        </div>
      );
    }
    return this.props.children;
  }
}

const OPENCAGE_API_KEY = "8308a66a7b2847a4b91623183b07794c";

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  href: string;
  active?: boolean;
  collapsed?: boolean;
}

const SidebarItem = ({ icon: Icon, label, href, active, collapsed }: SidebarItemProps) => (
  <Link
    to={href}
    className={cn(
      "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group",
      active 
        ? "bg-blue-600 text-white shadow-md shadow-blue-200" 
        : "text-gray-500 hover:bg-gray-100 hover:text-gray-900",
      collapsed && "justify-center px-2"
    )}
  >
    <Icon size={20} className={cn(active ? "text-white" : "text-gray-400 group-hover:text-gray-900")} />
    {!collapsed && <span className="font-medium text-sm whitespace-nowrap">{label}</span>}
  </Link>
);

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [location, setLocation] = useState<string>("Detecting location...");
  const [userName, setUserName] = useState("User");
  const [showChatbot, setShowChatbot] = useState(false);
  const navigate = useNavigate();
  const pathname = useLocation().pathname;

  // Sidebar is visually expanded when not collapsed OR when hovered while collapsed
  const sidebarExpanded = !collapsed || hovered;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/signin");
      return;
    }

    // Get user name from cached profile (set by api.ts after API call)
    const profile = localStorage.getItem("user_profile");
    if (profile) {
      try {
        const p = JSON.parse(profile);
        const name = p.name || `${p.firstName || ""} ${p.lastName || ""}`.trim();
        setUserName(name || "User");
      } catch {}
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await fetch(
              `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${OPENCAGE_API_KEY}`
            );
            const data = await response.json();
            if (data.results && data.results.length > 0) {
              const loc = data.results[0].formatted;
              setLocation(loc);
              // Save detected location to user profile in backend
              apiUpdateProfile({ location: loc }).catch(() => {});
            } else {
              setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
            }
          } catch (error) {
            setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          }
        },
        () => {
          setLocation("Location access denied");
        }
      );
    } else {
      setLocation("Geolocation not supported");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_profile");
    localStorage.removeItem("ev_portal_session");
    navigate("/signin");
  };

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: MapPin, label: "Nearby Chargers", href: "/dashboard/chargers" },
    { icon: Map, label: "Stations Map", href: "/dashboard/map" },
    { icon: CalendarCheck, label: "Slot Booking", href: "/dashboard/slot-booking" },
    { icon: Gauge, label: "Load Control", href: "/dashboard/load-control" },
    { icon: History, label: "Charging History", href: "/dashboard/history" },
    { icon: User, label: "Profile", href: "/dashboard/profile" },
    { icon: Settings, label: "Settings", href: "/dashboard/settings" },
  ];

  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
        {/* Sidebar */}
      <aside 
        className={cn(
          "bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out z-30",
          sidebarExpanded ? "w-64" : "w-16"
        )}
        onMouseEnter={() => collapsed && setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="p-4 flex items-center gap-3 border-b border-gray-100 h-16">
          <div className="bg-blue-600 p-1.5 rounded-lg shrink-0">
            <Zap size={20} className="text-white fill-white" />
          </div>
          {sidebarExpanded && (
            <span className="font-bold text-lg tracking-tight text-gray-900 italic whitespace-nowrap">
              EV-PORTAL
            </span>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {menuItems.map((item) => (
            <SidebarItem
              key={item.href}
              {...item}
              active={pathname === item.href}
              collapsed={!sidebarExpanded}
            />
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 w-full px-3 py-2 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all group",
              !sidebarExpanded && "justify-center px-2"
            )}
            title="Logout"
          >
            <LogOut size={20} />
            {sidebarExpanded && <span className="font-medium text-sm">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 z-20">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
            >
              {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
            <div className="hidden md:flex items-center gap-2 text-gray-500">
              <MapPin size={16} className="text-blue-600" />
              <span className="text-sm font-medium truncate max-w-[300px]" title={location}>
                {location}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500 relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-px bg-gray-200 mx-1"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-900 leading-none">{userName}</p>
                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-tighter mt-1">Premium Member</p>
              </div>
              <Avatar className="h-9 w-9 border border-gray-200">
                <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=2563eb&color=fff&size=64&bold=true`} />
                <AvatarFallback>{userName.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-gray-50/50 relative">
          {children}
          
          {/* Chatbot Module */}
          {showChatbot && <ChatbotModule />}

          {/* AI Assistant Toggle Button */}
          <div className="fixed bottom-6 right-6 z-50">
            <button 
              onClick={() => setShowChatbot(prev => !prev)}
              className="bg-blue-600 hover:bg-blue-700 text-white w-14 h-14 rounded-full shadow-2xl shadow-blue-400 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 group relative"
              title="AI Charging Assistant"
            >
              {!showChatbot && (
                <>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping"></div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></div>
                </>
              )}
              {showChatbot ? <X size={28} /> : <MessageSquareReply size={28} />}
              <span className="absolute right-full mr-4 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {showChatbot ? "Close Chat" : "AI Assistant"}
              </span>
            </button>
          </div>
        </main>
      </div>
    </div>
    </ErrorBoundary>
  );
};
