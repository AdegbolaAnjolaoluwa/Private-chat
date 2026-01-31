import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, Outlet } from "react-router-dom";
import { Shield, Users, UserPlus, Settings, Power, Clock, Circle, ChevronLeft, ChevronRight, Menu } from "lucide-react";
import { getFriendRequests } from "@/lib/api";

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);
  const [ping, setPing] = useState(24);
  const [authUser, setAuthUser] = useState<{ username?: string }>({});
  const [collapsed, setCollapsed] = useState(false);

  // Load user data
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("authUser") || "{}");
    setAuthUser(user);
    
    // Initial fetch
    getFriendRequests("incoming").then((reqs) => setPendingCount(reqs.length)).catch(() => setPendingCount(0));

    // Ping simulation
    const interval = setInterval(() => {
      setPing(Math.floor(Math.random() * (45 - 15 + 1)) + 15);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const activeView = useMemo(() => {
    if (location.pathname.startsWith("/app/requests")) return "requests";
    if (location.pathname.startsWith("/app/add-friend")) return "add-friend";
    if (location.pathname.startsWith("/app/settings")) return "settings";
    return "friends";
  }, [location.pathname]);

  const onLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    navigate("/login");
  };

  const NavItem = ({ id, icon: Icon, label, count }: { id: string; icon: React.ElementType; label: string; count?: number }) => {
    const isActive = activeView === id;
    let path = "/app/friends";
    if (id === "requests") path = "/app/requests";
    if (id === "add-friend") path = "/app/add-friend";
    if (id === "settings") path = "/app/settings";
    
    return (
      <button
        onClick={() => navigate(path)}
        className={`w-full flex items-center ${collapsed ? "justify-center px-2" : "gap-3 px-4"} py-3 text-sm font-medium transition-all duration-200 group relative ${
          isActive 
            ? "bg-[#135bec]/10 text-[#135bec]" 
            : "text-white/60 hover:text-white hover:bg-white/5"
        }`}
        title={collapsed ? label : undefined}
      >
        {isActive && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#135bec] shadow-[0_0_10px_#135bec]" />
        )}
        <Icon className={`w-4 h-4 ${isActive ? "text-[#135bec]" : "text-white/40 group-hover:text-white"}`} />
        {!collapsed && <span>{label}</span>}
        {count !== undefined && count > 0 && (
          <span className={`${collapsed ? "absolute top-1 right-1" : "ml-auto"} text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#135bec] text-white`}>
            {count}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="flex h-screen w-full bg-[#05070a] text-white font-sans overflow-hidden">
      
      {/* Sidebar */}
      <aside className={`${collapsed ? "w-20" : "w-64"} flex-shrink-0 border-r border-white/5 bg-[#0b0f1a] flex flex-col z-20 transition-all duration-300 ease-in-out`}>
        
        {/* Header */}
        <div className="p-6 relative">
          <div className={`flex items-center ${collapsed ? "justify-center flex-col gap-4" : "justify-between"} mb-2`}>
            <div className="flex items-center gap-3">
               <Shield className="w-6 h-6 text-[#135bec] fill-current" />
               {!collapsed && <span className="font-bold text-lg tracking-tight">PrivateChat</span>}
            </div>
            
            <button 
              onClick={() => setCollapsed(!collapsed)} 
              className={`text-white/20 hover:text-white transition-colors ${collapsed ? "" : ""}`}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
          
          {!collapsed && (
            <div className="flex items-center gap-2 pl-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#135bec] animate-pulse" />
              <span className="text-[10px] font-mono text-[#135bec] tracking-widest uppercase">
                ID: {authUser.username || "UNKNOWN"}
              </span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 py-6 space-y-1">
          <div className={`px-4 mb-2 ${collapsed ? "text-center opacity-0 h-0 overflow-hidden" : "opacity-100 transition-opacity duration-300"}`}>
            <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Navigation</span>
          </div>
          <NavItem id="friends" icon={Users} label="Friends" />
          <NavItem id="requests" icon={Clock} label="Requests" count={pendingCount} />
          <NavItem id="add-friend" icon={UserPlus} label="Add Friend" />

          <div className={`px-4 mb-2 mt-8 ${collapsed ? "text-center opacity-0 h-0 overflow-hidden" : "opacity-100 transition-opacity duration-300"}`}>
            <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">System</span>
          </div>
          <NavItem id="settings" icon={Settings} label="Settings" />
          <button 
            onClick={onLogout}
            className={`w-full flex items-center ${collapsed ? "justify-center px-2" : "gap-3 px-4"} py-3 text-sm font-medium text-red-400/60 hover:text-red-400 hover:bg-red-400/10 transition-colors`}
            title={collapsed ? "Disconnect" : undefined}
          >
            <Power className="w-4 h-4" />
            {!collapsed && <span>Disconnect</span>}
          </button>
        </div>

        {/* Node Status */}
        <div className={`p-4 mt-auto ${collapsed ? "flex justify-center" : ""}`}>
          <div className={`bg-black/40 border border-white/5 rounded-lg p-3 ${collapsed ? "w-full flex justify-center items-center p-2" : ""}`}>
            {!collapsed && <span className="block text-[9px] text-white/30 font-bold uppercase tracking-widest mb-1">Node Status</span>}
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
              {!collapsed && <span className="text-xs font-mono text-white/80">SECURE_ACTIVE</span>}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative min-w-0">
        
        {/* Top Warning Banner */}
        <div className="h-10 bg-[#135bec]/10 border-b border-[#135bec]/20 flex items-center justify-center gap-3 px-4 flex-shrink-0">
          <Clock className="w-3.5 h-3.5 text-[#135bec] animate-pulse" />
          <p className="text-[10px] md:text-xs font-medium text-[#135bec] tracking-wide uppercase">
            <span className="font-bold">Auto-Delete Enabled:</span> All encrypted transmissions terminate after <span className="bg-[#135bec]/20 px-1 rounded">120m</span>
          </p>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-hidden relative">
          <Outlet />
        </div>

        {/* Bottom Status Bar */}
        <div className="h-8 bg-[#0b0f1a] border-t border-white/5 flex items-center justify-between px-4 text-[9px] font-mono text-white/30 uppercase tracking-widest flex-shrink-0 z-20">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2">
              Ping: <span className="text-green-400">{ping}ms</span>
            </span>
            <span className="flex items-center gap-2">
              Buffer: <span className="text-[#135bec]">Encrypted</span>
            </span>
          </div>
          <div>
            Secure Layer Protocol v4.4.1
          </div>
        </div>

      </main>
    </div>
  );
}
