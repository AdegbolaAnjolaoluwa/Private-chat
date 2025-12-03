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
            "h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity",
            userReaction && "opacity-100"
          )}
        >
          <SmilePlus className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="center">
        <div className="flex gap-1">
          {REACTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleReact(emoji)}
              className={cn(
                "text-2xl hover:scale-125 transition-transform p-1 rounded",
                userReaction === emoji && "bg-primary/10"
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
