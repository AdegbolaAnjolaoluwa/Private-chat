import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SmilePlus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReactionPickerProps {
  onReact: (emoji: string) => void;
  userReaction?: string;
}

const REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

export function ReactionPicker({ onReact, userReaction }: ReactionPickerProps) {
  const [open, setOpen] = useState(false);

  const handleReact = (emoji: string) => {
    onReact(emoji);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-6 w-6 text-white/20 hover:text-white hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-all duration-200",
            userReaction && "text-[#135bec] opacity-100 bg-[#135bec]/10"
          )}
        >
          <SmilePlus className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-1.5 bg-[#0b0f1a] border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.5)]" align="center" side="top">
        <div className="flex gap-1">
          {REACTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleReact(emoji)}
              className={cn(
                "text-lg hover:scale-125 transition-transform p-1.5 rounded hover:bg-white/5",
                userReaction === emoji && "bg-[#135bec]/20 ring-1 ring-[#135bec]/50"
              )}
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
