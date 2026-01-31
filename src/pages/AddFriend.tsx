import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Fingerprint, Info, ShieldCheck, X } from "lucide-react";
import { sendFriendRequest } from "@/lib/api";

export default function AddFriend() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [identifier, setIdentifier] = useState("");

  const mut = useMutation({
    mutationFn: (identifier: string) => sendFriendRequest(identifier),
    onMutate: async (id) => {
      toast.info(`Initiating pulse to ${id}...`);
    },
    onSuccess: (_res, id) => {
      toast.success(`Pulse initiated: ${id}`);
      qc.invalidateQueries({ queryKey: ["friendRequests"] });
      navigate("/app/requests");
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Pulse failed: Terminal unreachable";
      toast.error(message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (identifier.trim()) {
      mut.mutate(identifier.trim());
    }
  };

  const handleClose = () => {
    navigate("/app/friends");
  };

  // Format identifier as user types (XXXX-XXXX-XXXX)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9a-zA-Z]/g, "").toUpperCase();
    if (val.length > 4) val = val.slice(0, 4) + "-" + val.slice(4);
    if (val.length > 9) val = val.slice(0, 9) + "-" + val.slice(9);
    if (val.length > 14) val = val.slice(0, 14); // Limit length
    setIdentifier(val);
  };

  return (
    <div className="flex flex-col h-full items-center justify-center bg-[#05070a] p-6 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#135bec]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-[#0b0f1a] border border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-white tracking-tight">Add to Circle</h2>
            <button 
              onClick={handleClose}
              className="text-white/40 hover:text-white transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Input Section */}
            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-semibold block">
                Identify Peer
              </label>
              <div className="relative group">
                <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-[#135bec] transition-colors" />
                <input
                  type="text"
                  value={identifier}
                  onChange={handleChange}
                  placeholder="0000-0000-0000"
                  className="w-full bg-[#05070a] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white font-mono tracking-widest text-lg placeholder:text-white/10 focus:outline-none focus:border-[#135bec]/50 focus:ring-1 focus:ring-[#135bec]/50 transition-all text-center uppercase"
                  autoFocus
                />
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-[#135bec]/5 border border-[#135bec]/20 rounded-lg p-4 flex gap-3">
              <div className="shrink-0 mt-0.5">
                <div className="w-5 h-5 rounded-full bg-[#135bec] flex items-center justify-center">
                  <Info className="w-3 h-3 text-white" />
                </div>
              </div>
              <p className="text-xs text-white/70 leading-relaxed">
                You can only add those who have shared their ID with you directly. <span className="text-[#135bec] font-semibold">Connection is intentional.</span>
              </p>
            </div>

            {/* Button */}
            <button
              type="submit"
              disabled={!identifier.trim() || mut.isPending}
              className="w-full bg-[#135bec] hover:bg-[#135bec]/90 text-white py-4 rounded-xl font-bold tracking-wide transition-all shadow-[0_0_20px_rgba(19,91,236,0.3)] hover:shadow-[0_0_30px_rgba(19,91,236,0.5)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
            >
              {mut.isPending ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                  </span>
                  <span>INITIATE PULSE</span>
                </>
              )}
            </button>
          </form>

          {/* Secure Footer */}
          <div className="mt-8 flex items-center justify-center gap-2 opacity-30">
            <ShieldCheck className="w-3 h-3 text-white" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-white font-semibold">
              Secured End-to-End Encryption Enabled
            </span>
          </div>

          {/* Decorative Glow */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#135bec]/50 to-transparent opacity-50" />
        </div>
      </div>
    </div>
  );
}