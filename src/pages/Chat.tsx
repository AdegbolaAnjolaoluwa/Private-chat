import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChatLayout } from "@/components/chat/ChatLayout";
import { Friend, Message } from "@/types/chat";
import { getFriends, getMessages, reactToMessage, sendMessage, markMessageRead } from "@/lib/api";
import { getExpiryTime } from "@/utils/time";
import { initSocket, joinChat, socket } from "@/lib/socket";

import { getRoomKey } from "@/utils/chat";

export default function Chat() {
  const { friendId = "" } = useParams();
  const [friend, setFriend] = useState<Friend | null>(null);
  const queryClient = useQueryClient();
  const { data: messages = [] } = useQuery<Message[]>({ queryKey: ["messages", friendId], queryFn: () => getMessages(friendId), enabled: !!friendId });
  const [typingUser, setTypingUser] = useState<string | undefined>(undefined);

  const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
  const currentUserId = authUser.id || "current-user";

  useEffect(() => {
    initSocket(currentUserId);
  }, []);

  useEffect(() => {
    if (!friendId) return;
    joinChat(currentUserId, friendId);
    
    const expectedChatId = getRoomKey(currentUserId, friendId);

    socket.on("typing:start", ({ chatId, userName }) => {
      if (chatId === expectedChatId) setTypingUser(userName);
    });
    socket.on("typing:stop", ({ chatId }) => {
      if (chatId === expectedChatId) setTypingUser(undefined);
    });
    socket.on("message:new", ({ chatId, message }) => {
      if (chatId === expectedChatId) {
        queryClient.setQueryData<Message[]>(["messages", friendId], (prev = []) => {
           // Prevent duplicates if optimistic update already added it
           if (prev.some(m => m.id === message.id)) return prev;
           return [...prev, message];
        });
      }
    });
    socket.on("message:read", ({ messageId, userId }) => {
      queryClient.setQueryData<Message[]>(["messages", friendId], (prev = []) =>
        prev.map((m) => (m.id === messageId ? { ...m, readBy: Array.from(new Set([...(m.readBy || []), userId])) } : m)),
      );
    });
    return () => {
      socket.off("typing:start");
      socket.off("typing:stop");
      socket.off("message:new");
      socket.off("message:read");
    };
  }, [friendId, currentUserId, queryClient]);

  useEffect(() => {
    getFriends().then((fs) => setFriend(fs.find((f: Friend) => f.id === friendId) || null));
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
      pending: true,
    };
    queryClient.setQueryData<Message[]>(["messages", friendId], (prev = []) => [...prev, optimistic]);
    try {
      await sendMessage(friendId, text, currentUserId);
    } finally {
      queryClient.invalidateQueries({ queryKey: ["messages", friendId] });
    }
  };

  const onReact = async (messageId: string, emoji: string) => {
    queryClient.setQueryData<Message[]>(["messages", friendId], (prev = []) =>
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
    } finally {
      queryClient.invalidateQueries({ queryKey: ["messages", friendId] });
    }
  };

  const onTyping = () => {
    socket.emit("typing:start", { chatId: getRoomKey(currentUserId, friendId), userName: currentUserId });
  };
  const onStopTyping = () => {
    socket.emit("typing:stop", { chatId: getRoomKey(currentUserId, friendId) });
  };

  const typingDisplay = useMemo(() => (typingUser !== currentUserId ? typingUser : undefined), [typingUser, currentUserId]);

  useEffect(() => {
    const msgs = queryClient.getQueryData<Message[]>(["messages", friendId]) || [];
    msgs
      .filter((m) => m.sender !== currentUserId && !(m.readBy || []).includes(currentUserId))
      .forEach(async (m) => {
        try {
          await markMessageRead(m.id, currentUserId);
          queryClient.setQueryData<Message[]>(["messages", friendId], (prev = []) =>
            prev.map((x) => (x.id === m.id ? { ...x, readBy: [...(x.readBy || []), currentUserId] } : x)),
          );
        } catch {}
      });
    const counts = JSON.parse(localStorage.getItem("unreadCounts") || "{}");
    counts[friendId] = 0;
    localStorage.setItem("unreadCounts", JSON.stringify(counts));
  }, [friendId, queryClient, currentUserId]);

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