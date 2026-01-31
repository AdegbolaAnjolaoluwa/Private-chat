import { Friend } from "@/types/chat";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MoreVertical, ShieldCheck } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ChatLayoutProps {
  friend: Friend;
  messages: any[];
  currentUserId: string;
  onSendMessage: (message: string) => void;
  onReact: (messageId: string, emoji: string) => void;
  onTyping: () => void;
  onStopTyping: () => void;
  typingUser?: string;
  onBack?: () => void;
}

export function ChatLayout({
  friend,
  messages,
  currentUserId,
  onSendMessage,
  onReact,
  onTyping,
  onStopTyping,
  typingUser,
  onBack,
}: ChatLayoutProps) {
  return (
    <div className="flex flex-col h-full bg-[#05070a] text-white overflow-hidden font-mono">
      {/* Chat Header */}
      <div className="border-b border-white/5 bg-[#05070a] px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden text-white/60 hover:text-white hover:bg-white/5">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          
          <div className="relative">
            <Avatar className="w-10 h-10 border border-white/10">
              <AvatarFallback className="bg-[#0b0f1a] text-white/80 text-sm font-bold">
                {friend.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#135bec] rounded-full border-2 border-[#05070a] shadow-[0_0_8px_#135bec]" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-lg tracking-wide text-white">@{friend.username}</h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#135bec] animate-pulse" />
              <p className="text-[10px] font-bold text-[#135bec] uppercase tracking-widest">
                {typingUser ? "TRANSMITTING..." : "PULSE ONLINE"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#135bec]/10 border border-[#135bec]/20">
            <ShieldCheck className="w-3.5 h-3.5 text-[#135bec]" />
            <span className="text-[10px] font-bold text-[#135bec] uppercase tracking-wider">Invite Only Session</span>
          </div>
          
          <Button variant="ghost" size="icon" className="text-white/40 hover:text-white hover:bg-white/5">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <MessageList messages={messages} currentUserId={currentUserId} onReact={onReact} typingUser={typingUser} />

      {/* Input */}
      <MessageInput onSend={onSendMessage} onTyping={onTyping} onStopTyping={onStopTyping} />
    </div>
  );
}
