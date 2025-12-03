import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";

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
    <form onSubmit={handleSubmit} className="border-t border-border p-4 bg-card">
      <div className="flex gap-2 items-end">
        <Textarea
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="resize-none min-h-[60px] max-h-[120px]"
          rows={2}
        />
        <Button type="submit" size="icon" className="h-[60px] w-[60px] shrink-0" disabled={!message.trim()}>
          <Send className="w-5 h-5" />
        </Button>
      </div>
    </form>
  );
}
