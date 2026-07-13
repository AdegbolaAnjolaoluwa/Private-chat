const express = require("express");
const http = require("http");
const crypto = require("crypto");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const { Server } = require("socket.io");
const db = require("./db.cjs");
const { generateRecoveryKey } = db;

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

app.use(cors());
app.use(express.json());

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const MESSAGE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

const roomKey = (a, b) => {
  const [x, y] = [String(a), String(b)].sort();
  return `chat:${x}:${y}`;
};

const generateFriendCode = () => {
  const segment = () => Math.floor(1000 + Math.random() * 9000).toString();
  return `${segment()}-${segment()}-${segment()}`;
};

const publicUser = (u) => ({ id: u.id, username: u.username, email: u.email, friendCode: u.friend_code });

async function createSession(userId) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  await db.query("INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, $3)", [token, userId, expiresAt]);
  return token;
}

async function getSession(token) {
  if (!token) return null;
  const { rows } = await db.query("SELECT * FROM sessions WHERE token = $1", [token]);
  const session = rows[0];
  if (!session) return null;
  if (new Date(session.expires_at).getTime() < Date.now()) {
    await db.query("DELETE FROM sessions WHERE token = $1", [token]);
    return null;
  }
  return session;
}

function asyncRoute(handler) {
  return (req, res, next) => handler(req, res, next).catch(next);
}

function requireAuth(handler) {
  return asyncRoute(async (req, res, next) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    const session = await getSession(token);
    if (!session) return res.status(401).json({ error: "Unauthorized" });
    req.userId = session.user_id;
    return handler(req, res, next);
  });
}

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.post(
  "/auth/login",
  asyncRoute(async (req, res) => {
    const { email, password } = req.body || {};
    const identifier = (email || "").trim().toLowerCase();
    const { rows } = await db.query(
      "SELECT * FROM users WHERE lower(email) = $1 OR lower(username) = $1",
      [identifier],
    );
    const user = rows[0];
    if (!user || !bcrypt.compareSync(password || "", user.password_hash)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = await createSession(user.id);
    res.json({ token, user: publicUser(user) });
  }),
);

app.post(
  "/auth/signup",
  asyncRoute(async (req, res) => {
    const { email, username, password } = req.body || {};
    if (!email || !username || !password) return res.status(400).json({ error: "Missing fields" });
    if (String(password).length < 6) return res.status(400).json({ error: "Password too short" });

    const { rows: existingRows } = await db.query(
      "SELECT 1 FROM users WHERE lower(email) = $1 OR lower(username) = $2",
      [email.toLowerCase(), username.toLowerCase()],
    );
    if (existingRows[0]) return res.status(409).json({ error: "User exists" });

    const id = crypto.randomUUID();
    const friendCode = generateFriendCode();
    const passwordHash = bcrypt.hashSync(password, 10);
    const recoveryKey = generateRecoveryKey();
    const recoveryKeyHash = bcrypt.hashSync(recoveryKey, 10);
    await db.query(
      "INSERT INTO users (id, username, email, password_hash, recovery_key_hash, friend_code) VALUES ($1, $2, $3, $4, $5, $6)",
      [id, username, email, passwordHash, recoveryKeyHash, friendCode],
    );

    const token = await createSession(id);
    // recoveryKey is returned exactly once — the server never stores or displays it again.
    res.status(201).json({ token, recoveryKey, user: { id, username, email, friendCode } });
  }),
);

app.post(
  "/auth/reset",
  asyncRoute(async (req, res) => {
    const { identifier, recoveryKey, newPassword } = req.body || {};
    if (!newPassword || String(newPassword).length < 6) {
      return res.status(400).json({ error: "Password too short" });
    }
    const key = (identifier || "").trim().toLowerCase();
    const { rows } = await db.query(
      "SELECT * FROM users WHERE lower(email) = $1 OR lower(username) = $1",
      [key],
    );
    const user = rows[0];

    if (!user || !bcrypt.compareSync(recoveryKey || "", user.recovery_key_hash)) {
      return res.status(401).json({ error: "Invalid identifier or recovery key" });
    }

    const passwordHash = bcrypt.hashSync(newPassword, 10);
    const newRecoveryKey = generateRecoveryKey();
    const newRecoveryKeyHash = bcrypt.hashSync(newRecoveryKey, 10);
    await db.query("UPDATE users SET password_hash = $1, recovery_key_hash = $2 WHERE id = $3", [
      passwordHash,
      newRecoveryKeyHash,
      user.id,
    ]);
    await db.query("DELETE FROM sessions WHERE user_id = $1", [user.id]);

    // newRecoveryKey is returned exactly once, same as at signup — the old key is now permanently invalid.
    res.json({ ok: true, recoveryKey: newRecoveryKey });
  }),
);

app.delete(
  "/auth/delete",
  requireAuth(async (req, res) => {
    const { password } = req.body || {};
    const { rows } = await db.query("SELECT * FROM users WHERE id = $1", [req.userId]);
    const user = rows[0];
    if (!user || !bcrypt.compareSync(password || "", user.password_hash)) {
      return res.status(401).json({ error: "Incorrect password" });
    }
    await db.query("DELETE FROM users WHERE id = $1", [req.userId]); // cascades sessions, friend_requests, group_members, messages, reactions, reads
    console.log(`User ${req.userId} dissolved.`);
    res.json({ success: true });
  }),
);

app.get(
  "/friends",
  requireAuth(async (req, res) => {
    const userId = req.userId;
    const { rows: relationships } = await db.query(
      "SELECT * FROM friend_requests WHERE status = 'accepted' AND (from_user_id = $1 OR to_user_id = $1)",
      [userId],
    );

    const friendIds = relationships.map((r) => (r.from_user_id === userId ? r.to_user_id : r.from_user_id));
    if (friendIds.length === 0) return res.json([]);

    const { rows } = await db.query("SELECT * FROM users WHERE id = ANY($1)", [friendIds]);
    const list = rows.map((u) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      friendCode: u.friend_code,
      status: "offline",
    }));

    res.json(list);
  }),
);

