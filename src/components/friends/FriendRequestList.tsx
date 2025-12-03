import { FriendRequest } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Check, X, Clock } from "lucide-react";
import { formatTimestamp } from "@/utils/time";

interface FriendRequestListProps {
  requests: FriendRequest[];
  type: "incoming" | "outgoing";
  onAccept?: (requestId: string) => void;
  onDecline?: (requestId: string) => void;
}

export function FriendRequestList({ requests, type, onAccept, onDecline }: FriendRequestListProps) {
  if (requests.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground text-sm">
        No {type} friend requests
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {requests.map((request) => (
        <div key={request.id} className="p-4 flex items-center gap-3">
          <Avatar>
            <AvatarFallback className="bg-secondary text-secondary-foreground">
              {request.fromUser.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="font-medium text-sm">
              {type === "incoming" ? request.fromUser : request.toUser}
            </div>
            <div className="text-xs text-muted-foreground">{formatTimestamp(request.createdAt)}</div>
          </div>
          {type === "incoming" && (
            <div className="flex gap-2">
              <Button size="icon" variant="default" onClick={() => onAccept?.(request.id)}>
                <Check className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="outline" onClick={() => onDecline?.(request.id)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
          {type === "outgoing" && (
            <div className="flex items-center gap-1 text-muted-foreground text-xs">
              <Clock className="w-3 h-3" />
              Pending
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
