import { ShieldCheck, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setIsFading(true);
          setTimeout(onComplete, 1000); // Wait for fade out animation
          return 100;
        }
        return prev + 2; // Adjust speed here
      });
    }, 30); // ~1.5s to complete

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 bg-black flex flex-col items-center justify-center text-white overflow-hidden transition-opacity duration-1000 ease-in-out ${
        isFading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Top Left Icon */}
      <div className="absolute top-8 left-8 text-white/20">
        <ShieldCheck className="w-8 h-8" />
      </div>

      {/* Center Animation */}
      <div className="relative flex flex-col items-center justify-center w-full max-w-md">
        {/* Ripple/Pulse Effect */}
        <div className="relative flex items-center justify-center mb-12">
          {/* Core Dot */}
          <div className="w-4 h-4 bg-[#135bec] rounded-full z-10 shadow-[0_0_20px_#135bec]" />
          
          {/* Ripples */}
          <div className="absolute w-12 h-12 border border-[#135bec]/30 rounded-full animate-[ping_3s_ease-out_infinite] opacity-50" />
          <div className="absolute w-24 h-24 border border-[#135bec]/20 rounded-full animate-[ping_3s_ease-out_infinite_0.5s] opacity-30" />
          <div className="absolute w-40 h-40 border border-[#135bec]/10 rounded-full animate-[ping_3s_ease-out_infinite_1s] opacity-10" />
        </div>

        {/* Progress Bar */}
        <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden mb-8">
          <div 
            className="h-full bg-[#135bec] transition-all duration-100 ease-out shadow-[0_0_10px_#135bec]"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Text */}
        <div className="text-center space-y-2">
          <h2 className="text-sm font-bold tracking-[0.2em] text-white/90 uppercase">
            Securing the Circle...
          </h2>
          <p className="text-[10px] text-white/40 tracking-widest uppercase">
            Messages are temporary.
          </p>
        </div>
      </div>

      {/* Bottom Right Icon */}
      <div className="absolute bottom-8 right-8 text-white/20">
        <EyeOff className="w-6 h-6" />
      </div>
    </div>
  );
}
