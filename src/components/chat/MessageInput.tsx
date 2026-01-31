import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip, Smile } from "lucide-react";

interface MessageInputProps {
  onSend: (message: string) => void;
  onTyping?: () => void;
  onStopTyping?: () => void;
}

export function MessageInput({ onSend, onTyping, onStopTyping }: MessageInputProps) {
  const [message, setMessage] = useState("");
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    // Emit typing event
    if (onTyping) {
      onTyping();
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing after 2 seconds
    typingTimeoutRef.current = setTimeout(() => {
      if (onStopTyping) {
        onStopTyping();
      }
    }, 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSend(message.trim());
      setMessage("");
      
      // Stop typing when message is sent
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (onStopTyping) {
        onStopTyping();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="border-t border-white/5 bg-[#05070a] p-6 pb-2 shrink-0 z-10">
      <div className="flex gap-4 items-end max-w-5xl mx-auto">
        
        {/* Active Status Indicator */}
        <div className="hidden md:flex items-center gap-2 mb-4 shrink-0">
          <div className="w-2 h-2 rounded-full bg-[#135bec] shadow-[0_0_8px_#135bec]" />
          <span className="text-[10px] font-bold text-[#135bec]/80 uppercase tracking-widest">Active</span>
        </div>

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="flex-1 relative group">
          <div className="relative flex items-center bg-[#0b0f1a] rounded-2xl border border-white/10 focus-within:border-[#135bec]/50 focus-within:ring-1 focus-within:ring-[#135bec]/20 transition-all duration-300">
            <Textarea
              value={message}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message... (2h limit)"
              className="resize-none min-h-[56px] max-h-[120px] bg-transparent border-0 focus-visible:ring-0 text-white placeholder:text-white/20 py-4 pl-4 pr-24"
              rows={1}
            />
            
            {/* Input Actions */}
            <div className="absolute right-3 flex items-center gap-2">
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-white/30 hover:text-white hover:bg-white/5 rounded-full">
                <Paperclip className="w-4 h-4" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-white/30 hover:text-white hover:bg-white/5 rounded-full">
                <Smile className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </form>

        {/* Send Button */}
        <Button 
          onClick={(e) => handleSubmit(e as any)}
          size="icon" 
          className="h-14 w-14 shrink-0 rounded-xl bg-[#135bec] hover:bg-[#135bec]/90 shadow-[0_0_20px_rgba(19,91,236,0.3)] border border-[#135bec]/50 transition-all duration-300 hover:scale-105" 
          disabled={!message.trim()}
        >
          <Send className="w-6 h-6 text-white" />
        </Button>
      </div>

      {/* Footer Text */}
      <div className="flex justify-center mt-4 mb-2">
        <p className="text-[10px] font-mono font-bold text-[#135bec]/40 uppercase tracking-[0.3em]">
          • Trusted Circle Active •
        </p>
      </div>
    </div>
  );
}
