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

  if (messages.length === 0 && !typingUser) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p className="text-sm">No messages yet. Start the conversation!</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          isSent={message.sender === currentUserId}
          currentUserId={currentUserId}
          onReact={onReact}
        />
      ))}
      {typingUser && <TypingIndicator userName={typingUser} />}
      <div ref={bottomRef} />
    </div>
  );
}
