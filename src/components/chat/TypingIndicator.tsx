import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface TypingIndicatorProps {
  userName: string;
}

export function TypingIndicator({ userName }: TypingIndicatorProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 animate-in fade-in slide-in-from-bottom-1 duration-200">
      <Avatar className="w-6 h-6">
        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
          {userName.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="bg-message-received rounded-2xl rounded-bl-sm px-4 py-2 flex items-center gap-1">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}
