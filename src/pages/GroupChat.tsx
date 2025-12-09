import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChatLayout } from "@/components/chat/ChatLayout";
import { Friend, Message } from "@/types/chat";
import { getGroups, getGroupMessages, reactToMessage, sendGroupMessage, markMessageRead } from "@/lib/api";
import { getExpiryTime } from "@/utils/time";
import { initSocket, joinGroup, socket } from "@/lib/socket";

export default function GroupChat() {
  const { groupId = "" } = useParams();
  const [groupFriend, setGroupFriend] = useState<Friend | null>(null);
  const queryClient = useQueryClient();
  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ["group-messages", groupId],
    queryFn: () => getGroupMessages(groupId),
    enabled: !!groupId,
  });

  const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
  const currentUserId = authUser.id || "current-user";

  useEffect(() => {
    initSocket(currentUserId);
  }, []);

  useEffect(() => {
    joinGroup(groupId);
    socket.on("message:new", ({ chatId, message }) => {
      if (chatId === `group:${groupId}`) {
        queryClient.setQueryData<Message[]>(["group-messages", groupId], (prev = []) => [...prev, message]);
      }
    });
    return () => {
      socket.off("message:new");
    };
  }, [groupId]);

  useEffect(() => {
    getGroups().then((gs: any[]) => {
      const g = gs.find((x) => x.id === groupId);
      const name = g?.name || groupId;
      setGroupFriend({ id: groupId, username: name, email: "", status: "online" });
    });
  }, [groupId]);

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
    queryClient.setQueryData<Message[]>(["group-messages", groupId], (prev = []) => [...prev, optimistic]);
    try {
      await sendGroupMessage(groupId, text, currentUserId);
    } finally {
      queryClient.invalidateQueries({ queryKey: ["group-messages", groupId] });
    }
  };

  const onReact = async (messageId: string, emoji: string) => {
    queryClient.setQueryData<Message[]>(["group-messages", groupId], (prev = []) =>
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
      queryClient.invalidateQueries({ queryKey: ["group-messages", groupId] });
    }
  };

  const typingDisplay = useMemo(() => undefined, []);

  useEffect(() => {
    const msgs = queryClient.getQueryData<Message[]>(["group-messages", groupId]) || [];
    msgs
      .filter((m) => m.sender !== currentUserId && !(m.readBy || []).includes(currentUserId))
      .forEach(async (m) => {
        try {
          await markMessageRead(m.id, currentUserId);
          queryClient.setQueryData<Message[]>(["group-messages", groupId], (prev = []) =>
            prev.map((x) => (x.id === m.id ? { ...x, readBy: [...(x.readBy || []), currentUserId] } : x)),
          );
        } catch {}
      });
  }, [groupId, queryClient, currentUserId]);

  if (!groupFriend) return null;

  return (
    <ChatLayout
      friend={groupFriend}
      messages={messages}
      currentUserId={currentUserId}
      onSendMessage={onSendMessage}
      onReact={onReact}
      onTyping={() => {}}
      onStopTyping={() => {}}
      typingUser={typingDisplay}
      onBack={undefined}
    />
  );
}