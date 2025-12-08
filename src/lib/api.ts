const BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

function getAuthHeader() {
  const auth = JSON.parse(localStorage.getItem("authUser") || "null");
  const token = auth?.token || auth?.accessToken || null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getFriends() {
  const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
  const headers = { ...getAuthHeader() };
  const res = await fetch(`${BASE}/friends?userId=${encodeURIComponent(authUser.id || "")}`, { headers });
  return res.json();
}

export async function getFriendRequests(type: "incoming" | "outgoing") {
  const headers = { ...getAuthHeader() };
  const res = await fetch(`${BASE}/friend-requests?type=${type}`, { headers });
  return res.json();
}

export async function sendFriendRequest(toUserIdentifier: string) {
  const headers = { "Content-Type": "application/json", ...getAuthHeader() };
  const res = await fetch(`${BASE}/friend-requests`, {
    method: "POST",
    headers,
    body: JSON.stringify({ toUserIdentifier }),
  });
  return res.json();
}

export async function acceptFriendRequest(id: string) {
  const headers = { ...getAuthHeader() };
  const res = await fetch(`${BASE}/friend-requests/${id}/accept`, { method: "POST", headers });
  return res.json();
}

export async function declineFriendRequest(id: string) {
  const headers = { ...getAuthHeader() };
  const res = await fetch(`${BASE}/friend-requests/${id}/decline`, { method: "POST", headers });
  return res.json();
}

export async function getMessages(friendId: string) {
  const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
  const headers = { ...getAuthHeader() };
  const res = await fetch(`${BASE}/chats/${friendId}/messages?userId=${encodeURIComponent(authUser.id || "current-user")}`, { headers });
  return res.json();
}

export async function sendMessage(friendId: string, body: string, sender: string) {
  const headers = { "Content-Type": "application/json", ...getAuthHeader() };
  const res = await fetch(`${BASE}/chats/${friendId}/messages`, {
    method: "POST",
    headers,
    body: JSON.stringify({ body, sender }),
  });
  return res.json();
}

export async function reactToMessage(messageId: string, emoji: string, userId: string) {
  const headers = { "Content-Type": "application/json", ...getAuthHeader() };
  const res = await fetch(`${BASE}/messages/${messageId}/react`, {
    method: "POST",
    headers,
    body: JSON.stringify({ emoji, userId }),
  });
  return res.json();
}

export async function markMessageRead(messageId: string, userId: string) {
  const headers = { "Content-Type": "application/json", ...getAuthHeader() };
  const res = await fetch(`${BASE}/messages/${messageId}/read`, {
    method: "POST",
    headers,
    body: JSON.stringify({ userId }),
  });
  return res.json();
}

export async function login(identifier: string, password: string) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, password }),
  });
  if (!res.ok) throw new Error("Invalid credentials");
  const payload = await res.json();
  // store token and user for convenience
  localStorage.setItem("authUser", JSON.stringify({ token: payload.token, ...payload.user }));
  return payload;
}

export async function signup(email: string, username: string, password: string) {
  const res = await fetch(`${BASE}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, username, password }),
  });
  if (!res.ok) throw new Error("Signup failed");
  const payload = await res.json();
  localStorage.setItem("authUser", JSON.stringify({ token: payload.token, ...payload.user }));
  return payload;
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