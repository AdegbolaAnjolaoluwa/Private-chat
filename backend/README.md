# Private Chat Backend (Fiber + gorilla/websocket)

This repository provides a modular backend designed to pair with the provided React/TypeScript frontend.

Features
- REST endpoints for auth, users, friends, 1:1 chats and group chats
- WebSocket real-time layer using gorilla/websocket adapted into Fiber
- In-memory store (easy to replace with a DB)
- JWT-based auth (simple secret for demo)

Quick start

1. Install Go (>=1.20)
2. From this folder:

```bash
cd Private-chat/backend
go mod download
go run ./src
```

Server will listen on :4000 by default. WebSocket endpoint: `/ws` (connect with JWT token query param e.g. `?token=...`).

Notes
- This is a demo scaffold. Replace the in-memory store in `internal/store` with a database for production.
- The WebSocket handler uses `github.com/gorilla/websocket` and is mounted with the Fiber adaptor.
