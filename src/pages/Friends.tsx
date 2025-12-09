import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Friend } from "@/types/chat";
import { FriendList } from "@/components/friends/FriendList";
import { getFriends } from "@/lib/api";
import { initSocket, joinChat, socket } from "@/lib/socket";

export default function Friends() {
  const navigate = useNavigate();
  const { data: friends = [], isLoading, isError } = useQuery<Friend[]>({ queryKey: ["friends"], queryFn: getFriends, retry: 0 });
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>(() => JSON.parse(localStorage.getItem("unreadCounts") || "{}"));

  useEffect(() => {
    const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
    const currentUserId = authUser.id || "current-user";
    initSocket(currentUserId);
    friends.forEach((f) => joinChat(currentUserId, f.id));
    socket.on("message:new", ({ chatId, message }) => {
      if (message.sender !== currentUserId) {
        setUnreadCounts((prev) => {
          const next = { ...prev, [chatId]: (prev[chatId] || 0) + 1 };
          localStorage.setItem("unreadCounts", JSON.stringify(next));
          return next;
        });
      }
    });
    return () => {
      socket.off("message:new");
    };
  }, [friends]);

  const handleSelect = (f: Friend) => {
    setUnreadCounts((prev) => {
      const next = { ...prev, [f.id]: 0 };
      localStorage.setItem("unreadCounts", JSON.stringify(next));
      return next;
    });
    navigate(`/app/chat/${f.id}`);
  };

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
          <FriendList friends={friends} onSelectFriend={handleSelect} unreadCounts={unreadCounts} />
        )}
      </div>
    </div>
  );
}
