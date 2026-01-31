import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface TypingIndicatorProps {
  userName: string;
}

export function TypingIndicator({ userName }: TypingIndicatorProps) {
  return (
    <div className="flex items-center gap-3 px-6 py-2 animate-in fade-in slide-in-from-bottom-1 duration-200">
      <Avatar className="w-8 h-8 border border-white/10">
        <AvatarFallback className="bg-[#0b0f1a] text-white/40 text-[10px] font-bold">
          FR
        </AvatarFallback>
      </Avatar>
      <div className="bg-[#0b0f1a] border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1 shadow-lg">
        <div className="flex gap-1.5">
          <span className="w-1.5 h-1.5 bg-[#135bec] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-1.5 h-1.5 bg-[#135bec] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-1.5 h-1.5 bg-[#135bec] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
      <span className="text-[10px] font-mono text-[#135bec] animate-pulse uppercase tracking-wider">
        Transmitting...
      </span>
    </div>
  );
}
