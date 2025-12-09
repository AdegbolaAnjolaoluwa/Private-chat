const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

app.use(cors());
app.use(express.json());

const users = [
  { id: "1", username: "Alice", email: "alice@example.com", password: "alice123" },
  { id: "2", username: "Bob", email: "bob@example.com", password: "bob123" },
];

const friends = [
  { id: "1", username: "Alice", email: "alice@example.com", status: "online" },
  { id: "2", username: "Bob", email: "bob@example.com", status: "offline", lastSeen: "2h ago" },
];

const groups = [
  { id: "general", name: "General", members: ["1", "2"] },
];

const roomKey = (a, b) => {
  const [x, y] = [String(a), String(b)].sort();
  return `chat:${x}:${y}`;
};

const messages = {}; // { roomKey: Message[] }
const resetTokens = {}; // { token: userId }

app.post("/auth/login", (req, res) => {
  const { email, password } = req.body || {};
  const identifier = (email || "").trim().toLowerCase();
  const user = users.find(
    (u) => (u.email.toLowerCase() === identifier || u.username.toLowerCase() === identifier) && u.password === password,
  );
  console.log("Login attempt:", { identifier, ok: !!user });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  res.json({ token: "demo-token", user: { id: user.id, username: user.username, email: user.email } });
});

app.post("/auth/signup", (req, res) => {
  const { email, username, password } = req.body || {};
  if (!email || !username || !password) return res.status(400).json({ error: "Missing fields" });
  const exists = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() || u.username.toLowerCase() === username.toLowerCase(),
  );
  if (exists) return res.status(409).json({ error: "User exists" });
  const id = String(users.length + 1);
  const user = { id, username, email, password };
  users.push(user);
  res.status(201).json({ token: "demo-token", user: { id, username, email } });
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

app.get("/friends", (req, res) => {
  const userId = String(req.query.userId || "");
  const list = users
    .filter((u) => u.id !== userId)
    .map((u) => ({ id: u.id, username: u.username, email: u.email, status: u.id === "1" ? "online" : "offline", lastSeen: u.id === "2" ? "2h ago" : undefined }));
  res.json(list);
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