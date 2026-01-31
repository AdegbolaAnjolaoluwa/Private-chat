import { useNavigate } from "react-router-dom";
import { Shield, Clock, CircleDashed, Key, Lock } from "lucide-react";
import { useEffect, useState } from "react";

export default function Manifesto() {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Force visibility after a short delay to ensure mount
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleContinue = () => {
    navigate("/identity-ready");
  };

  return (
    <div className="min-h-screen w-full bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden z-10">
      {/* Background Subtle Noise/Texture could go here */}
      
      {/* Content Container */}
      <div 
        className={`max-w-4xl w-full flex flex-col items-center text-center transition-all duration-1000 transform ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
      >
        
        {/* Top Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="p-3 rounded-full bg-white/5 border border-white/10">
            <Shield className="w-6 h-6 text-[#135bec] fill-current" />
          </div>
          <span className="text-[10px] tracking-[0.3em] font-medium text-white/40 uppercase">
            Private Chat
          </span>
        </div>

        {/* Main Headline */}
        <div className="space-y-2 mb-8">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter italic">
            NO PERMANENCE.
          </h1>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter italic text-white/10">
            NO AUDIENCE.
          </h1>
        </div>

        {/* Description */}
        <p className="max-w-xl text-white/60 text-lg leading-relaxed mb-16">
          This is not a social network. This is a sanctuary for your closest connections. 
          Before entering, you must accept the laws of this space.
        </p>

        {/* Three Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 w-full mb-16">
          {/* Col 1 */}
          <div className={`flex flex-col items-center gap-4 transition-all duration-700 delay-300 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <span className="text-[#135bec] text-xs font-bold tracking-widest mb-2">01</span>
            <Clock className="w-8 h-8 text-white mb-2" />
            <h3 className="text-lg font-bold uppercase tracking-wide">2-Hour Lifespan</h3>
            <p className="text-sm text-white/40 max-w-[200px]">
              Every message, photo, and thought automatically dies exactly 2 hours after being sent.
            </p>
          </div>

          {/* Col 2 */}
          <div className={`flex flex-col items-center gap-4 transition-all duration-700 delay-500 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <span className="text-[#135bec] text-xs font-bold tracking-widest mb-2">02</span>
            <CircleDashed className="w-8 h-8 text-white mb-2" />
            <h3 className="text-lg font-bold uppercase tracking-wide">Zero Residue</h3>
            <p className="text-sm text-white/40 max-w-[200px]">
              No history is kept. No archives exist. Once it's gone, it's gone from our servers forever.
            </p>
          </div>

          {/* Col 3 */}
          <div className={`flex flex-col items-center gap-4 transition-all duration-700 delay-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <span className="text-[#135bec] text-xs font-bold tracking-widest mb-2">03</span>
            <Key className="w-8 h-8 text-white mb-2" />
            <h3 className="text-lg font-bold uppercase tracking-wide">Invite Only</h3>
            <p className="text-sm text-white/40 max-w-[200px]">
              No public search. No discovery. Access is granted only via direct, unique identifiers.
            </p>
          </div>
        </div>

        {/* Footer Action */}
        <div className={`space-y-6 transition-all duration-700 delay-1000 ${isVisible ? "opacity-100" : "opacity-0"}`}>
          <p className="text-[10px] tracking-widest uppercase text-white/30 font-semibold">
            Acknowledge the nature of the platform
          </p>
          
          <button 
            onClick={handleContinue}
            className="px-12 py-4 bg-white text-black font-bold text-sm tracking-widest rounded-full hover:bg-white/90 hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          >
            I UNDERSTAND
          </button>

          <div className="flex items-center justify-center gap-2 text-white/20 pt-8">
            <Lock className="w-3 h-3" />
            <span className="text-[10px] tracking-widest uppercase">End-to-end encrypted sanctuary</span>
          </div>
        </div>

      </div>
    </div>
  );
}
