import { FriendRequest } from "@/types/chat";
import { FriendRequestList } from "@/components/friends/FriendRequestList";
import { acceptFriendRequest, declineFriendRequest, getFriendRequests } from "@/lib/api";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function FriendRequests() {
  const qc = useQueryClient();
  const { data: incoming = [], isLoading: inLoading, isError: inError } = useQuery<FriendRequest[]>({
    queryKey: ["friendRequests", "incoming"],
    queryFn: () => getFriendRequests("incoming"),
  });
  const { data: outgoing = [], isLoading: outLoading, isError: outError } = useQuery<FriendRequest[]>({
    queryKey: ["friendRequests", "outgoing"],
    queryFn: () => getFriendRequests("outgoing"),
  });

  const acceptMut = useMutation({
    mutationFn: (id: string) => acceptFriendRequest(id),
    onSuccess: () => {
      toast.success("Request accepted");
      qc.invalidateQueries({ queryKey: ["friendRequests"] });
    },
  });
  const declineMut = useMutation({
    mutationFn: (id: string) => declineFriendRequest(id),
    onSuccess: () => {
      toast.info("Request declined");
      qc.invalidateQueries({ queryKey: ["friendRequests"] });
    },
  });

  return (
    <div className="flex flex-col h-screen">
      <div className="border-b border-border p-4 bg-card">
        <h2 className="text-lg font-semibold">Friend Requests</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="border-b border-border">
          <div className="p-4 text-sm font-medium text-muted-foreground">Incoming</div>
          {inLoading ? (
            <div className="px-4 pb-4 text-sm text-muted-foreground">Loading...</div>
          ) : inError ? (
            <div className="px-4 pb-4 text-sm text-destructive">Failed to load</div>
          ) : (
            <FriendRequestList
              requests={incoming}
              type="incoming"
              onAccept={(id) => acceptMut.mutate(id)}
              onDecline={(id) => declineMut.mutate(id)}
            />
          )}
        </div>
        <div>
          <div className="p-4 text-sm font-medium text-muted-foreground">Outgoing</div>
          {outLoading ? (
            <div className="px-4 pb-4 text-sm text-muted-foreground">Loading...</div>
          ) : outError ? (
            <div className="px-4 pb-4 text-sm text-destructive">Failed to load</div>
          ) : (
            <FriendRequestList requests={outgoing} type="outgoing" />
          )}
        </div>
      </div>
    </div>
  );
}