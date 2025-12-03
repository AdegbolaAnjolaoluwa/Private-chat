import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { ChatLayout } from "@/components/chat/ChatLayout";
import { Friend, Message } from "@/types/chat";
import { getFriends, getMessages, reactToMessage, sendMessage } from "@/lib/api";
import { getExpiryTime } from "@/utils/time";
import { initSocket, joinChat, socket } from "@/lib/socket";

export default function Chat() {
  const { friendId = "" } = useParams();
  const [friend, setFriend] = useState<Friend | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUser, setTypingUser] = useState<string | undefined>(undefined);

  const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
  const currentUserId = authUser.id || "current-user";

  useEffect(() => {
    initSocket(currentUserId);
  }, []);

  useEffect(() => {
    joinChat(currentUserId, friendId);
    socket.on("typing:start", ({ chatId, userName }) => {
      if (chatId === friendId) setTypingUser(userName);
    });
    socket.on("typing:stop", ({ chatId }) => {
      if (chatId === friendId) setTypingUser(undefined);
    });
    socket.on("message:new", ({ chatId, message }) => {
      if (chatId === friendId) setMessages((prev) => [...prev, message]);
    });
    return () => {
      socket.off("typing:start");
      socket.off("typing:stop");
      socket.off("message:new");
    };
  }, [friendId]);

  useEffect(() => {
    getFriends().then((fs) => setFriend(fs.find((f: Friend) => f.id === friendId) || null));
    getMessages(friendId).then(setMessages);
  }, [friendId]);

  const onSendMessage = async (text: string) => {
    const now = new Date().toISOString();
    const optimistic: Message = {
      id: Date.now().toString(),
      sender: currentUserId,
      body: text,
      createdAt: now,
      expiresAt: getExpiryTime(now),
      reactions: [],
      readBy: [],
    };
    setMessages((prev) => [...prev, optimistic]);
    try {
      await sendMessage(friendId, text, currentUserId);
    } catch {}
  };

  const onReact = async (messageId: string, emoji: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? {
              ...m,
              reactions: [
                ...(m.reactions || []).filter((r) => r.userId !== currentUserId),
                { emoji, userId: currentUserId, userName: "You" },
              ],
            }
          : m,
      ),
    );
    try {
      await reactToMessage(messageId, emoji, currentUserId);
    } catch {}
  };

  const onTyping = () => {
    socket.emit("typing:start", { chatId: friendId, userName: currentUserId });
  };
  const onStopTyping = () => {
    socket.emit("typing:stop", { chatId: friendId });
  };

  const typingDisplay = useMemo(() => (typingUser !== currentUserId ? typingUser : undefined), [typingUser, currentUserId]);

  if (!friend) return null;

  return (
    <ChatLayout
      friend={friend}
      messages={messages}
      currentUserId={currentUserId}
      onSendMessage={onSendMessage}
      onReact={onReact}
      onTyping={onTyping}
      onStopTyping={onStopTyping}
      typingUser={typingDisplay}
      onBack={undefined}
    />
  );
}