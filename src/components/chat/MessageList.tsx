import { useEffect, useRef } from "react";
import { Message } from "@/types/chat";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  onReact: (messageId: string, emoji: string) => void;
  typingUser?: string;
}

export function MessageList({ messages, currentUserId, onReact, typingUser }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUser]);

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8 custom-scrollbar">
       {/* System Init Header */}
       <div className="flex flex-col items-center gap-2 mb-12 opacity-0 animate-in fade-in duration-1000 delay-300 fill-mode-forwards">
         <div className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em]">
           [ SYSTEM INITIALIZED ]
         </div>
         <div className="px-4 py-1.5 rounded-md bg-[#0b0f1a] border border-white/5 text-[10px] font-mono text-white/50">
           Session expiration: 02:00:00
         </div>
       </div>

      {messages.length === 0 && !typingUser ? (
        <div className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground gap-4">
           <div className="w-16 h-16 rounded-full bg-[#135bec]/5 border border-[#135bec]/20 flex items-center justify-center">
             <div className="w-1.5 h-1.5 bg-[#135bec] rounded-full animate-ping" />
           </div>
           <p className="text-xs font-mono text-white/30 uppercase tracking-widest">Secure Channel Established</p>
        </div>
      ) : (
        messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isSent={message.sender === currentUserId}
            currentUserId={currentUserId}
            onReact={onReact}
          />
        ))
      )}
      
      {typingUser && <TypingIndicator userName={typingUser} />}
      
      <div ref={bottomRef} />
    </div>
  );
}
