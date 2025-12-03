import { Friend } from "@/types/chat";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface FriendListProps {
  friends: Friend[];
  selectedFriendId?: string;
  onSelectFriend: (friend: Friend) => void;
}

export function FriendList({ friends, selectedFriendId, onSelectFriend }: FriendListProps) {
  if (friends.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground text-sm">
        No friends yet. Send a friend request to start chatting!
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {friends.map((friend) => (
        <button
          key={friend.id}
          onClick={() => onSelectFriend(friend)}
          className={cn(
            "w-full px-4 py-3 flex items-center gap-3 hover:bg-sidebar-accent transition-colors",
            selectedFriendId === friend.id && "bg-sidebar-accent"
          )}
        >
          <Avatar>
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">{friend.username.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 text-left">
            <div className="font-medium text-sm">{friend.username}</div>
            <div className="text-xs text-muted-foreground">{friend.status === "online" ? "Online" : "Offline"}</div>
          </div>
        </button>
      ))}
    </div>
  );
}
