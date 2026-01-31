const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const users = [
  { id: "1", username: "Alice", email: "alice@example.com", password: "alice123", friendCode: "1111-2222-3333" },
  { id: "2", username: "Bob", email: "bob@example.com", password: "bob123", friendCode: "4444-5555-6666" },
];

let friendRequests = []; // { id, fromUserId, toUserId, status: 'pending'|'accepted'|'declined', createdAt }

const groups = [
  { id: "general", name: "General", members: ["1", "2"] },
];

const roomKey = (a, b) => {
  const [x, y] = [String(a), String(b)].sort();
  return `chat:${x}:${y}`;
};

const messages = {}; // { roomKey: Message[] }
const resetTokens = {}; // { token: userId }

// Helper to generate friend code
const generateFriendCode = () => {
  const segment = () => Math.floor(1000 + Math.random() * 9000).toString();
  return `${segment()}-${segment()}-${segment()}`;
};

app.post("/auth/login", (req, res) => {
  const { email, password } = req.body || {};
  const identifier = (email || "").trim().toLowerCase();
  const user = users.find(
    (u) => (u.email.toLowerCase() === identifier || u.username.toLowerCase() === identifier) && u.password === password,
  );
  console.log("Login attempt:", { identifier, ok: !!user });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  res.json({ token: "demo-token", user: { id: user.id, username: user.username, email: user.email, friendCode: user.friendCode } });
});

app.post("/auth/signup", (req, res) => {
  const { email, username, password } = req.body || {};
  console.log("Signup attempt:", { email, username, hasPassword: !!password });
  if (!email || !username || !password) return res.status(400).json({ error: "Missing fields" });
  const exists = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() || u.username.toLowerCase() === username.toLowerCase(),
  );
  if (exists) {
    console.log("Signup failed: User exists", { username });
    return res.status(409).json({ error: "User exists" });
  }
  const id = String(users.length + 1);
  const friendCode = generateFriendCode();
  const user = { id, username, email, password, friendCode };
  users.push(user);
  console.log("Signup success:", { id, username, friendCode });
  res.status(201).json({ token: "demo-token", user: { id, username, email, friendCode } });
});

app.post("/auth/forgot", (req, res) => {
  const { identifier } = req.body || {};
  const key = (identifier || "").trim().toLowerCase();
  const user = users.find((u) => u.email.toLowerCase() === key || u.username.toLowerCase() === key);
  if (!user) return res.status(404).json({ error: "User not found" });
  const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
  resetTokens[token] = user.id;
  console.log("Password reset token:", token, "for user", user.id);
  res.json({ token });
});

app.post("/auth/reset", (req, res) => {
  const { token, password } = req.body || {};
  const userId = resetTokens[token];
  if (!userId) return res.status(400).json({ error: "Invalid token" });
  const user = users.find((u) => u.id === userId);
  if (!user) return res.status(404).json({ error: "User not found" });
  user.password = password;
  delete resetTokens[token];
  res.json({ ok: true });
});

app.delete("/auth/delete", (req, res) => {
  const { userId } = req.body || {};
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  const userIndex = users.findIndex((u) => u.id === userId);
  if (userIndex === -1) return res.status(404).json({ error: "User not found" });

  // Remove user
  users.splice(userIndex, 1);

  // Remove reset tokens
  Object.keys(resetTokens).forEach((token) => {
    if (resetTokens[token] === userId) {
      delete resetTokens[token];
    }
  });

  // Remove friend requests
  friendRequests = friendRequests.filter((r) => r.fromUserId !== userId && r.toUserId !== userId);

  // Remove messages
  Object.keys(messages).forEach((key) => {
    // Check if key is a private chat involving the user
    if (key.startsWith("chat:")) {
      const parts = key.split(":");
      if (parts.includes(userId)) {
        delete messages[key];
      }
    }
  });

  // Remove from groups
  groups.forEach((g) => {
    g.members = g.members.filter((m) => m !== userId);
  });

  console.log(`User ${userId} dissolved.`);
  res.json({ success: true });
});

