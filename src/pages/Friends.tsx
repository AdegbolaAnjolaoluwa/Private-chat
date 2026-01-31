import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Friend } from "@/types/chat";
import { getFriends } from "@/lib/api";
import { initSocket, joinChat, socket } from "@/lib/socket";
import { Search, UserPlus, MessageSquare, Monitor, WifiOff } from "lucide-react";

export default function Friends() {
  const navigate = useNavigate();
  const { data: friends = [], isLoading, isError } = useQuery<Friend[]>({ queryKey: ["friends"], queryFn: getFriends, retry: 0 });
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>(() => JSON.parse(localStorage.getItem("unreadCounts") || "{}"));
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
    const currentUserId = authUser.id || "current-user";
    initSocket(currentUserId);
    friends.forEach((f) => joinChat(currentUserId, f.id));
    socket.on("message:new", ({ chatId, message }) => {
      if (message.sender !== currentUserId) {
        setUnreadCounts((prev) => {
          const next = { ...prev, [message.sender]: (prev[message.sender] || 0) + 1 };
          localStorage.setItem("unreadCounts", JSON.stringify(next));
          return next;
        });
      }
    });
    return () => {
      socket.off("message:new");
    };
  }, [friends]);

  const handleSelect = (f: Friend) => {
    setUnreadCounts((prev) => {
      const next = { ...prev, [f.id]: 0 };
      localStorage.setItem("unreadCounts", JSON.stringify(next));
      return next;
    });
    navigate(`/app/chat/${f.id}`);
  };

  const filteredFriends = friends.filter(f => 
    f.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[#05070a] p-6 md:p-12 overflow-y-auto">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Trusted Circle</h1>
          <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
            SECURE_LIST_V2.0.4 // {filteredFriends.length} ENTRIES FOUND
          </p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input 
              type="text"
              placeholder="Filter pulse..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0b0f1a] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#135bec]/50 focus:ring-1 focus:ring-[#135bec]/50 transition-all"
            />
          </div>
          <button 
            onClick={() => navigate("/app/add-friend")}
            className="flex items-center gap-2 bg-[#135bec] hover:bg-[#135bec]/90 text-white px-5 py-2.5 rounded-lg text-sm font-bold tracking-wide transition-all shadow-[0_0_15px_rgba(19,91,236,0.3)]"
          >
            <UserPlus className="w-4 h-4" />
            <span>INVITE</span>
          </button>
        </div>
      </div>

      {/* List Section */}
      <div className="w-full">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#135bec]"></div>
          </div>
        ) : isError ? (
          <div className="p-4 border border-red-500/20 bg-red-500/10 rounded text-red-400 text-sm">
            Failed to load trusted circle.
          </div>
        ) : filteredFriends.length === 0 ? (
          <div className="text-center py-20 text-white/20">
            <p>No active connections found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredFriends.map((friend) => {
              // Mock status for now as we don't have real presence yet
              const isOnline = Math.random() > 0.5; 
              const lastPulse = isOnline ? "Just Now" : `${Math.floor(Math.random() * 12) + 1}h ago`;
              
              return (
                <div 
                  key={friend.id}
                  onClick={() => handleSelect(friend)}
                  className="group relative bg-[#0b0f1a] border border-white/5 rounded-xl p-4 flex items-center gap-4 transition-all hover:border-white/10 hover:bg-[#0f1422] cursor-pointer overflow-hidden"
                >
                {/* Active Indicator Strip */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 transition-colors ${isOnline ? "bg-[#135bec]" : "bg-transparent group-hover:bg-white/10"}`} />

                {/* Avatar */}
                <div className="relative w-12 h-12 rounded bg-white/5 flex items-center justify-center text-lg font-bold text-white/80 border border-white/5 group-hover:border-white/10 transition-colors">
                  {friend.username.substring(0, 2).toUpperCase()}
                  {isOnline && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#135bec] rounded-full border-2 border-[#0b0f1a] shadow-[0_0_8px_#135bec]" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-medium text-lg truncate group-hover:text-[#135bec] transition-colors">
                      {friend.username}
                    </h3>
                  </div>
                  <div className={`flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider ${isOnline ? "text-[#135bec]" : "text-white/30"}`}>
                    {isOnline ? (
                      <>
                        <Monitor className="w-3 h-3" />
                        <span>Active Connection</span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="w-3 h-3" />
                        <span>Terminal Offline</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Meta */}
                <div className="flex flex-col items-end gap-2 text-right">
                  <div className="text-[10px] text-white/30 font-mono uppercase tracking-widest">
                    Last Pulse
                  </div>
                  <div className="text-xs text-white/60 font-medium">
                    {lastPulse}
                  </div>
                </div>

                {/* Action Icon */}
                <div className="pl-4 border-l border-white/5 ml-2">
                  <MessageSquare className={`w-5 h-5 ${unreadCounts[friend.id] > 0 ? "text-[#135bec] fill-current animate-pulse" : "text-white/20 group-hover:text-white/60"}`} />
                </div>
              </div>
            );
          })}
          </div>
        )}
      </div>
    </div>
  );
}
