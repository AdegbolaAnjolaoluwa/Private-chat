import { useState, useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { FriendList } from "@/components/friends/FriendList";
import { FriendRequestList } from "@/components/friends/FriendRequestList";
import { AddFriendForm } from "@/components/friends/AddFriendForm";
import { ChatLayout } from "@/components/chat/ChatLayout";
import { Friend, FriendRequest, Message } from "@/types/chat";
import { getExpiryTime } from "@/utils/time";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { initSocket, joinChat, socket } from "@/lib/socket";

// Sample data
const sampleFriends: Friend[] = [
  {
    id: "1",
    username: "Alice",
    email: "alice@example.com",
    status: "online",
  },
  {
    id: "2",
    username: "Bob",
    email: "bob@example.com",
    status: "offline",
    lastSeen: "2h ago",
  },
];

const sampleRequests: FriendRequest[] = [
  {
    id: "1",
    fromUser: "Charlie",
    fromUserId: "3",
    toUser: "You",
    status: "pending",
    createdAt: new Date().toISOString(),
  },
];

const Index = () => {
  const [activeView, setActiveView] = useState("friends");
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [friends, setFriends] = useState(sampleFriends);
  const [incomingRequests, setIncomingRequests] = useState(sampleRequests);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({
    "1": [
      {
        id: "1",
        sender: "Alice",
        body: "Hey! How are you?",
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        expiresAt: getExpiryTime(new Date(Date.now() - 30 * 60 * 1000).toISOString()),
        reactions: [],
        readBy: [],
      },
    ],
  });
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});

  const currentUserId = "You";

  useEffect(() => {
    initSocket(currentUserId);

    socket.on("typing:start", ({ chatId, userName }) => {
      setTypingUsers((prev) => ({ ...prev, [chatId]: userName }));
    });

    socket.on("typing:stop", ({ chatId }) => {
      setTypingUsers((prev) => {
        const updated = { ...prev };
        delete updated[chatId];
        return updated;
      });
    });

    socket.on("message:new", ({ chatId, message }) => {
      setMessages((prev) => ({
        ...prev,
        [chatId]: [...(prev[chatId] || []), message],
      }));
    });

    return () => {
      socket.off("typing:start");
      socket.off("typing:stop");
      socket.off("message:new");
    };
  }, []);

  useEffect(() => {
    if (selectedFriend) {
      joinChat(currentUserId, selectedFriend.id);
    }
  }, [selectedFriend]);

  const handleSendMessage = async (friendId: string, messageText: string) => {
    const now = new Date().toISOString();
    const newMessage: Message = {
      id: Date.now().toString(),
      sender: currentUserId,
      body: messageText,
      createdAt: now,
      expiresAt: getExpiryTime(now),
      reactions: [],
      readBy: [],
    };

    setMessages((prev) => ({
      ...prev,
      [friendId]: [...(prev[friendId] || []), newMessage],
    }));

    try {
      await fetch(`http://localhost:4000/chats/${friendId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: messageText, sender: currentUserId }),
      });
    } catch (e) {
      // Keep optimistic UI even if server call fails (demo)
    }

    // Mark previous messages as read
    setTimeout(() => {
      setMessages((prev) => ({
        ...prev,
        [friendId]: (prev[friendId] || []).map((msg) =>
          msg.sender !== currentUserId && !msg.readBy?.includes(currentUserId)
            ? { ...msg, readBy: [...(msg.readBy || []), currentUserId] }
            : msg
        ),
      }));
    }, 1000);

    // Simulate friend reading the message after 2 seconds
    setTimeout(() => {
      setMessages((prev) => ({
        ...prev,
        [friendId]: (prev[friendId] || []).map((msg) =>
          msg.id === newMessage.id ? { ...msg, readBy: [...(msg.readBy || []), friendId] } : msg
        ),
      }));
    }, 2000);
  };

  const handleReaction = (friendId: string, messageId: string, emoji: string) => {
    setMessages((prev) => ({
      ...prev,
      [friendId]: (prev[friendId] || []).map((msg) => {
        if (msg.id !== messageId) return msg;

        const reactions = msg.reactions || [];
        const existingReaction = reactions.find((r) => r.userId === currentUserId);

        if (existingReaction) {
          // Toggle reaction - if same emoji, remove it; if different, replace it
          if (existingReaction.emoji === emoji) {
            return {
              ...msg,
              reactions: reactions.filter((r) => r.userId !== currentUserId),
            };
          } else {
            return {
              ...msg,
              reactions: reactions.map((r) => (r.userId === currentUserId ? { ...r, emoji } : r)),
            };
          }
        } else {
          // Add new reaction
          return {
            ...msg,
            reactions: [...reactions, { emoji, userId: currentUserId, userName: "You" }],
          };
        }
      }),
    }));

    toast.success("Reaction added");
  };

  const handleTyping = (friendId: string) => {
    setTypingUsers((prev) => ({ ...prev, [friendId]: currentUserId }));
    socket.emit("typing:start", { chatId: friendId, userName: currentUserId });
  };

  const handleStopTyping = (friendId: string) => {
    setTypingUsers((prev) => {
      const updated = { ...prev };
      delete updated[friendId];
      return updated;
    });
    socket.emit("typing:stop", { chatId: friendId });
  };

  // Simulate friend typing
  const simulateFriendTyping = (friendId: string, friendName: string) => {
    setTypingUsers((prev) => ({ ...prev, [friendId]: friendName }));
    setTimeout(() => {
      setTypingUsers((prev) => {
        const updated = { ...prev };
        delete updated[friendId];
        return updated;
      });
    }, 3000);
  };

  const handleSendRequest = (identifier: string) => {
    const newRequest: FriendRequest = {
      id: Date.now().toString(),
      fromUser: currentUserId,
      fromUserId: "current-user",
      toUser: identifier,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    setOutgoingRequests((prev) => [...prev, newRequest]);
    toast.success(`Friend request sent to ${identifier}`);
  };

  const handleAcceptRequest = (requestId: string) => {
    const request = incomingRequests.find((r) => r.id === requestId);
    if (request) {
      const newFriend: Friend = {
        id: request.fromUserId,
        username: request.fromUser,
        email: `${request.fromUser.toLowerCase()}@example.com`,
        status: "offline",
      };
      setFriends((prev) => [...prev, newFriend]);
      setIncomingRequests((prev) => prev.filter((r) => r.id !== requestId));
      toast.success(`You are now friends with ${request.fromUser}`);
    }
  };

  const handleDeclineRequest = (requestId: string) => {
    setIncomingRequests((prev) => prev.filter((r) => r.id !== requestId));
    toast.info("Friend request declined");
  };

  const renderContent = () => {
    if (selectedFriend) {
      return (
        <ChatLayout
          friend={selectedFriend}
          messages={messages[selectedFriend.id] || []}
          currentUserId={currentUserId}
          onSendMessage={(msg) => {
            handleSendMessage(selectedFriend.id, msg);
            // Simulate friend typing after we send a message
            setTimeout(() => simulateFriendTyping(selectedFriend.id, selectedFriend.username), 3000);
          }}
          onReact={(msgId, emoji) => handleReaction(selectedFriend.id, msgId, emoji)}
          onTyping={() => handleTyping(selectedFriend.id)}
          onStopTyping={() => handleStopTyping(selectedFriend.id)}
          typingUser={typingUsers[selectedFriend.id] !== currentUserId ? typingUsers[selectedFriend.id] : undefined}
          onBack={() => setSelectedFriend(null)}
        />
      );
    }

    switch (activeView) {
      case "friends":
        return (
          <div className="flex flex-col h-screen">
            <div className="border-b border-border p-4 bg-card">
              <h2 className="text-lg font-semibold">Friends</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              <FriendList friends={friends} selectedFriendId={selectedFriend?.id} onSelectFriend={setSelectedFriend} />
            </div>
          </div>
        );

      case "requests":
        return (
          <div className="flex flex-col h-screen">
            <div className="border-b border-border p-4 bg-card">
              <h2 className="text-lg font-semibold">Friend Requests</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="border-b border-border">
                <div className="p-4 text-sm font-medium text-muted-foreground">Incoming</div>
                <FriendRequestList requests={incomingRequests} type="incoming" onAccept={handleAcceptRequest} onDecline={handleDeclineRequest} />
              </div>
              <div>
                <div className="p-4 text-sm font-medium text-muted-foreground">Outgoing</div>
                <FriendRequestList requests={outgoingRequests} type="outgoing" />
              </div>
            </div>
          </div>
        );

      case "add-friend":
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
              <AddFriendForm onSendRequest={handleSendRequest} />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar activeView={activeView} onViewChange={setActiveView} pendingRequestCount={incomingRequests.length} />
        <main className="flex-1 bg-background">
          <Alert className="m-4 border-primary/20 bg-primary/5">
            <Info className="w-4 h-4 text-primary" />
            <AlertDescription className="text-sm">
              <strong>Auto-delete enabled:</strong> All messages automatically delete after 2 hours for privacy.
            </AlertDescription>
          </Alert>
          {renderContent()}
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Index;
