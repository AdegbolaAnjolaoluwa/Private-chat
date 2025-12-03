import { useEffect, useState } from "react";
import { FriendRequest } from "@/types/chat";
import { FriendRequestList } from "@/components/friends/FriendRequestList";
import { acceptFriendRequest, declineFriendRequest, getFriendRequests } from "@/lib/api";
import { toast } from "sonner";

export default function FriendRequests() {
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [outgoing, setOutgoing] = useState<FriendRequest[]>([]);

  const refresh = () => {
    getFriendRequests("incoming").then(setIncoming);
    getFriendRequests("outgoing").then(setOutgoing);
  };

  useEffect(() => {
    refresh();
  }, []);

  const onAccept = async (id: string) => {
    await acceptFriendRequest(id);
    toast.success("Request accepted");
    refresh();
  };

  const onDecline = async (id: string) => {
    await declineFriendRequest(id);
    toast.info("Request declined");
    refresh();
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="border-b border-border p-4 bg-card">
        <h2 className="text-lg font-semibold">Friend Requests</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="border-b border-border">
          <div className="p-4 text-sm font-medium text-muted-foreground">Incoming</div>
          <FriendRequestList requests={incoming} type="incoming" onAccept={onAccept} onDecline={onDecline} />
        </div>
        <div>
          <div className="p-4 text-sm font-medium text-muted-foreground">Outgoing</div>
          <FriendRequestList requests={outgoing} type="outgoing" />
        </div>
      </div>
    </div>
  );
}