app.get(
  "/friend-requests",
  requireAuth(async (req, res) => {
    const type = req.query.type;
    const uid = req.userId;

    if (type === "incoming") {
      const { rows } = await db.query(
        "SELECT * FROM friend_requests WHERE to_user_id = $1 AND status = 'pending'",
        [uid],
      );
      const list = await Promise.all(
        rows.map(async (r) => {
          const { rows: fromRows } = await db.query("SELECT username FROM users WHERE id = $1", [r.from_user_id]);
          return {
            id: r.id,
            fromUser: fromRows[0] ? fromRows[0].username : "Unknown",
            fromUserId: r.from_user_id,
            toUser: "You",
            status: r.status,
            createdAt: r.created_at,
          };
        }),
      );
      return res.json(list);
    }

    const { rows } = await db.query(
      "SELECT * FROM friend_requests WHERE from_user_id = $1 AND status = 'pending'",
      [uid],
    );
    const list = await Promise.all(
      rows.map(async (r) => {
        const { rows: toRows } = await db.query("SELECT username FROM users WHERE id = $1", [r.to_user_id]);
        return {
          id: r.id,
          fromUser: "You",
          fromUserId: uid,
          toUser: toRows[0] ? toRows[0].username : "Unknown",
          status: r.status,
          createdAt: r.created_at,
        };
      }),
    );
    res.json(list);
  }),
);

