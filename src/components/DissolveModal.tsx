import { useState, useEffect, useRef } from "react";
import { X, AlertTriangle, ShieldAlert, Terminal, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { deleteAccount } from "@/lib/api";

interface DissolveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DissolveModal({ isOpen, onClose }: DissolveModalProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<"warning" | "input" | "processing" | "done">("warning");
  
  // Step 1: Checkboxes
  const [checks, setChecks] = useState({
    revoke: false,
    messages: false,
    permanent: false
  });

  // Step 2: Input
  const [confirmKey, setConfirmKey] = useState("");
  const [timeLeft, setTimeLeft] = useState(60);

  // Step 3: Progress
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setStep("warning");
      setChecks({ revoke: false, messages: false, permanent: false });
      setConfirmKey("");
      setProgress(0);
      setLogs([]);
      setTimeLeft(60);
    }
  }, [isOpen]);

  // Timer for Step 2
  useEffect(() => {
    if (step === "input" && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [step, timeLeft]);

  // Progress Simulation for Step 3
  useEffect(() => {
    if (step === "processing") {
      const logMessages = [
        "Initializing deletion sequence...",
        "Connecting to decentralized ledger...",
        "Revoking identity key 0x7F...9A...",
        "Purging message history from 14 nodes...",
        "Scrubbing local metadata...",
        "Deleting cryptographic signatures...",
        "Overwriting storage sectors...",
        "Finalizing dissolution...",
        "Identity verification failed (Expected).",
        "System disconnected."
      ];

      let currentLogIndex = 0;
      const interval = setInterval(() => {
        if (currentLogIndex < logMessages.length) {
          setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${logMessages[currentLogIndex]}`]);
          currentLogIndex++;
        }
        
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setStep("done"), 1000);
            return 100;
          }
          return prev + (100 / logMessages.length); // Rough increment
        });
      }, 800);

      return () => clearInterval(interval);
    }
  }, [step]);

  // Scroll logs to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  if (!isOpen) return null;

  const handleCheckbox = (key: keyof typeof checks) => {
    setChecks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleWarningSubmit = () => {
    if (Object.values(checks).every(Boolean)) {
      setStep("input");
    }
  };

  const handleInputSubmit = () => {
    if (confirmKey === "AccessKeyDISSOLVE") {
      setStep("processing");
    } else {
      toast.error("Invalid Confirmation Key");
    }
  };

  const handleFinalize = async () => {
    try {
      const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
      if (authUser.id) {
        await deleteAccount(authUser.id);
      }
    } catch (error) {
      console.error("Dissolve error:", error);
    }
    localStorage.clear();
    navigate("/login");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-2xl bg-[#05070a] border border-white/10 rounded-2xl overflow-hidden relative shadow-2xl">
        
        {/* Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
        
        {/* Top Bar */}
        <div className="relative border-b border-white/10 p-4 flex items-center justify-between bg-[#0b0f1a]/50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-mono uppercase text-white/40 tracking-widest">
              Private Chat // Auth_KP // System.Dissolution
            </span>
          </div>
          {step !== "processing" && step !== "done" && (
            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="relative p-8 md:p-12 min-h-[500px] flex flex-col justify-center">
          
          {/* Step 1: Warning */}
          {step === "warning" && (
            <div className="animate-in slide-in-from-bottom-4 duration-500">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">TERMINATING IDENTITY</h2>
                <p className="text-red-500 text-xs font-mono uppercase tracking-widest">
                  Step 01: Final Impact Assessment
                </p>
              </div>

              <div className="space-y-4 max-w-md mx-auto mb-10">
                <label className="flex items-start gap-4 p-4 border border-white/5 rounded-xl bg-white/5 cursor-pointer hover:bg-white/10 transition-colors group">
                  <div className={`mt-1 w-5 h-5 rounded border flex items-center justify-center transition-all ${checks.revoke ? "bg-red-500 border-red-500" : "border-white/20 group-hover:border-white/40"}`}>
                    {checks.revoke && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <input type="checkbox" className="hidden" checked={checks.revoke} onChange={() => handleCheckbox("revoke")} />
                  <div>
                    <div className="text-white text-sm font-bold mb-1">Revoke ID</div>
                    <div className="text-white/40 text-xs leading-relaxed">
                      Your <span className="text-red-500">12-digit ID</span> will be permanently revoked from the decentralized ledger.
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-4 p-4 border border-white/5 rounded-xl bg-white/5 cursor-pointer hover:bg-white/10 transition-colors group">
                  <div className={`mt-1 w-5 h-5 rounded border flex items-center justify-center transition-all ${checks.messages ? "bg-red-500 border-red-500" : "border-white/20 group-hover:border-white/40"}`}>
                     {checks.messages && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <input type="checkbox" className="hidden" checked={checks.messages} onChange={() => handleCheckbox("messages")} />
                  <div>
                    <div className="text-white text-sm font-bold mb-1">Purge Messages</div>
                    <div className="text-white/40 text-xs leading-relaxed">
                      All active messages in your friends' circles will be <span className="text-red-500">instantly purged</span> across all nodes.
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-4 p-4 border border-white/5 rounded-xl bg-white/5 cursor-pointer hover:bg-white/10 transition-colors group">
                  <div className={`mt-1 w-5 h-5 rounded border flex items-center justify-center transition-all ${checks.permanent ? "bg-red-500 border-red-500" : "border-white/20 group-hover:border-white/40"}`}>
                     {checks.permanent && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <input type="checkbox" className="hidden" checked={checks.permanent} onChange={() => handleCheckbox("permanent")} />
                  <div>
                    <div className="text-white text-sm font-bold mb-1">Permanent Action</div>
                    <div className="text-white/40 text-xs leading-relaxed">
                      THIS ACTION IS IRREVERSIBLE. TOTAL DATA DISSOLUTION IS PERMANENT.
                    </div>
                  </div>
                </label>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={handleWarningSubmit}
                  disabled={!Object.values(checks).every(Boolean)}
                  className={`px-8 py-4 rounded-lg text-xs font-bold uppercase tracking-[0.2em] transition-all ${
                    Object.values(checks).every(Boolean)
                      ? "bg-red-500 text-white hover:bg-red-600 shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                      : "bg-white/5 text-white/20 cursor-not-allowed"
                  }`}
                >
                  I Accept Total Dissolution
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Input */}
          {step === "input" && (
            <div className="animate-in slide-in-from-right-8 duration-500 text-center">
               <div className="mb-10">
                <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Identity Termination</h2>
                <p className="text-white/40 text-sm max-w-md mx-auto">
                  To confirm the dissolution of your digital identity, enter your <span className="text-red-500">Access Key</span> followed by the command DISSOLVE.
                </p>
              </div>

              <div className="max-w-sm mx-auto mb-10">
                <div className="flex justify-between text-[10px] text-red-500 font-mono uppercase mb-2">
                  <span>Verification Sequence</span>
                  <span>{timeLeft}s Remaining</span>
                </div>
                <input
                  type="text"
                  value={confirmKey}
                  onChange={(e) => setConfirmKey(e.target.value)}
                  placeholder="AccessKeyDISSOLVE"
                  className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white font-mono text-center focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all placeholder:text-white/10"
                />
              </div>

              <div className="relative w-24 h-24 mx-auto mb-10 flex items-center justify-center">
                 <svg className="w-full h-full -rotate-90">
                    <circle cx="48" cy="48" r="44" fill="none" stroke="#1a1a1a" strokeWidth="4" />
                    <circle 
                      cx="48" cy="48" r="44" fill="none" stroke="#ef4444" strokeWidth="4" 
                      strokeDasharray={276}
                      strokeDashoffset={276 - (276 * timeLeft) / 60}
                      className="transition-all duration-1000 ease-linear"
                    />
                 </svg>
                 <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-white">{timeLeft}</span>
                    <span className="text-[8px] uppercase text-white/40">Seconds</span>
                 </div>
              </div>

              <button
                onClick={handleInputSubmit}
                className="w-full max-w-sm mx-auto bg-red-500 hover:bg-red-600 text-white py-4 rounded-lg text-xs font-bold uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(239,68,68,0.3)] flex items-center justify-center gap-2 transition-all"
              >
                <ShieldAlert className="w-4 h-4" />
                Execute / Identity Purge
              </button>
              
              <button 
                onClick={onClose}
                className="mt-6 text-[10px] text-white/30 hover:text-white uppercase tracking-widest transition-colors"
              >
                Cancel and Return to Safety
              </button>
            </div>
          )}

          {/* Step 3: Processing */}
          {step === "processing" && (
            <div className="animate-in fade-in duration-500 w-full max-w-lg mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-white mb-1 uppercase tracking-[0.2em]">Identity Termination</h2>
                <div className="text-[10px] text-red-500 font-mono animate-pulse">
                  Purge in Progress — Do not close this window
                </div>
              </div>

              <div className="font-mono text-4xl md:text-5xl text-red-500 text-center mb-12 tracking-wider font-bold drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                8X2F-991Q-K7L2
              </div>

              <div className="mb-8">
                <div className="flex justify-between text-[10px] text-white/40 font-mono uppercase mb-2">
                  <span>System Dissolution</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-red-500 transition-all duration-300 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                   <span className="text-[10px] text-red-500 font-mono">
                     {logs[logs.length - 1] || "Initializing..."}
                   </span>
                </div>
              </div>

              <div className="bg-black/50 border border-white/10 rounded-lg p-4 h-32 overflow-y-auto font-mono text-[10px] space-y-1">
                {logs.map((log, i) => (
                  <div key={i} className="text-white/40 border-l-2 border-red-500/20 pl-2">
                    <span className="text-red-500 mr-2">root@system:~$</span>
                    {log}
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            </div>
          )}

          {/* Step 4: Done */}
          {step === "done" && (
            <div className="animate-in zoom-in-95 duration-1000 text-center flex flex-col items-center justify-center h-full">
              <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-8 relative">
                 <div className="absolute inset-0 border border-white/10 rounded-full animate-[ping_3s_linear_infinite]" />
                 <Terminal className="w-8 h-8 text-white/20" />
              </div>
              
              <h2 className="text-white text-lg font-light mb-8 max-w-xs leading-relaxed">
                The identity has been purged.<br/>
                No traces remain in the circle.
              </h2>

              <button 
                onClick={handleFinalize}
                className="text-red-500 text-xs font-bold uppercase tracking-[0.2em] hover:text-white transition-colors"
              >
                Session End in 3... 2...
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
