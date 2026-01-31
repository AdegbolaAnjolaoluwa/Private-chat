import { Reaction } from "@/types/chat";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ReactionDisplayProps {
  reactions: Reaction[];
  onToggleReaction: (emoji: string) => void;
  currentUserId: string;
}

export function ReactionDisplay({ reactions, onToggleReaction, currentUserId }: ReactionDisplayProps) {
  if (!reactions || reactions.length === 0) return null;

  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {} as Record<string, Reaction[]>);

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {Object.entries(groupedReactions).map(([emoji, reactionList]) => {
        const userReacted = reactionList.some((r) => r.userId === currentUserId);
        const names = reactionList.map((r) => r.userName).join(", ");

        return (
          <TooltipProvider key={emoji}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onToggleReaction(emoji)}
                  className={`
                    inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono
                    transition-all hover:scale-110 border backdrop-blur-sm
                    ${
                      userReacted
                        ? "bg-[#135bec]/20 border-[#135bec] text-[#135bec]"
                        : "bg-[#0b0f1a]/80 border-white/10 text-white/60 hover:bg-[#0b0f1a] hover:border-white/20"
                    }
                  `}
                >
                  <span>{emoji}</span>
                  <span className="font-bold">{reactionList.length}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent className="bg-[#0b0f1a] border-white/10 text-white text-xs">
                <p>{names}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
}