app.post(
  "/friend-requests",
  requireAuth(async (req, res) => {
    const { toUserIdentifier } = req.body || {};
    const fromUserId = req.userId;

    const { rows: targetRows } = await db.query(
      "SELECT * FROM users WHERE friend_code = $1 OR email = $1 OR username = $1",
      [toUserIdentifier],
    );
    const target = targetRows[0];

    if (!target) return res.status(404).json({ error: "User not found" });
    if (target.id === fromUserId) return res.status(400).json({ error: "Cannot add yourself" });

    const { rows: existingRows } = await db.query(
      "SELECT * FROM friend_requests WHERE (from_user_id = $1 AND to_user_id = $2) OR (from_user_id = $2 AND to_user_id = $1)",
      [fromUserId, target.id],
    );
    const existing = existingRows[0];

    if (existing) {
      if (existing.status === "accepted") return res.status(400).json({ error: "Already friends" });
      if (existing.status === "pending") return res.status(400).json({ error: "Request already pending" });
    }

    const request = {
      id: crypto.randomUUID(),
      fromUserId,
      toUserId: target.id,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    await db.query(
      "INSERT INTO friend_requests (id, from_user_id, to_user_id, status, created_at) VALUES ($1, $2, $3, $4, $5)",
      [request.id, request.fromUserId, request.toUserId, request.status, request.createdAt],
    );

    res.status(201).json(request);
  }),
);

app.post(
  "/friend-requests/:id/accept",
  requireAuth(async (req, res) => {
    const { id } = req.params;
    const { rows } = await db.query("SELECT * FROM friend_requests WHERE id = $1", [id]);
    const request = rows[0];
    if (!request) return res.status(404).json({ error: "Request not found" });
    if (request.to_user_id !== req.userId) return res.status(403).json({ error: "Forbidden" });

    await db.query("UPDATE friend_requests SET status = 'accepted' WHERE id = $1", [id]);
    res.json({ ...request, status: "accepted" });
  }),
);

app.post(
  "/friend-requests/:id/decline",
  requireAuth(async (req, res) => {
    const { id } = req.params;
    const { rows } = await db.query("SELECT * FROM friend_requests WHERE id = $1", [id]);
    const request = rows[0];
    if (!request) return res.status(404).json({ error: "Request not found" });
    if (request.to_user_id !== req.userId) return res.status(403).json({ error: "Forbidden" });

    await db.query("UPDATE friend_requests SET status = 'declined' WHERE id = $1", [id]);
    res.json({ ...request, status: "declined" });
  }),
);

app.get(
  "/groups",
  requireAuth(async (req, res) => {
    const { rows } = await db.query(
      `SELECT g.id, g.name FROM groups g
       JOIN group_members gm ON gm.group_id = g.id
       WHERE gm.user_id = $1`,
      [req.userId],
    );
    const list = await Promise.all(
      rows.map(async (g) => {
        const { rows: memberRows } = await db.query("SELECT user_id FROM group_members WHERE group_id = $1", [g.id]);
        return { id: g.id, name: g.name, members: memberRows.map((m) => m.user_id) };
      }),
    );
    res.json(list);
  }),
);

async function assertGroupMember(groupId, userId) {
  const { rows } = await db.query("SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2", [
    groupId,
    userId,
  ]);
  return !!rows[0];
}

async function assertChatParticipant(friendId) {
  // Any authenticated user can message another existing user directly (no separate ACL beyond identity).
  const { rows } = await db.query("SELECT 1 FROM users WHERE id = $1", [friendId]);
  return !!rows[0];
}

async function rowToMessage(m) {
  const { rows: reactionRows } = await db.query(
    "SELECT user_id AS \"userId\", emoji FROM message_reactions WHERE message_id = $1",
    [m.id],
  );
  const reactions = reactionRows.map((r) => ({ ...r, userName: r.userId }));
  const { rows: readRows } = await db.query("SELECT user_id FROM message_reads WHERE message_id = $1", [m.id]);
  return {
    id: m.id,
    sender: m.sender_id,
    body: m.body,
    createdAt: m.created_at,
    expiresAt: m.expires_at,
    reactions,
    readBy: readRows.map((r) => r.user_id),
  };
}

app.get(
  "/chats/:friendId/messages",
  requireAuth(async (req, res) => {
    const { friendId } = req.params;
    const key = roomKey(req.userId, friendId);
    const { rows } = await db.query("SELECT * FROM messages WHERE room_key = $1 AND expires_at > NOW()", [key]);
    res.json(await Promise.all(rows.map(rowToMessage)));
  }),
);

app.post(
  "/chats/:friendId/messages",
  requireAuth(async (req, res) => {
    const { friendId } = req.params;
    const { body } = req.body || {};
    if (!body) return res.status(400).json({ error: "Missing body" });
    if (!(await assertChatParticipant(friendId))) return res.status(404).json({ error: "User not found" });

    const key = roomKey(req.userId, friendId);
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + MESSAGE_TTL_MS).toISOString();
    await db.query(
      "INSERT INTO messages (id, room_key, sender_id, body, created_at, expires_at) VALUES ($1, $2, $3, $4, $5, $6)",
      [id, key, req.userId, body, createdAt, expiresAt],
    );

    const message = await rowToMessage({ id, sender_id: req.userId, body, created_at: createdAt, expires_at: expiresAt });
    io.to(key).emit("message:new", { chatId: key, message });
    res.status(201).json(message);
  }),
);

app.get(
  "/groups/:groupId/messages",
  requireAuth(async (req, res) => {
    const { groupId } = req.params;
    if (!(await assertGroupMember(groupId, req.userId))) return res.status(403).json({ error: "Forbidden" });
    const key = `group:${groupId}`;
    const { rows } = await db.query("SELECT * FROM messages WHERE room_key = $1 AND expires_at > NOW()", [key]);
    res.json(await Promise.all(rows.map(rowToMessage)));
  }),
);

