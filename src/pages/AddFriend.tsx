import { AddFriendForm } from "@/components/friends/AddFriendForm";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { sendFriendRequest } from "@/lib/api";
import { Info } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function AddFriend() {
  const navigate = useNavigate();

  const onSendRequest = async (identifier: string) => {
    await sendFriendRequest(identifier);
    toast.success(`Friend request sent to ${identifier}`);
    navigate("/requests");
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