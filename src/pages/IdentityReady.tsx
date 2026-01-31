import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, Download, Shield, Lock, Check, AlertTriangle, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function IdentityReady() {
  const navigate = useNavigate();
  const [friendId, setFriendId] = useState("");
  const [isChecked, setIsChecked] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Check if we already have one stored (to persist across reloads of this page)
    const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
    if (authUser.friendCode) {
      setFriendId(authUser.friendCode);
    } else {
      // Fallback if not found (shouldn't happen for new users)
      setFriendId("XXXX-XXXX-XXXX");
    }
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(friendId.replace(/\s/g, ""));
    setCopied(true);
    toast.success("Friend ID copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
    const content = `PRIVATE CHAT RECOVERY KEY\n\nFriend ID: ${friendId}\nUsername: ${authUser.username}\nGenerated: ${new Date().toLocaleString()}\n\nKEEP THIS FILE SAFE. IT IS THE ONLY WAY TO RECOVER YOUR ACCOUNT.`;
    
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `private-chat-recovery-${authUser.username || "key"}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Recovery key downloaded");
  };

  const handleContinue = () => {
    if (!isChecked) {
      toast.error("Please confirm you have stored your credentials");
      return;
    }
    // Clear the temp ID from storage as we're moving on (or keep it if you want it to persist in user profile)
    // For now we just navigate
    navigate("/app/friends");
  };

  return (
    <div className="min-h-screen w-full bg-[#05070a] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans selection:bg-[#135bec]/30">
      
      {/* Top Bar */}
      <div className="absolute top-0 w-full p-6 flex justify-between items-center border-b border-white/5 bg-[#05070a]/80 backdrop-blur-sm z-20">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#135bec] fill-current" />
          <span className="font-bold text-sm tracking-wide">Private Chat</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10">
          <span className="text-[10px] uppercase tracking-widest text-white/40 font-semibold">Onboarding</span>
          <Lock className="w-3 h-3 text-white/40" />
        </div>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* Step Indicator */}
        <div className="mb-6">
          <span className="px-2 py-1 bg-[#135bec] text-white text-[10px] font-bold tracking-widest uppercase rounded">
            Step 2 of 2
          </span>
        </div>

        {/* Headlines */}
        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
          Your Identity is Ready.
        </h1>
        <p className="text-white/60 text-sm md:text-base max-w-lg mb-12 leading-relaxed">
          Confirm your credentials below. This is the <span className="text-white font-semibold">only time</span> this information will be shown. 
          Once you leave this screen, it cannot be retrieved.
        </p>

        {/* ID Card */}
        <div className="bg-[#0b0f1a] border border-white/10 rounded-2xl p-8 mb-8 shadow-2xl relative overflow-hidden group">
          {/* Subtle Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#135bec]/5 blur-[100px] rounded-full pointer-events-none" />

          {/* Friend ID Display */}
          <div className="flex flex-col items-center mb-8">
            <span className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-semibold mb-4">
              Your Unique Friend ID
            </span>
            <div className="flex items-center gap-4 group/id">
              <span className="text-3xl md:text-5xl font-mono font-bold tracking-widest text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                {friendId}
              </span>
              <button 
                onClick={handleCopy}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/40 hover:text-white"
                title="Copy ID"
              >
                {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Recovery Section */}
          <div className="bg-[#05070a]/50 border border-white/5 rounded-xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white/90">Recovery Key Required</h3>
                <p className="text-xs text-white/40 leading-relaxed max-w-xs">
                  If you lose your ID or Key, your account cannot be recovered. Messages auto-delete every 2 hours.
                </p>
              </div>
            </div>
            <button 
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-[#135bec] hover:bg-[#135bec]/90 text-white text-xs font-bold uppercase tracking-wide rounded-lg transition-all shadow-[0_0_20px_rgba(19,91,236,0.3)] hover:shadow-[0_0_30px_rgba(19,91,236,0.5)] whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              Download Recovery
            </button>
          </div>
        </div>

        {/* Checkbox Confirmation */}
        <div className="mb-8 flex items-start gap-3 px-2">
          <div className="relative flex items-center">
            <input 
              type="checkbox" 
              id="confirm"
              checked={isChecked}
              onChange={(e) => setIsChecked(e.target.checked)}
              className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-white/20 bg-black/20 checked:border-[#135bec] checked:bg-[#135bec] transition-all"
            />
            <Check className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" />
          </div>
          <label htmlFor="confirm" className="text-sm text-white/60 cursor-pointer select-none">
            <span className="font-bold text-white">I have safely stored my Friend ID and Recovery Key.</span>
            <br />
            I understand that Private Chat staff cannot reset my password or recover my messages.
          </label>
        </div>

        {/* Action Button */}
        <button 
          onClick={handleContinue}
          className={`w-full py-4 bg-white/10 hover:bg-white/20 text-white font-bold text-sm tracking-[0.2em] uppercase rounded-lg transition-all flex items-center justify-center gap-2 group ${isChecked ? 'opacity-100' : 'opacity-50 cursor-not-allowed'}`}
        >
          Start Chatting
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>

      </div>

      {/* Footer */}
      <div className="absolute bottom-6 flex items-center gap-2 text-white/20">
        <Shield className="w-3 h-3" />
        <span className="text-[10px] tracking-widest uppercase font-medium">End-to-End Encrypted Identity Protocol v2.4</span>
      </div>

    </div>
  );
}
