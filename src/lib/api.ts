const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    return `http://${window.location.hostname}:4000`;
  }
  return "http://localhost:4000";
};

const BASE = getBaseUrl();

export async function getFriends() {
  const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${BASE}/friends?userId=${encodeURIComponent(authUser.id || "")}`, { signal: controller.signal });
    if (!res.ok) throw new Error(`Failed to load friends (${res.status})`);
    return res.json();
  } finally {
    clearTimeout(timeout);
  }
}

export async function getGroups() {
  const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
  const res = await fetch(`${BASE}/groups?userId=${encodeURIComponent(authUser.id || "")}`);
  return res.json();
}

export async function getGroupMessages(groupId: string) {
  const res = await fetch(`${BASE}/groups/${groupId}/messages`);
  return res.json();
}

export async function sendGroupMessage(groupId: string, body: string, sender: string) {
  const res = await fetch(`${BASE}/groups/${groupId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body, sender }),
  });
  return res.json();
}

export async function getFriendRequests(type: "incoming" | "outgoing") {
  const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
  const res = await fetch(`${BASE}/friend-requests?type=${type}&userId=${encodeURIComponent(authUser.id || "")}`);
  return res.json();
}

export async function sendFriendRequest(toUserIdentifier: string) {
  const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
  const res = await fetch(`${BASE}/friend-requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ toUserIdentifier, fromUserId: authUser.id }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to send request");
  }
  return res.json();
}

export async function acceptFriendRequest(id: string) {
  const res = await fetch(`${BASE}/friend-requests/${id}/accept`, { method: "POST" });
  return res.json();
}

export async function declineFriendRequest(id: string) {
  const res = await fetch(`${BASE}/friend-requests/${id}/decline`, { method: "POST" });
  return res.json();
}

export async function getMessages(friendId: string) {
  const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
  const res = await fetch(`${BASE}/chats/${friendId}/messages?userId=${encodeURIComponent(authUser.id || "current-user")}`);
  return res.json();
}

export async function sendMessage(friendId: string, body: string, sender: string) {
  const res = await fetch(`${BASE}/chats/${friendId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body, sender }),
  });
  return res.json();
}

export async function reactToMessage(messageId: string, emoji: string, userId: string) {
  const res = await fetch(`${BASE}/messages/${messageId}/react`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ emoji, userId }),
  });
  return res.json();
}

export async function markMessageRead(messageId: string, userId: string) {
  const res = await fetch(`${BASE}/messages/${messageId}/read`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  return res.json();
}

export async function login(identifier: string, password: string) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: identifier, password }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Invalid credentials");
  }
  return res.json();
}

export async function signup(email: string, username: string, password: string) {
  const res = await fetch(`${BASE}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, username, password }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Signup failed");
  }
  return res.json();
}

export async function requestPasswordReset(identifier: string) {
  const res = await fetch(`${BASE}/auth/forgot`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier }),
  });
  if (!res.ok) throw new Error("Reset request failed");
  return res.json();
}

export async function resetPassword(token: string, password: string) {
  const res = await fetch(`${BASE}/auth/reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password }),
  });
  if (!res.ok) throw new Error("Reset failed");
  return res.json();
}

export async function deleteAccount(userId: string) {
  const res = await fetch(`${BASE}/auth/delete`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Deletion failed");
  }
  return res.json();
}

export async function wipeAllMessages(userId: string) {
  const res = await fetch(`${BASE}/messages/wipe`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) throw new Error("Wipe failed");
  return res.json();
}