app.post(
  "/groups/:groupId/messages",
  requireAuth(async (req, res) => {
    const { groupId } = req.params;
    const { body } = req.body || {};
    if (!body) return res.status(400).json({ error: "Missing body" });
    if (!(await assertGroupMember(groupId, req.userId))) return res.status(403).json({ error: "Forbidden" });

    const key = `group:${groupId}`;
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + MESSAGE_TTL_MS).toISOString();
    await db.query(
      "INSERT INTO messages (id, room_key, sender_id, body, created_at, expires_at) VALUES ($1, $2, $3, $4, $5, $6)",
      [id, key, req.userId, body, createdAt, expiresAt],
    );

    const message = await rowToMessage({ id, sender_id: req.userId, body, created_at: createdAt, expires_at: expiresAt });
    io.to(key).emit("message:new", { chatId: key, message });
    res.status(201).json(message);
  }),
);

app.post(
  "/messages/:id/react",
  requireAuth(async (req, res) => {
    const { emoji } = req.body || {};
    const userId = req.userId;
    const { rows: messageRows } = await db.query("SELECT * FROM messages WHERE id = $1", [req.params.id]);
    const message = messageRows[0];
    if (!message) return res.status(404).json({ error: "Message not found" });

    const { rows: existingRows } = await db.query(
      "SELECT * FROM message_reactions WHERE message_id = $1 AND user_id = $2",
      [message.id, userId],
    );
    const existing = existingRows[0];
    if (existing) {
      if (existing.emoji === emoji) {
        await db.query("DELETE FROM message_reactions WHERE message_id = $1 AND user_id = $2", [message.id, userId]);
      } else {
        await db.query("UPDATE message_reactions SET emoji = $1 WHERE message_id = $2 AND user_id = $3", [
          emoji,
          message.id,
          userId,
        ]);
      }
    } else {
      await db.query("INSERT INTO message_reactions (message_id, user_id, emoji) VALUES ($1, $2, $3)", [
        message.id,
        userId,
        emoji,
      ]);
    }

    const result = await rowToMessage(message);
    io.to(message.room_key).emit("message:reaction", { messageId: message.id, emoji, userId });
    res.json(result);
  }),
);

app.delete(
  "/messages/wipe",
  requireAuth(async (req, res) => {
    const { password } = req.body || {};
    const { rows: userRows } = await db.query("SELECT * FROM users WHERE id = $1", [req.userId]);
    const user = userRows[0];
    if (!user || !bcrypt.compareSync(password || "", user.password_hash)) {
      return res.status(401).json({ error: "Incorrect password" });
    }

    const { rows: roomRows } = await db.query(
      "SELECT DISTINCT room_key FROM messages WHERE room_key LIKE 'chat:%'",
    );
    const rooms = roomRows.map((r) => r.room_key).filter((key) => key.split(":").includes(req.userId));

    await db.withTransaction(async (client) => {
      for (const key of rooms) {
        await client.query("DELETE FROM messages WHERE room_key = $1", [key]);
      }
    });

    console.log(`Wiped messages for user ${req.userId}. Chats removed: ${rooms.length}`);
    res.json({ success: true, count: rooms.length });
  }),
);

app.post(
  "/messages/:id/read",
  requireAuth(async (req, res) => {
    const { rows: messageRows } = await db.query("SELECT * FROM messages WHERE id = $1", [req.params.id]);
    const message = messageRows[0];
    if (!message) return res.status(404).json({ error: "Message not found" });

    await db.query("INSERT INTO message_reads (message_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [
      message.id,
      req.userId,
    ]);

    const result = await rowToMessage(message);
    io.to(message.room_key).emit("message:read", { messageId: message.id, userId: req.userId });
    res.json(result);
  }),
);

// Error handler for asyncRoute-wrapped handlers.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

io.use(async (socket, next) => {
  const token = socket.handshake.query?.token;
  const session = await getSession(typeof token === "string" ? token : undefined);
  if (!session) return next(new Error("Unauthorized"));
  socket.userId = session.user_id;
  next();
});

io.on("connection", (socket) => {
  socket.on("join", ({ friendId }) => {
    socket.join(roomKey(socket.userId, friendId));
  });
  socket.on("group:join", async ({ groupId }) => {
    if (!(await assertGroupMember(groupId, socket.userId))) return;
    socket.join(`group:${groupId}`);
  });
  socket.on("typing:start", ({ chatId, userName }) => {
    io.to(chatId).emit("typing:start", { chatId, userName });
  });
  socket.on("typing:stop", ({ chatId }) => {
    io.to(chatId).emit("typing:stop", { chatId });
  });
});

const PORT = process.env.PORT || 4000;

db.init()
  .then(() => {
    server.listen(PORT, () => console.log(`Server at http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  });
