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
                    inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs
                    transition-all hover:scale-110
                    ${
                      userReacted
                        ? "bg-primary/20 border border-primary"
                        : "bg-secondary border border-border hover:bg-secondary/80"
                    }
                  `}
                >
                  <span>{emoji}</span>
                  <span className="font-medium">{reactionList.length}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{names}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
}
