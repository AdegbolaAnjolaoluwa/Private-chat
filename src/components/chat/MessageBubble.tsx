import { Message } from "@/types/chat";
import { CountdownTimer } from "./CountdownTimer";
import { getRemainingTime } from "@/utils/time";
import { cn } from "@/lib/utils";
import { ReactionPicker } from "./ReactionPicker";
import { ReactionDisplay } from "./ReactionDisplay";
import { Check, CheckCheck, Clock } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface MessageBubbleProps {
  message: Message;
  isSent: boolean;
  currentUserId: string;
  onReact: (messageId: string, emoji: string) => void;
}

export function MessageBubble({ message, isSent, currentUserId, onReact }: MessageBubbleProps) {
  const { isExpired } = getRemainingTime(message.expiresAt);
  const userReaction = message.reactions?.find((r) => r.userId === currentUserId)?.emoji;

  return (
    <div className={cn("flex mb-6 animate-in fade-in slide-in-from-bottom-2 duration-200 group w-full px-2 relative", isSent ? "justify-end" : "justify-start")}>
      
      {/* Decorative Line for Friend Messages */}
      {!isSent && (
        <div className="absolute left-0 top-6 bottom-6 w-[1px] bg-gradient-to-b from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      )}

      <div className={cn("flex gap-3 max-w-[85%] md:max-w-[70%]", isSent ? "flex-row-reverse" : "flex-row")}>
        
        {/* Avatar */}
        <div className="flex-shrink-0 mt-6">
           <Avatar className="w-8 h-8 border border-white/10 shadow-[0_0_10px_rgba(0,0,0,0.5)]">
             <AvatarFallback className={cn("text-[10px] font-bold tracking-tighter", isSent ? "bg-[#05070a] border border-[#135bec]/50 text-[#135bec]" : "bg-[#0b0f1a] text-white/40")}>
               {isSent ? "ME" : "FR"}
             </AvatarFallback>
           </Avatar>
        </div>

        <div className="flex flex-col gap-1 min-w-0">
          {/* Label */}
          <div className={cn("flex items-center gap-2", isSent ? "justify-end" : "justify-start")}>
            <span className={cn("text-[9px] font-mono font-bold uppercase tracking-[0.2em] mb-1", isSent ? "text-[#135bec]" : "text-white/30")}>
              {isSent ? "> YOU" : "FRIEND_NODE"}
            </span>
          </div>

          {/* Bubble */}
          <div
            className={cn(
              "relative px-5 py-4 shadow-lg transition-all duration-300 border backdrop-blur-sm group-hover:shadow-[0_0_15px_rgba(19,91,236,0.05)]",
              isSent 
                ? "bg-[#135bec]/10 border-[#135bec]/30 text-white rounded-2xl rounded-tr-sm hover:bg-[#135bec]/15" 
                : "bg-[#0b0f1a]/80 border-white/10 text-white/80 rounded-2xl rounded-tl-sm hover:border-white/20 hover:bg-[#0f1422]",
              isExpired && "opacity-30 grayscale blur-[1px]"
            )}
          >
            {/* Corner Accent */}
            <div className={cn("absolute w-2 h-2 border-t border-l border-white/10", isSent ? "top-0 right-0 border-[#135bec]/50" : "top-0 left-0")} />

            <div className="text-sm leading-relaxed whitespace-pre-wrap break-words font-sans tracking-wide">
              {message.body}
            </div>

            {/* Footer / Meta */}
            <div className={cn("flex items-center gap-3 mt-3", isSent ? "justify-end" : "justify-end")}>
              {/* Timer */}
              <div className={cn("flex items-center gap-1.5 text-[9px] font-mono opacity-60", isSent ? "text-[#135bec]" : "text-white/40")}>
                 <CountdownTimer expiresAt={message.expiresAt} />
              </div>

              {/* Status Icons for Sent messages */}
              {isSent && (
                <div className="text-[#135bec]">
                  {message.pending ? (
                    <Clock className="w-3 h-3 animate-pulse" />
                  ) : message.readBy && message.readBy.length > 0 ? (
                    <CheckCheck className="w-3.5 h-3.5" />
                  ) : (
                    <Check className="w-3.5 h-3.5 opacity-50" />
                  )}
                </div>
              )}
            </div>
             
             {/* Reactions */}
             {message.reactions && message.reactions.length > 0 && (
               <div className="absolute -bottom-3 right-4 z-10">
                  <ReactionDisplay
                    reactions={message.reactions || []}
                    onToggleReaction={(emoji) => onReact(message.id, emoji)}
                    currentUserId={currentUserId}
                  />
               </div>
             )}
          </div>
          
          {/* Reaction Picker Trigger (visible on hover) */}
          <div className={cn("flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 -mt-1 h-6", isSent ? "justify-end" : "justify-start")}>
             <ReactionPicker onReact={(emoji) => onReact(message.id, emoji)} userReaction={userReaction} />
          </div>

        </div>
      </div>
    </div>
  );
}
