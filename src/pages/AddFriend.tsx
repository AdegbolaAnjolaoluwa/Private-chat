import { AddFriendForm } from "@/components/friends/AddFriendForm";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { sendFriendRequest } from "@/lib/api";
import { Info } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function AddFriend() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const mut = useMutation({
    mutationFn: (identifier: string) => sendFriendRequest(identifier),
    onMutate: async (identifier) => {
      toast.info(`Sending request to ${identifier}...`);
    },
    onSuccess: (_res, identifier) => {
      toast.success(`Friend request sent to ${identifier}`);
      qc.invalidateQueries({ queryKey: ["friendRequests"] });
      navigate("/app/requests");
    },
    onError: () => toast.error("Failed to send request"),
  });

  const onSendRequest = async (identifier: string) => {
    mut.mutate(identifier);
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="border-b border-border p-4 bg-card">
        <h2 className="text-lg font-semibold">Add Friend</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <Alert className="mb-4">
          <Info className="w-4 h-4" />
          <AlertDescription>Enter a username or email to send a friend request. Once accepted, you can start chatting!</AlertDescription>
        </Alert>
        <AddFriendForm onSendRequest={onSendRequest} />
      </div>
    </div>
  );
}