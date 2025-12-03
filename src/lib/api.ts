const BASE = "http://localhost:4000";

export async function getFriends() {
  const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
  const res = await fetch(`${BASE}/friends?userId=${encodeURIComponent(authUser.id || "")}`);
  return res.json();
}

export async function getFriendRequests(type: "incoming" | "outgoing") {
  const res = await fetch(`${BASE}/friend-requests?type=${type}`);
  return res.json();
}

export async function sendFriendRequest(toUserIdentifier: string) {
  const res = await fetch(`${BASE}/friend-requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ toUserIdentifier }),
  });
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

export async function login(email: string, password: string) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error("Invalid credentials");
  return res.json();
}

export async function signup(email: string, username: string, password: string) {
  const res = await fetch(`${BASE}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, username, password }),
  });
  if (!res.ok) throw new Error("Signup failed");
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