app.get("/friends", (req, res) => {
  const userId = String(req.query.userId || "");
  
  // Find all accepted relationships involving this user
  const relationships = friendRequests.filter(
    r => r.status === "accepted" && (r.fromUserId === userId || r.toUserId === userId)
  );
  
  const friendIds = relationships.map(r => r.fromUserId === userId ? r.toUserId : r.fromUserId);
  
  const list = users
    .filter((u) => friendIds.includes(u.id))
    .map((u) => ({ 
      id: u.id, 
      username: u.username, 
      email: u.email, 
      friendCode: u.friendCode,
      status: u.id === "1" ? "online" : "offline", 
      lastSeen: u.id === "2" ? "2h ago" : undefined 
    }));
    
  // If no friends yet (and it's Alice or Bob for demo), keep the hardcoded demo friends if friendRequests is empty
  // (Optional: remove this if you want strictly empty list for new users)
  if (friendRequests.length === 0 && (userId === "1" || userId === "2")) {
     const demoList = users
      .filter((u) => u.id !== userId)
      .map((u) => ({ id: u.id, username: u.username, email: u.email, friendCode: u.friendCode, status: "offline" }));
     return res.json(demoList);
  }

  res.json(list);
});

app.get("/friend-requests", (req, res) => {
  const userId = String(req.query.userId || ""); // You'll need to pass userId in query or use token
  // For now, assume userId is passed or we grab all (insecure demo)
  // Better: update api.ts to pass userId or header
  // Let's rely on api.ts passing userId in query for now if possible, or we need to parse it.
  // Actually, api.ts call: `fetch(${BASE}/friend-requests?type=${type})` -> No userId!
  // We need to fix api.ts to send userId or use a header.
  // For this demo, let's assume we can't easily get userId without auth middleware.
  // But wait, in a real app we have a token.
  // Let's check api.ts again.
  // api.ts: getFriendRequests("incoming") -> no user info sent.
  // This is a limitation of the current demo setup. 
  // I'll make a hack: pass userId in query from api.ts, or just return ALL requests for now (bad but works for single user demo).
  // Actually, let's look at `getFriends`: `fetch(${BASE}/friends?userId=...)`.
  // So I should update api.ts to send userId for requests too.
  
  const type = req.query.type;
  // If userId is not provided, we might return nothing or all.
  // Let's try to get it from query if added.
  const uid = req.query.userId;
  
  if (!uid) return res.json([]);

  if (type === "incoming") {
    const list = friendRequests
      .filter(r => r.toUserId === uid && r.status === "pending")
      .map(r => {
        const fromUser = users.find(u => u.id === r.fromUserId);
        return {
          id: r.id,
          fromUser: fromUser ? fromUser.username : "Unknown",
          fromUserId: r.fromUserId,
          toUser: "You",
          status: r.status,
          createdAt: r.createdAt
        };
      });
    return res.json(list);
  } else {
    const list = friendRequests
      .filter(r => r.fromUserId === uid && r.status === "pending")
      .map(r => {
        const toUser = users.find(u => u.id === r.toUserId);
        return {
          id: r.id,
          fromUser: "You",
          fromUserId: uid,
          toUser: toUser ? toUser.username : "Unknown",
          status: r.status,
          createdAt: r.createdAt
        };
      });
    return res.json(list);
  }
});

app.post("/friend-requests", (req, res) => {
  const { toUserIdentifier, fromUserId } = req.body; // Need fromUserId from body
  
  if (!fromUserId) return res.status(401).json({ error: "Unauthorized" });

  const target = users.find(
    u => u.friendCode === toUserIdentifier || u.email === toUserIdentifier || u.username === toUserIdentifier
  );

  if (!target) return res.status(404).json({ error: "User not found" });
  if (target.id === fromUserId) return res.status(400).json({ error: "Cannot add yourself" });

  const existing = friendRequests.find(
    r => (r.fromUserId === fromUserId && r.toUserId === target.id) || 
         (r.fromUserId === target.id && r.toUserId === fromUserId)
  );

  if (existing) {
    if (existing.status === "accepted") return res.status(400).json({ error: "Already friends" });
    if (existing.status === "pending") return res.status(400).json({ error: "Request already pending" });
  }

  const request = {
    id: String(Date.now()),
    fromUserId,
    toUserId: target.id,
    status: "pending",
    createdAt: new Date().toISOString()
  };
  
  friendRequests.push(request);
  res.status(201).json(request);
});

app.post("/friend-requests/:id/accept", (req, res) => {
  const { id } = req.params;
  const reqIdx = friendRequests.findIndex(r => r.id === id);
  if (reqIdx === -1) return res.status(404).json({ error: "Request not found" });
  
  friendRequests[reqIdx].status = "accepted";
  res.json(friendRequests[reqIdx]);
});

app.post("/friend-requests/:id/decline", (req, res) => {
  const { id } = req.params;
  const reqIdx = friendRequests.findIndex(r => r.id === id);
  if (reqIdx === -1) return res.status(404).json({ error: "Request not found" });
  
  friendRequests[reqIdx].status = "declined";
  res.json(friendRequests[reqIdx]);
});


