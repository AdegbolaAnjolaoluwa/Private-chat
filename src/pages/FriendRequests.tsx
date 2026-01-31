import { FriendRequest } from "@/types/chat";
import { acceptFriendRequest, declineFriendRequest, getFriendRequests } from "@/lib/api";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, Flame, Check, Clock, UserMinus, Info } from "lucide-react";
import { useState } from "react";

export default function FriendRequests() {
  const qc = useQueryClient();
  const { data: incoming = [], isLoading } = useQuery<FriendRequest[]>({
    queryKey: ["friendRequests", "incoming"],
    queryFn: () => getFriendRequests("incoming"),
    retry: 0,
  });

  const acceptMut = useMutation({
    mutationFn: (id: string) => acceptFriendRequest(id),
    onSuccess: () => {
      toast.success("Connection established");
      qc.invalidateQueries({ queryKey: ["friendRequests"] });
    },
  });

  const declineMut = useMutation({
    mutationFn: (id: string) => declineFriendRequest(id),
    onSuccess: () => {
      toast.info("Invitation burned");
      qc.invalidateQueries({ queryKey: ["friendRequests"] });
    },
  });

  // Helper for relative time
  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "Just now";
    if (hours === 1) return "1 hour ago";
    return `${hours} hours ago`;
  };

  return (
    <div className="flex flex-col h-full bg-[#05070a] p-6 md:p-12 overflow-y-auto relative">
      <div className="max-w-5xl mx-auto w-full h-full flex flex-col">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-6 tracking-tight">Friend Requests</h1>
        
        {/* Note Box */}
        <div className="bg-[#135bec]/5 border-l-2 border-[#135bec] p-4 rounded-r-lg flex items-start gap-3">
          <Info className="w-5 h-5 text-[#135bec] shrink-0 mt-0.5" />
          <p className="text-sm text-white/70 leading-relaxed">
            <span className="text-[#135bec] font-bold">Note:</span> Invitations are the only way into the circle. Choose your friends wisely.
          </p>
        </div>
      </div>

      {/* Pending Section */}
      <div className="space-y-6 flex-1">
        <div className="flex items-center justify-between">
          <h2 className="text-[10px] font-mono uppercase tracking-widest text-white/40 font-semibold">
            Pending Invitations
          </h2>
          <span className="text-[10px] font-mono text-white/20">
            {incoming.length} REQUESTS
          </span>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#135bec]"></div>
            </div>
          ) : incoming.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-white/10 rounded-xl">
              <p className="text-white/30 text-sm">No pending invitations.</p>
            </div>
          ) : (
            incoming.map((req) => (
              <div 
                key={req.id}
                className="bg-[#0b0f1a] border border-white/5 rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center gap-6 group hover:border-white/10 transition-all shadow-lg"
              >
                {/* Avatar */}
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-lg font-bold text-white/80 border border-white/10">
                    {req.fromUser.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0b0f1a]" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-mono font-bold text-lg mb-1 tracking-wide">
                    @{req.fromUser}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <span>Received {timeAgo(req.createdAt)}</span>
                    <span className="w-1 h-1 rounded-full bg-white/20" />
                    <span>Trust Level: <span className="text-white/60">Unknown</span></span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
                  <button 
                    onClick={() => acceptMut.mutate(req.id)}
                    disabled={acceptMut.isPending}
                    className="flex-1 md:flex-none bg-[#135bec]/10 hover:bg-[#135bec] border border-[#135bec]/50 hover:border-[#135bec] text-[#135bec] hover:text-white px-6 py-2.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2"
                  >
                    {acceptMut.isPending ? "..." : "Accept"}
                  </button>
                  <button 
                    onClick={() => declineMut.mutate(req.id)}
                    disabled={declineMut.isPending}
                    className="flex-1 md:flex-none bg-transparent hover:bg-red-500/10 border border-white/10 hover:border-red-500/50 text-white/40 hover:text-red-400 px-6 py-2.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2"
                  >
                    {declineMut.isPending ? "..." : "Burn"}
                  </button>
                </div>
              </div>
            ))
          )}

          {/* Dummy Expired Item for Visual Match (Optional - can be removed if not needed) */}
          {incoming.length > 0 && (
             <div className="bg-[#0b0f1a]/50 border border-white/5 rounded-xl p-6 flex items-center gap-6 opacity-50 grayscale select-none">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center" />
                <div className="flex-1">
                   <div className="h-4 w-32 bg-white/10 rounded mb-2" />
                   <div className="h-3 w-48 bg-white/5 rounded" />
                </div>
                <div className="px-6 py-2.5 border border-white/5 rounded-lg text-xs font-bold text-white/20 uppercase">
                   Expired
                </div>
             </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 flex flex-col items-center justify-center gap-3 opacity-30">
        <Shield className="w-5 h-5 text-[#135bec]" />
        <span className="text-[10px] uppercase tracking-[0.3em] text-[#135bec] font-bold">
          End-to-End Encrypted System
        </span>
      </div>
      </div>
    </div>
  );
}