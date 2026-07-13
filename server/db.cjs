const crypto = require("crypto");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("localhost")
    ? { rejectUnauthorized: false }
    : false,
});

const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    recovery_key_hash TEXT NOT NULL,
    friend_code TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
  );

  CREATE TABLE IF NOT EXISTS friend_requests (
    id TEXT PRIMARY KEY,
    from_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS group_members (
    group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (group_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    room_key TEXT NOT NULL,
    sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_messages_room_key ON messages(room_key);

  CREATE TABLE IF NOT EXISTS message_reactions (
    message_id TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    PRIMARY KEY (message_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS message_reads (
    message_id TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (message_id, user_id)
  );
`;

function generateRecoveryKey() {
  // Higher entropy than the friend code (which is meant to be shared) since this is a password-reset secret.
  const hex = crypto.randomBytes(20).toString("hex").toUpperCase();
  return hex.match(/.{1,5}/g).join("-");
}

async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function seedIfEmpty() {
  const { rows } = await pool.query("SELECT COUNT(*)::int AS n FROM users");
  if (rows[0].n > 0) return;

  const seedUsers = [
    { id: "1", username: "Alice", email: "alice@example.com", password: "alice123", friendCode: "1111-2222-3333" },
    { id: "2", username: "Bob", email: "bob@example.com", password: "bob123", friendCode: "4444-5555-6666" },
  ];

  await withTransaction(async (client) => {
    for (const u of seedUsers) {
      const recoveryKey = generateRecoveryKey();
      await client.query(
        "INSERT INTO users (id, username, email, password_hash, recovery_key_hash, friend_code) VALUES ($1, $2, $3, $4, $5, $6)",
        [u.id, u.username, u.email, bcrypt.hashSync(u.password, 10), bcrypt.hashSync(recoveryKey, 10), u.friendCode],
      );
      console.log(`Recovery key for seed user ${u.username}: ${recoveryKey}`);
    }
    await client.query("INSERT INTO groups (id, name) VALUES ($1, $2)", ["general", "General"]);
    await client.query("INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)", ["general", "1"]);
    await client.query("INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)", ["general", "2"]);
  });

  console.log("Seeded demo users (Alice/Bob) with hashed passwords.");
}

async function init() {
  await pool.query(SCHEMA_SQL);
  await seedIfEmpty();
}

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
  withTransaction,
  init,
  generateRecoveryKey,
};