app.get("/groups", (req, res) => {
  const userId = String(req.query.userId || "");
  const list = groups.filter((g) => g.members.includes(userId)).map((g) => ({ id: g.id, name: g.name, members: g.members }));
  res.json(list);
});

// Fetch messages for a pair (requires userId query param)
app.get("/chats/:friendId/messages", (req, res) => {
  const { friendId } = req.params;
  const userId = req.query.userId || "1";
  const key = roomKey(userId, friendId);
  const list = (messages[key] || []).filter((m) => new Date(m.expiresAt).getTime() > Date.now());
  res.json(list);
});

// Send message to a pair (sender is the logged-in user)
app.post("/chats/:friendId/messages", (req, res) => {
  const { friendId } = req.params;
  const { body, sender } = req.body || {};
  if (!sender || !body) return res.status(400).json({ error: "Missing sender or body" });
  const key = roomKey(sender, friendId);
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(new Date(createdAt).getTime() + 2 * 60 * 60 * 1000).toISOString();
  const message = { id: Date.now().toString(), sender, body, createdAt, expiresAt, reactions: [], readBy: [] };
  messages[key] = [ ...(messages[key] || []), message ];
  io.to(key).emit("message:new", { chatId: key, message });
  res.status(201).json(message);
});

// Group messages
app.get("/groups/:groupId/messages", (req, res) => {
  const { groupId } = req.params;
  const key = `group:${groupId}`;
  const list = (messages[key] || []).filter((m) => new Date(m.expiresAt).getTime() > Date.now());
  res.json(list);
});

app.post("/groups/:groupId/messages", (req, res) => {
  const { groupId } = req.params;
  const { body, sender } = req.body || {};
  if (!sender || !body) return res.status(400).json({ error: "Missing sender or body" });
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(new Date(createdAt).getTime() + 2 * 60 * 60 * 1000).toISOString();
  const message = { id: Date.now().toString(), sender, body, createdAt, expiresAt, reactions: [], readBy: [] };
  const key = `group:${groupId}`;
  messages[key] = [ ...(messages[key] || []), message ];
  io.to(key).emit("message:new", { chatId: key, message });
  res.status(201).json(message);
});

app.post("/messages/:id/react", (req, res) => {
  const { emoji, userId } = req.body || {};
  for (const [key, list] of Object.entries(messages)) {
    const m = list.find((x) => x.id === req.params.id);
    if (m) {
      const existing = (m.reactions || []).find((r) => r.userId === userId);
      if (existing) {
        m.reactions = existing.emoji === emoji
          ? (m.reactions || []).filter((r) => r.userId !== userId)
          : (m.reactions || []).map((r) => (r.userId === userId ? { ...r, emoji } : r));
      } else {
        m.reactions = [...(m.reactions || []), { emoji, userId, userName: userId }];
      }
      io.to(key).emit("message:reaction", { messageId: m.id, emoji, userId });
      return res.json(m);
    }
  }
  res.status(404).json({ error: "Message not found" });
});

app.delete("/messages/wipe", (req, res) => {
  const { userId } = req.body || {};
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  let deletedCount = 0;
  
  // Wipe all private chats involving this user
  Object.keys(messages).forEach((key) => {
    if (key.startsWith("chat:")) {
      const parts = key.split(":");
      // Check if user is part of the chat (chat:id1:id2)
      if (parts.includes(userId)) {
        delete messages[key];
        deletedCount++;
      }
    }
  });

  console.log(`Wiped messages for user ${userId}. Chats removed: ${deletedCount}`);
  res.json({ success: true, count: deletedCount });
});

app.post("/messages/:id/read", (req, res) => {
  const { userId } = req.body || {};
  for (const [key, list] of Object.entries(messages)) {
    const m = list.find((x) => x.id === req.params.id);
    if (m) {
      m.readBy = Array.from(new Set([...(m.readBy || []), userId]));
      io.to(key).emit("message:read", { messageId: m.id, userId });
      return res.json(m);
    }
  }
  res.status(404).json({ error: "Message not found" });
});

io.on("connection", (socket) => {
  socket.on("join", ({ userId, friendId }) => {
    socket.join(roomKey(userId, friendId));
  });
  socket.on("group:join", ({ groupId }) => {
    socket.join(`group:${groupId}`);
  });
  socket.on("typing:start", ({ chatId, userName }) => {
    io.to(chatId).emit("typing:start", { chatId, userName });
  });
  socket.on("typing:stop", ({ chatId }) => {
    io.to(chatId).emit("typing:stop", { chatId });
  });
});

server.listen(4000, () => console.log("Server at http://localhost:4000"));