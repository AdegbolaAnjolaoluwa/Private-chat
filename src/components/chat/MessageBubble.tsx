import { Message } from "@/types/chat";
import { CountdownTimer } from "./CountdownTimer";
import { formatTimestamp, getRemainingTime } from "@/utils/time";
import { cn } from "@/lib/utils";
import { ReactionPicker } from "./ReactionPicker";
import { ReactionDisplay } from "./ReactionDisplay";
import { Check, CheckCheck, Clock } from "lucide-react";

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
    <div className={cn("flex mb-4 animate-in fade-in slide-in-from-bottom-2 duration-200 group", isSent ? "justify-end" : "justify-start")}>
      <div className="flex flex-col gap-1 max-w-[70%]">
        <div
          className={cn(
            "rounded-2xl px-4 py-2 shadow-sm transition-opacity duration-300",
            isSent ? "bg-message-sent text-message-sent-foreground rounded-br-sm" : "bg-message-received text-message-received-foreground rounded-bl-sm",
            isExpired && "opacity-30"
          )}
        >
          {!isSent && <div className="font-semibold text-sm mb-1">{message.sender}</div>}
          <div className="text-sm whitespace-pre-wrap break-words">{message.body}</div>
          <div className="flex items-center justify-between gap-3 mt-2">
            <div className="flex items-center gap-2">
              <span className="text-xs opacity-70">{formatTimestamp(message.createdAt)}</span>
              {isSent && (
                <div className="text-xs opacity-70">
                  {message.pending ? (
                    <Clock className="w-3.5 h-3.5" />
                  ) : message.readBy && message.readBy.length > 0 ? (
                    <CheckCheck className="w-3.5 h-3.5 text-primary" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              <CountdownTimer expiresAt={message.expiresAt} />
              <ReactionPicker onReact={(emoji) => onReact(message.id, emoji)} userReaction={userReaction} />
            </div>
          </div>
          {isExpired && <div className="text-xs mt-1 text-message-expired">Will be removed soon</div>}
        </div>
        <ReactionDisplay
          reactions={message.reactions || []}
          onToggleReaction={(emoji) => onReact(message.id, emoji)}
          currentUserId={currentUserId}
        />
      </div>
    </div>
  );
}
