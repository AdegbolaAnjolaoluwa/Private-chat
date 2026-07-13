const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return envUrl;
  if (typeof window !== "undefined") {
    return `http://${window.location.hostname}:4000`;
  }
  return "http://localhost:4000";
};

const BASE = getBaseUrl();

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function authedFetch(path: string, init: RequestInit = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { ...authHeaders(), ...(init.headers || {}) },
  });
  return res;
}

export async function getFriends() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await authedFetch(`/friends`, { signal: controller.signal });
    if (!res.ok) throw new Error(`Failed to load friends (${res.status})`);
    return res.json();
  } finally {
    clearTimeout(timeout);
  }
}

export async function getGroups() {
  const res = await authedFetch(`/groups`);
  return res.json();
}

export async function getGroupMessages(groupId: string) {
  const res = await authedFetch(`/groups/${groupId}/messages`);
  return res.json();
}

export async function sendGroupMessage(groupId: string, body: string) {
  const res = await authedFetch(`/groups/${groupId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body }),
  });
  return res.json();
}

export async function getFriendRequests(type: "incoming" | "outgoing") {
  const res = await authedFetch(`/friend-requests?type=${type}`);
  return res.json();
}

export async function sendFriendRequest(toUserIdentifier: string) {
  const res = await authedFetch(`/friend-requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ toUserIdentifier }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to send request");
  }
  return res.json();
}

export async function acceptFriendRequest(id: string) {
  const res = await authedFetch(`/friend-requests/${id}/accept`, { method: "POST" });
  return res.json();
}

export async function declineFriendRequest(id: string) {
  const res = await authedFetch(`/friend-requests/${id}/decline`, { method: "POST" });
  return res.json();
}

export async function getMessages(friendId: string) {
  const res = await authedFetch(`/chats/${friendId}/messages`);
  return res.json();
}

export async function sendMessage(friendId: string, body: string) {
  const res = await authedFetch(`/chats/${friendId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body }),
  });
  return res.json();
}

export async function reactToMessage(messageId: string, emoji: string) {
  const res = await authedFetch(`/messages/${messageId}/react`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ emoji }),
  });
  return res.json();
}

export async function markMessageRead(messageId: string) {
  const res = await authedFetch(`/messages/${messageId}/read`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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

export async function resetPassword(identifier: string, recoveryKey: string, newPassword: string) {
  const res = await fetch(`${BASE}/auth/reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, recoveryKey, newPassword }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Reset failed");
  }
  return res.json();
}

export async function deleteAccount(password: string) {
  const res = await authedFetch(`/auth/delete`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Deletion failed");
  }
  return res.json();
}

export async function wipeAllMessages(password: string) {
  const res = await authedFetch(`/messages/wipe`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Wipe failed");
  }
  return res.json();
}
