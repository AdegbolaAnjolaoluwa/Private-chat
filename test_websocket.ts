/**
 * WebSocket Test: Simulates two clients connecting and exchanging messages
 * Run with: npx ts-node test_websocket.ts
 * Prerequisites: backend running at localhost:4000, two test users logged in
 */

const BASE_URL = "http://localhost:4000";
const WS_URL = "ws://localhost:4000";

interface User {
  id: string;
  username: string;
  token: string;
}

interface Message {
  type: string;
  body?: string;
  room?: string;
  sender?: string;
  timestamp?: string;
}

class WebSocketClient {
  ws: WebSocket | null = null;
  user: User;
  messages: Message[] = [];
  connected = false;

  constructor(user: User) {
    this.user = user;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = `${WS_URL}/ws?token=${encodeURIComponent(this.user.token)}`;
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.connected = true;
        console.log(`✓ ${this.user.username} connected to WebSocket`);
        resolve();
      };

      this.ws.onmessage = (evt) => {
        const msg = JSON.parse(evt.data);
        this.messages.push(msg);
        console.log(`  [${this.user.username}] received:`, msg);
      };

      this.ws.onerror = (err) => {
        console.error(`✗ ${this.user.username} WebSocket error:`, err);
        reject(err);
      };

      this.ws.onclose = () => {
        this.connected = false;
        console.log(`✓ ${this.user.username} disconnected from WebSocket`);
      };

      setTimeout(() => {
        if (!this.connected) reject(new Error("Connection timeout"));
      }, 5000);
    });
  }

  send(msg: Message): void {
    if (this.ws && this.connected) {
      this.ws.send(JSON.stringify(msg));
      console.log(`  [${this.user.username}] sent:`, msg);
    } else {
      console.error(`✗ ${this.user.username} not connected`);
    }
  }

  close(): void {
    if (this.ws) {
      this.ws.close();
    }
  }
}

async function signup(email: string, username: string, password: string): Promise<User> {
  console.log(`\n>> Signing up: ${username}...`);
  const res = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, username, password }),
  });

  if (!res.ok) {
    throw new Error(`Signup failed for ${username}: ${res.statusText}`);
  }

  const payload = await res.json();
  console.log(`✓ ${username} signed up successfully`);
  return {
    id: payload.user.id,
    username: payload.user.username,
    token: payload.token,
  };
}

async function main() {
  console.log("=== WebSocket Test: Chat Example ===\n");

  try {
    // 1. Create two test users
    const user1 = await signup(
      `user1_${Date.now()}@test.com`,
      `user1_${Date.now()}`,
      "testPassword123"
    );

    const user2 = await signup(
      `user2_${Date.now()}@test.com`,
      `user2_${Date.now()}`,
      "testPassword123"
    );

    // 2. Connect both clients to WebSocket
    console.log(`\n>> Connecting WebSocket clients...`);
    const client1 = new WebSocketClient(user1);
    const client2 = new WebSocketClient(user2);

    await client1.connect();
    await client2.connect();

    // 3. Simulate message exchange (direct messages in a "room")
    console.log(`\n>> Exchanging messages...`);
    const room = `chat_${user1.id}_${user2.id}`;

    // Client 1 sends message
    await new Promise((r) => setTimeout(r, 500));
    client1.send({
      type: "message",
      body: "Hey user2, how are you?",
      room,
      sender: user1.id,
    });

    // Client 2 sends reply
    await new Promise((r) => setTimeout(r, 500));
    client2.send({
      type: "message",
      body: "Hi user1! I'm doing great!",
      room,
      sender: user2.id,
    });

    // Client 1 sends another message
    await new Promise((r) => setTimeout(r, 500));
    client1.send({
      type: "message",
      body: "Awesome! Want to chat more?",
      room,
      sender: user1.id,
    });

    // Wait a bit for messages to be processed
    await new Promise((r) => setTimeout(r, 2000));

    // 4. Report results
    console.log(`\n=== Test Results ===`);
    console.log(`Client 1 (${user1.username}) received ${client1.messages.length} messages`);
    console.log(`Client 2 (${user2.username}) received ${client2.messages.length} messages`);

    if (client1.messages.length > 0 && client2.messages.length > 0) {
      console.log(`✓ WebSocket communication: SUCCESS`);
    } else {
      console.log(
        `✗ WebSocket communication: FAILED (no messages received)`
      );
    }

    // 5. Cleanup
    console.log(`\n>> Disconnecting...`);
    client1.close();
    client2.close();

    console.log(`\n✓ Test completed`);
    process.exit(0);
  } catch (err) {
    console.error(`\n✗ Test failed:`, err);
    process.exit(1);
  }
}

main();
