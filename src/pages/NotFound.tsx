import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const NotFound = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen w-full bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-mono selection:bg-[#135bec]/30">
      
      {/* Grid Background */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), 
                           linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Corner Accents */}
      <div className="absolute top-8 left-8 w-4 h-4 border-t border-l border-white/20" />
      <div className="absolute top-8 right-8 w-4 h-4 border-t border-r border-white/20" />
      <div className="absolute bottom-8 left-8 w-4 h-4 border-b border-l border-white/20" />
      <div className="absolute bottom-8 right-8 w-4 h-4 border-b border-r border-white/20" />

      {/* Main Content */}
      <div className={`z-10 flex flex-col items-center text-center transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        
        {/* System Lockdown Badge */}
        <div className="mb-8 flex items-center gap-2 px-3 py-1 border border-[#135bec]/30 bg-[#135bec]/10 rounded text-[10px] tracking-[0.2em] text-[#135bec] uppercase shadow-[0_0_10px_rgba(19,91,236,0.2)]">
          <div className="w-1.5 h-1.5 rounded-full bg-[#135bec] animate-pulse" />
          System Lockdown Active
        </div>

        {/* 404 Glitch Text */}
        <h1 className="text-[120px] md:text-[180px] font-black leading-none tracking-tighter text-[#135bec] drop-shadow-[0_0_30px_rgba(19,91,236,0.5)] select-none">
          404
        </h1>

        {/* Unauthorized Headline */}
        <h2 className="mt-8 text-xl md:text-2xl font-bold uppercase tracking-[0.2em] text-white/90">
          Unauthorized Entry Point
        </h2>

        {/* Description */}
        <p className="mt-4 max-w-md text-sm text-white/50 leading-relaxed font-sans">
          Access denied. This path does not exist and has been{" "}
          <span className="text-[#135bec] font-bold underline decoration-dotted underline-offset-4">instantly purged</span>
          {" "}from our encrypted index.
        </p>

        {/* Log Details */}
        <div className="mt-8 text-[10px] text-white/30 tracking-widest uppercase flex flex-wrap justify-center gap-3 font-mono border-t border-b border-white/5 py-3">
          <span>Attempt Logged: 0X82FB92</span>
          <span className="text-[#135bec]">•</span>
          <span>IP Masked</span>
          <span className="text-[#135bec]">•</span>
          <span>Origin Purged</span>
        </div>

        {/* Return Action */}
        <button 
          onClick={() => navigate("/")}
          className="mt-16 group relative px-8 py-3 bg-transparent overflow-hidden"
        >
          <div className="absolute inset-0 w-full h-full border border-white/10 group-hover:border-[#135bec]/50 transition-colors duration-300" />
          <div className="absolute inset-0 w-0 bg-[#135bec]/10 transition-all duration-300 group-hover:w-full" />
          <span className="relative text-xs tracking-[0.3em] uppercase text-white/70 group-hover:text-white transition-colors">
            Return to the Circle
          </span>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/3 h-[1px] bg-[#135bec] group-hover:w-2/3 transition-all duration-300" />
        </button>

      </div>

      {/* Footer */}
      <div className="absolute bottom-8 w-full text-center">
        <p className="text-[9px] text-white/20 tracking-[0.4em] uppercase font-mono">
          Private Chat • Security Protocol 92-Alpha
        </p>
      </div>

    </div>
  );
};

export default NotFound;
