export interface Message {
  id: string;
  sender: string;
  body: string;
  createdAt: string;
  expiresAt: string;
  reactions?: Reaction[];
  readBy?: string[];
}

export interface Reaction {
  emoji: string;
  userId: string;
  userName: string;
}

export interface Friend {
  id: string;
  username: string;
  email: string;
  status: "online" | "offline";
  lastSeen?: string;
}

export interface FriendRequest {
  id: string;
  fromUser: string;
  fromUserId: string;
  toUser: string;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
}

export interface Chat {
  friendId: string;
  messages: Message[];
}
