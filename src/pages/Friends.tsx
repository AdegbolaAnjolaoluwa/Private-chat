import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Friend } from "@/types/chat";
import { FriendList } from "@/components/friends/FriendList";
import { getFriends } from "@/lib/api";

export default function Friends() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    getFriends().then(setFriends);
  }, []);

  return (
    <div className="flex flex-col h-screen">
      <div className="border-b border-border p-4 bg-card">
        <h2 className="text-lg font-semibold">Friends</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        <FriendList friends={friends} onSelectFriend={(f) => navigate(`/app/chat/${f.id}`)} />
      </div>
    </div>
  );
}