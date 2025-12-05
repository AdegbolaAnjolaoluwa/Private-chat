import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Friend } from "@/types/chat";
import { FriendList } from "@/components/friends/FriendList";
import { getFriends } from "@/lib/api";

export default function Friends() {
  const navigate = useNavigate();
  const { data: friends = [], isLoading, isError } = useQuery<Friend[]>({ queryKey: ["friends"], queryFn: getFriends });

  return (
    <div className="flex flex-col h-screen">
      <div className="border-b border-border p-4 bg-card">
        <h2 className="text-lg font-semibold">Friends</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-sm text-muted-foreground">Loading friends...</div>
        ) : isError ? (
          <div className="p-4 text-sm text-destructive">Failed to load friends</div>
        ) : (
          <FriendList friends={friends} onSelectFriend={(f) => navigate(`/app/chat/${f.id}`)} />
        )}
      </div>
    </div>
  );
}