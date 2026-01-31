import { useState, useEffect } from "react";
import { RefreshCw, WifiOff, CircleDashed } from "lucide-react";

export default function ConnectionLost() {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = () => {
    setIsRetrying(true);
    // Simulate check
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6 text-center font-sans overflow-hidden">
      
      {/* Background Glow */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#135bec]/10 via-black/50 to-black" />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center max-w-md w-full animate-in fade-in duration-1000">
        
        {/* Icon Animation */}
        <div className="relative mb-12">
          {/* Outer Ring */}
          <div className="absolute inset-0 border-2 border-[#135bec]/20 rounded-full animate-[spin_10s_linear_infinite]" />
          
          {/* Inner Broken Circle */}
          <div className="relative p-8 rounded-full bg-white/5 border border-white/10 shadow-[0_0_30px_rgba(19,91,236,0.2)]">
            {isRetrying ? (
              <RefreshCw className="w-12 h-12 text-[#135bec] animate-spin" />
            ) : (
              <div className="relative">
                <CircleDashed className="w-12 h-12 text-[#135bec]/50 absolute inset-0 animate-ping opacity-20" />
                <WifiOff className="w-12 h-12 text-[#135bec]" />
              </div>
            )}
          </div>
        </div>

        {/* Headlines */}
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-2">
          The circle is broken.
        </h1>
        
        <h2 className="text-xl md:text-2xl font-medium text-[#135bec] tracking-wide mb-8 animate-pulse">
          Reconnecting to the shadows...
        </h2>

        {/* Warning Text */}
        <p className="text-sm text-white/40 max-w-xs leading-relaxed mb-12">
          Messages sent while offline <span className="text-red-400/80 border-b border-red-400/20">will not be recovered</span>.
        </p>

        {/* Retry Button */}
        <button 
          onClick={handleRetry}
          disabled={isRetrying}
          className="group flex items-center gap-3 px-6 py-3 rounded-full bg-transparent border border-[#135bec]/30 hover:border-[#135bec] hover:bg-[#135bec]/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 text-[#135bec] ${isRetrying ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"}`} />
          <span className="text-xs font-bold tracking-[0.2em] uppercase text-white/80 group-hover:text-white">
            {isRetrying ? "Attempting Reconnection..." : "Retry Connection"}
          </span>
        </button>

        {/* Footer Badge */}
        <div className="absolute -bottom-32 md:-bottom-40 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#135bec] animate-pulse" />
          <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#135bec]/60">
            Offline Protocol Active
          </span>
        </div>

      </div>
    </div>
  );
}
