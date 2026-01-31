import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Shield, 
  User, 
  Eye, 
  Trash2, 
  Terminal, 
  Lock, 
  RefreshCw, 
  Bell, 
  Volume2, 
  Copy, 
  Monitor, 
  HardDrive,
  LogOut,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import DissolveModal from "@/components/DissolveModal";
import { wipeAllMessages } from "@/lib/api";

export default function Settings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("identity");
  const [friendCode, setFriendCode] = useState("XXXX-XXXX-XXXX");
  const [notifications, setNotifications] = useState(true);
  const [sound, setSound] = useState(false);
  const [autoLock, setAutoLock] = useState("5 Minutes");
  const [isDissolveModalOpen, setIsDissolveModalOpen] = useState(false);

  useEffect(() => {
    const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
    if (authUser.friendCode) {
      setFriendCode(authUser.friendCode);
    }
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(friendCode);
    toast.success("Identity copied to clipboard");
  };

  const handleRegenerate = () => {
    toast.error("Identity regeneration requires Master Key (Not available in demo)");
  };

  const handleDissolve = () => {
    setIsDissolveModalOpen(true);
  };

  const handlePurgeSession = () => {
    localStorage.clear();
    navigate("/login");
    toast.success("Session terminated securely");
  };

  const handleWipeChats = async () => {
    try {
      const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
      if (authUser.id) {
        await wipeAllMessages(authUser.id);
        toast.success("All active message threads have been dissolved");
      }
    } catch (error) {
      toast.error("Failed to wipe messages");
    }
  };

  const SidebarItem = ({ id, icon: Icon, label }: { id: string; icon: React.ElementType; label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 rounded-lg mb-1 ${
        activeTab === id 
          ? "bg-[#135bec] text-white shadow-[0_0_15px_rgba(19,91,236,0.3)]" 
          : "text-white/40 hover:text-white hover:bg-white/5"
      }`}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="flex h-full bg-[#05070a] text-white overflow-hidden">
      {/* Settings Sidebar */}
      <div className="w-64 flex-shrink-0 border-r border-white/5 bg-[#0b0f1a]/50 p-6 flex flex-col">
        <div className="mb-8">
          <h2 className="text-white font-bold text-lg mb-1">Security Console</h2>
          <div className="flex items-center gap-2 text-[10px] text-white/30 font-mono uppercase tracking-wider">
            <span>V4.02-STABLE</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span>ENCRYPTED</span>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          <SidebarItem id="identity" icon={User} label="My Identity" />
          <SidebarItem id="privacy" icon={Shield} label="Privacy Control" />
          <SidebarItem id="appearance" icon={Monitor} label="System Appearance" />
          <SidebarItem id="sanitization" icon={HardDrive} label="Data Sanitization" />
        </nav>

        <div className="mt-auto pt-6 border-t border-white/5">
          <div className="bg-[#135bec]/5 border border-[#135bec]/20 rounded-lg p-3 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#135bec] animate-pulse shadow-[0_0_10px_#135bec]" />
            <div>
              <div className="text-[10px] font-bold text-[#135bec] tracking-widest uppercase mb-0.5">
                Network Secure
              </div>
              <div className="text-[9px] text-white/30 leading-tight">
                End-to-end ephemeral tunnel active. Nodes: 14
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 md:p-12">
        <div className="max-w-4xl mx-auto w-full">
          {activeTab === "identity" ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Header */}
            <div className="mb-12">
              <h1 className="text-3xl font-bold mb-2">System Identity</h1>
              <p className="text-white/40 text-sm">
                Manage your unique identifier and core security protocols.
              </p>
            </div>

            {/* Identity Card */}
            <div className="bg-[#0b0f1a] border border-white/10 rounded-2xl p-8 mb-8 relative overflow-hidden">
              {/* Background Effects */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-[#135bec]/5 blur-[100px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2" />
              
              <div className="flex flex-col items-center justify-center text-center relative z-10">
                {/* Lock Icon Circle */}
                <div className="w-20 h-20 rounded-full bg-[#05070a] border border-white/10 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(19,91,236,0.1)] group">
                  <Lock className="w-8 h-8 text-[#135bec] group-hover:scale-110 transition-transform duration-500" />
                </div>

                <div className="mb-8">
                  <div className="inline-block px-2 py-1 bg-[#135bec]/10 rounded border border-[#135bec]/20 text-[10px] font-bold text-[#135bec] tracking-widest uppercase mb-4">
                    Identity Matrix V2.1
                  </div>
                  <div className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-2">
                    Your Unique Friend ID
                  </div>
                  <div className="text-4xl md:text-5xl font-bold text-[#135bec] font-mono tracking-tight drop-shadow-[0_0_15px_rgba(19,91,236,0.3)]">
                    {friendCode}
                  </div>
                </div>

                <p className="text-white/40 text-xs max-w-md mb-8 leading-relaxed">
                  Invite-only access requires this identifier. It changes automatically every 30 days unless pinned. Keep it secure.
                </p>

                <div className="flex items-center gap-4 w-full max-w-md">
                  <button 
                    onClick={handleCopy}
                    className="flex-1 bg-[#135bec] hover:bg-[#135bec]/90 text-white py-3 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(19,91,236,0.2)]"
                  >
                    <Copy className="w-4 h-4" />
                    Copy ID
                  </button>
                  <button 
                    onClick={handleRegenerate}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 py-3 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Regenerate
                  </button>
                </div>
              </div>
            </div>

            {/* Privacy Control Section */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="w-5 h-5 text-[#135bec]" />
                <h3 className="text-lg font-bold">Privacy Control</h3>
              </div>

              <div className="space-y-4">
                {/* Setting Item */}
                <div className="bg-[#0b0f1a] border border-white/5 rounded-xl p-5 flex items-center justify-between group hover:border-white/10 transition-colors">
                  <div>
                    <div className="font-bold text-sm text-white mb-1">Sneak Peek Notifications</div>
                    <div className="text-xs text-white/40">Blurs message content and sender name in system notifications.</div>
                  </div>
                  <button 
                    onClick={() => setNotifications(!notifications)}
                    className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${notifications ? "bg-[#135bec]" : "bg-white/10"}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 shadow-md ${notifications ? "left-7" : "left-1"}`} />
                  </button>
                </div>

                {/* Setting Item */}
                <div className="bg-[#0b0f1a] border border-white/5 rounded-xl p-5 flex items-center justify-between group hover:border-white/10 transition-colors">
                  <div>
                    <div className="font-bold text-sm text-white mb-1">Idle Auto-Lock</div>
                    <div className="text-xs text-white/40">Forces authentication after periods of inactivity.</div>
                  </div>
                  <div className="relative">
                    <select 
                      value={autoLock}
                      onChange={(e) => setAutoLock(e.target.value)}
                      className="appearance-none bg-[#05070a] border border-white/10 rounded-lg px-4 py-2 text-xs font-bold text-white/70 focus:outline-none focus:border-[#135bec]/50 min-w-[120px]"
                    >
                      <option>1 Minute</option>
                      <option>5 Minutes</option>
                      <option>15 Minutes</option>
                      <option>Never</option>
                    </select>
                  </div>
                </div>

                {/* Setting Item */}
                <div className="bg-[#0b0f1a] border border-white/5 rounded-xl p-5 flex items-center justify-between group hover:border-white/10 transition-colors">
                  <div>
                    <div className="font-bold text-sm text-white mb-1">Ephemeral Sounds</div>
                    <div className="text-xs text-white/40">UI audio cues when messages are about to vanish.</div>
                  </div>
                  <button 
                    onClick={() => setSound(!sound)}
                    className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${sound ? "bg-[#135bec]" : "bg-white/10"}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 shadow-md ${sound ? "left-7" : "left-1"}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Terminal Actions */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <Terminal className="w-5 h-5 text-red-500" />
                <h3 className="text-lg font-bold">Terminal Actions</h3>
              </div>

              <div className="border border-dashed border-red-500/20 bg-red-500/5 rounded-xl p-8 text-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5 mix-blend-overlay" />
                
                <h4 className="text-red-400 font-bold mb-3">Dissolve Identity</h4>
                <p className="text-red-400/60 text-xs max-w-lg mx-auto mb-8 leading-relaxed">
                  This is an irreversible operation. It will instantly wipe all active message threads, media attachments, and your current identity fingerprint across the decentralized network.
                </p>

                <button 
                  onClick={handleDissolve}
                  className="px-8 py-3 border border-red-500/30 hover:border-red-500 text-red-500 hover:bg-red-500/10 rounded-lg text-xs font-bold uppercase tracking-[0.2em] transition-all"
                >
                  <span className="mr-2">×</span> Delete Account
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center pb-8">
              <p className="text-[10px] text-white/20 uppercase tracking-[0.5em] font-mono">
                Shadow Protocol Active • No Logs Retained
              </p>
            </div>
          </div>
        ) : activeTab === "sanitization" ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="mb-12">
              <div className="text-[10px] font-bold text-[#135bec] uppercase tracking-widest mb-2">System Security</div>
              <h1 className="text-4xl font-bold mb-4 tracking-tight">Data Sanitization</h1>
              <p className="text-white/60 text-sm max-w-xl leading-relaxed">
                Manage destructive actions and local data persistence. These operations are irreversible and designed for absolute privacy.
              </p>
            </div>

            {/* Actions Grid */}
            <div className="space-y-6">
              
              {/* Purge Session */}
              <div className="bg-[#0b0f1a] border border-white/10 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:border-white/20 transition-all">
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Purge Current Session</h3>
                  <p className="text-white/40 text-xs max-w-md leading-relaxed">
                    Instantly log out and clear all local cache, including temporary session keys and unsaved draft state. <span className="text-[#135bec]">Local storage will be overwritten with zero-bytes.</span>
                  </p>
                </div>
                <button 
                  onClick={handlePurgeSession}
                  className="px-6 py-3 bg-[#135bec] hover:bg-[#135bec]/90 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest min-w-[160px] shadow-[0_0_20px_rgba(19,91,236,0.2)] transition-all"
                >
                  Terminate Session
                </button>
              </div>

              {/* Message Wipe */}
              <div className="bg-[#0b0f1a] border border-white/10 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:border-white/20 transition-all">
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Instant Message Wipe</h3>
                  <p className="text-white/40 text-xs max-w-md leading-relaxed">
                    Immediately dissolve all active 1-on-1 messages across all chats before the standard 2-hour auto-destruct timer expires. <span className="text-[#135bec]">Bypasses verification protocols for immediate erasure.</span>
                  </p>
                </div>
                <button 
                  onClick={handleWipeChats}
                  className="px-6 py-3 bg-[#135bec] hover:bg-[#135bec]/90 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest min-w-[160px] shadow-[0_0_20px_rgba(19,91,236,0.2)] transition-all"
                >
                  Wipe All Chats
                </button>
              </div>

              {/* Dissolve Identity */}
              <div className="relative rounded-2xl border border-white/10 overflow-hidden bg-black mt-12 group">
                {/* Background Visual */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%)] opacity-50" />
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay" />
                
                {/* Content */}
                <div className="relative p-8 md:p-12 flex flex-col md:flex-row gap-12 items-center">
                  
                  {/* Visual Placeholder for "Dissolving" */}
                  <div className="w-48 h-48 flex-shrink-0 relative">
                    <div className="absolute inset-0 bg-red-500/10 blur-3xl rounded-full animate-pulse" />
                    <div className="w-full h-full bg-gradient-to-tr from-transparent via-red-500/10 to-transparent rounded-full border border-red-500/20 flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(239,68,68,0.2),transparent)]" />
                      <AlertTriangle className="w-16 h-16 text-red-500/50 relative z-10" />
                      {/* Particles Effect Simulation */}
                      <div className="absolute inset-0 animate-[spin_10s_linear_infinite] opacity-30">
                         <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-red-500 rounded-full shadow-[0_0_10px_red]" />
                         <div className="absolute bottom-1/3 right-1/4 w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_10px_red]" />
                         <div className="absolute top-1/2 right-1/3 w-1 h-1 bg-red-500 rounded-full" />
                      </div>
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      <h3 className="text-2xl font-bold text-white">Dissolve Identity</h3>
                    </div>
                    
                    <p className="text-white/60 text-sm leading-relaxed mb-6">
                      The ultimate sanitization procedure. This leads to the permanent system wipe screen for account deletion and global metadata scrubbing.
                    </p>
                    
                    <div className="mb-8">
                      <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider leading-relaxed">
                        CRITICAL WARNING: THIS ACTION IS FINAL AND NON-RECOVERABLE. ALL CRYPTOGRAPHIC IDENTITIES, PRIVATE KEYS, AND CONTACT LINKS WILL BE PERMANENTLY DESTROYED.
                      </p>
                    </div>

                    <button 
                      onClick={handleDissolve}
                      className="px-8 py-4 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-bold uppercase tracking-[0.15em] shadow-[0_0_30px_rgba(239,68,68,0.3)] w-full md:w-auto transition-all"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>

                {/* Bottom Border Gradient */}
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
              </div>

            </div>

            {/* Footer Status */}
            <div className="mt-12 text-center">
              <p className="text-[10px] text-white/20 uppercase tracking-[0.3em] font-mono">
                System Status: All Encryption Layers Active // Protocol 0x00_SANITIZE
              </p>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
              <Lock className="w-6 h-6 text-white/20" />
            </div>
            <h2 className="text-xl font-bold mb-2">Restricted Access</h2>
            <p className="text-white/40 text-sm max-w-xs">
              This module is locked in the current security clearance level.
            </p>
          </div>
        )}
        </div>
      </div>
      
      <DissolveModal 
        isOpen={isDissolveModalOpen} 
        onClose={() => setIsDissolveModalOpen(false)} 
      />
    </div>
  );
}
