import { Friend } from "@/types/chat";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Info } from "lucide-react";
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
    <div className="flex flex-col h-screen">
      {/* Chat Header */}
      <div className="border-b border-border bg-card px-4 py-3 flex items-center gap-3">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        <Avatar>
          <AvatarFallback className="bg-primary text-primary-foreground">{friend.username.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h2 className="font-semibold">{friend.username}</h2>
          <p className="text-xs text-muted-foreground">
            {typingUser ? (
              <span className="text-primary">typing...</span>
            ) : friend.status === "online" ? (
              "Online"
            ) : (
              `Last seen ${friend.lastSeen}`
            )}
          </p>
        </div>
        <Button variant="ghost" size="icon">
          <Info className="w-5 h-5" />
        </Button>
      </div>

      {/* Messages */}
      <MessageList messages={messages} currentUserId={currentUserId} onReact={onReact} typingUser={typingUser} />

      {/* Input */}
      <MessageInput onSend={onSendMessage} onTyping={onTyping} onStopTyping={onStopTyping} />
    </div>
  );
}
