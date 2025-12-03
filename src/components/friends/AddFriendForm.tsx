import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus } from "lucide-react";

interface AddFriendFormProps {
  onSendRequest: (identifier: string) => void;
}

export function AddFriendForm({ onSendRequest }: AddFriendFormProps) {
  const [identifier, setIdentifier] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (identifier.trim()) {
      onSendRequest(identifier.trim());
      setIdentifier("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6">
      <div className="space-y-2">
        <Label htmlFor="identifier">Username or Email</Label>
        <Input
          id="identifier"
          type="text"
          placeholder="friend@example.com or username"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
        />
      </div>
      <Button type="submit" className="w-full" disabled={!identifier.trim()}>
        <UserPlus className="w-4 h-4 mr-2" />
        Send Friend Request
      </Button>
    </form>
  );
}
