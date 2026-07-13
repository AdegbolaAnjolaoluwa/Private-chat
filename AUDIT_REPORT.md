# Private-Chat — Code Audit Report

Audited: 2026-07-13
Scope: full repo, read-only (no code modified)

---

## 1. Executive Summary

Private-Chat is a working prototype: a Vite/React/TypeScript frontend talking to a single-file Express + Socket.io backend with no database (in-memory arrays, wiped on restart). It runs and builds cleanly, and the core chat/friends/reactions/read-receipts flow functions. However, the backend has **no real authentication** — login returns a hardcoded `"demo-token"` regardless of the user, and every state-changing route (friends, messages, delete-account, wipe-messages, password reset) trusts a `userId` supplied directly in the request body or query string with no verification the caller owns that identity. Combined with wide-open CORS (`origin: "*"` on both Socket.io and Express) and plaintext password storage/comparison, this backend is trivially exploitable by anyone who can reach it — any client can impersonate any user, read anyone's messages, or delete anyone's account. The password-reset flow is also functionally broken: the `/reset` route renders a component that is byte-for-byte identical to the "forgot password" component, so users can never actually set a new password through the UI. None of this is surprising or alarming for a personal learning project — it's exactly what an unauthenticated in-memory demo backend looks like — but it is unambiguously not deployable as-is even for a small trusted group, let alone the public internet. Dependency scanning shows 20 known vulnerabilities (9 high) in the current lockfile, and the repo ships both `bun.lockb` and `package-lock.json`, which is a real inconsistency that will eventually cause a "works on my machine" dependency drift bug.

---

## 2. Architecture Overview

- **Frontend**: Vite 7 + React 18 + TypeScript, shadcn/ui (Radix) + Tailwind, React Router, TanStack Query. Entry `src/main.tsx` → `src/App.tsx`. Pages under `src/pages/`. REST calls centralized in `src/lib/api.ts` (raw `fetch`, base URL derived from `window.location.hostname` + port 4000). Realtime via `src/lib/socket.ts` wrapping `socket.io-client`.
- **Backend**: single file `server/index.cjs` (396 lines), Express 5 + Socket.io 4, listens on port 4000. No database — `users`, `friendRequests`, `groups`, `messages`, `resetTokens` are plain JS arrays/objects in process memory; all data is lost on restart.
- **Auth model**: none in the real sense. `/auth/login` and `/auth/signup` both always return the literal string `"demo-token"` as the token (`server/index.cjs:50`, `:69`). No JWT, no session, no cookie. The frontend stores the "token" and the full user object (including `id`) in `localStorage` and then sends `authUser.id` as a plain, unauthenticated parameter on every subsequent request.
- **Infra**: no Dockerfile, docker-compose, Kubernetes manifests, or CI/CD config found anywhere in the repo (verified — no `.github/` directory, no `Dockerfile*`, `docker-compose*`, or `*.yml`/`*.yaml` at any level outside `node_modules`). Not applicable — nothing to audit here.
- **Persistence**: none — not applicable, no DB/schema/migrations to review.

---

## 3. Security Findings

### 3.1 — Critical: No real authentication; login always issues the same static token
**File**: `server/index.cjs:50`, `server/index.cjs:69`
```js
res.json({ token: "demo-token", user: { id: user.id, ... } });
```
Every successful login or signup returns the exact same hardcoded token `"demo-token"`, and no route ever validates that token (grep confirms `"demo-token"` is never checked anywhere in `server/index.cjs`). The token is purely decorative.
**Exploit**: An attacker doesn't even need the token — every downstream route (friends, messages, delete, wipe, reactions, read-receipts) takes a raw `userId` from the request body/query with no check that it matches an authenticated session, because there *is* no session. Anyone who knows or guesses another user's `id` (which are sequential integers: `"1"`, `"2"`, `"3"`...) can act as them.
**Fix**: Issue a real signed token (JWT or opaque session id) on login, store server-side session/user mapping, and require an `Authorization` header on every protected route; derive `userId` server-side from that token, never trust a client-supplied `userId`.

### 3.2 — Critical: IDOR on every user-scoped route (friends, messages, delete, wipe)
**Files/lines**:
- `server/index.cjs:134-135` `/friends?userId=` — returns any user's friend list to whoever passes that id.
- `server/index.cjs:167-186` `/friend-requests?userId=` — same, and the code's own inline comments (`server/index.cjs:167-181`) acknowledge this is a hack ("insecure demo").
- `server/index.cjs:283-289` `GET /chats/:friendId/messages?userId=` — returns the full message history between any two users to anyone who supplies both ids.
- `server/index.cjs:292-303` `POST /chats/:friendId/messages` — `sender` comes from the request body; anyone can send messages as any user.
- `server/index.cjs:94-132` `DELETE /auth/delete` — deletes **any** account given only `{ userId }` in the body, no password/token check at all.
- `server/index.cjs:346-366` `DELETE /messages/wipe` — wipes **any** user's entire message history given only `{ userId }`.
- `server/index.cjs:326-344` `/messages/:id/react` and `server/index.cjs:368-379` `/messages/:id/read` — `userId` in body, unauthenticated, can forge reactions/read-receipts as anyone.

**Exploit scenario**: `curl -X DELETE http://<host>:4000/auth/delete -H "Content-Type: application/json" -d '{"userId":"1"}'` deletes Alice's account from any machine that can reach the server — no login, no token, nothing. Similarly `curl "http://<host>:4000/chats/2/messages?userId=1"` reads Alice-Bob's private conversation from an unauthenticated client.
**Fix**: Same root cause as 3.1 — derive the authenticated user server-side from a verified session/token; reject any request where the resource owner doesn't match the authenticated identity.

### 3.3 — Critical: Plaintext password storage and comparison
**File**: `server/index.cjs:18-19` (seed data), `server/index.cjs:46` (login comparison), `server/index.cjs:66` (signup storage), `server/index.cjs:89` (reset storage)
```js
{ id: "1", username: "Alice", ..., password: "alice123" }
...
(u) => (... ) && u.password === password
...
const user = { id, username, email, password, friendCode }; // stored as-is
```
No hashing library (bcrypt/argon2/scrypt) is imported or used anywhere in `server/index.cjs`. Passwords are stored and compared as plain strings.
**Exploit**: Any memory dump, log line, or future DB migration that copies this data verbatim exposes every user's real password (not just a hash). `server/index.cjs:48` also logs `identifier` on every login attempt (not the password itself, but confirms verbose logging habits).
**Fix**: Hash passwords with bcrypt/argon2 at signup, compare with a constant-time hash verification at login, never store or log raw passwords.

### 3.4 — High: Wide-open CORS on both HTTP and WebSocket
**File**: `server/index.cjs:8` (`new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } })`) and `server/index.cjs:10` (`app.use(cors())`, which defaults to `Access-Control-Allow-Origin: *`).
**Exploit**: Any website the victim visits can script `fetch()`/XHR calls directly to `http://<victim-lan-ip>:4000/...` (or a public deployment) and read/write chat data cross-origin, since there is no origin allowlist and, per 3.1/3.2, no auth to fall back on anyway.
**Fix**: Restrict `origin` to the known frontend origin(s) via an explicit allowlist; this matters more once real auth/cookies are added (credentialed CORS must not use `*`).

### 3.5 — High: Password reset is exploitable and also functionally broken
**Files**: `server/index.cjs:72-92`, `src/pages/ResetPasswordForm.tsx`, `src/pages/ForgotPassword.tsx`
- `POST /auth/forgot` (`server/index.cjs:72-81`) issues a reset token using `Math.random().toString(36)` — not cryptographically secure — and **returns the token directly in the API response** (`res.json({ token })`, line 80) instead of emailing it. Any client can request a password reset for any known email/username and receive the token needed to take over that account immediately, with zero proof of email ownership.
- `POST /auth/reset` (`server/index.cjs:83-92`) accepts `{ token, password }` and sets the new password with no rate limiting or token expiry (`resetTokens` entries never expire on their own, only on use).
- **Functional bug**: `src/pages/ResetPasswordForm.tsx` is byte-for-byte identical to `src/pages/ForgotPassword.tsx` (verified via `md5` — both hash to `9ee0d2f5b062cea94e57263d6bbc73f7`, and `diff` shows zero differences). It is routed at `/reset` (`src/App.tsx:58`) but its form only asks for an identifier and calls `requestPasswordReset()` again — it never reads the `token` query param, never shows a "new password" field, and never calls the real `resetPassword()` function exported from `src/lib/api.ts:142-150`. **Users can never actually complete a password reset through the UI**; the backend capability exists but the frontend page for it was never built (a copy-paste placeholder was left in its place).
**Exploit**: Account takeover — `POST /auth/forgot {identifier: "alice"}` returns a usable reset token in the HTTP response body itself; attacker immediately `POST /auth/reset` with that token and a new password of their choosing.
**Fix**: Never return the token in the API response — deliver it out-of-band (email). Add expiry to reset tokens. Build the actual reset-password form (token + new password + confirm fields) and wire it to `resetPassword()`.

### 3.6 — Medium: Sensitive data in `localStorage`, no XSS-hardening in place to protect it
**File**: `src/pages/Login.tsx:35-36`, `src/pages/Chat.tsx:19`, `src/lib/api.ts` (all functions read `localStorage.getItem("authUser")`)
The "token" and full user object (id, username, email, friendCode) are stored in plain `localStorage`, readable by any JS running on the page. Given there's no meaningful token to steal here (3.1), the immediate impact is low, but this is the pattern that becomes a real vulnerability the moment real auth is added — `localStorage` is readable by any injected script (no XSS sink was found in message rendering — see below — but this is still worth flagging as a pattern to fix before real tokens are introduced).
**Fix**: When real auth is added, prefer an httpOnly, Secure, SameSite cookie for the session token rather than localStorage.

### 3.7 — Low/Informational: No XSS in chat message rendering (verified clean)
**File**: `src/components/chat/MessageBubble.tsx:61-63`
Message bodies are rendered as `{message.body}` inside JSX (`<div className="...">{message.body}</div>`), which React escapes by default — confirmed no `dangerouslySetInnerHTML` is used for message content anywhere in `src/components/chat/`. The only `dangerouslySetInnerHTML` in the whole `src/` tree is in `src/components/ui/chart.tsx:70`, which is unrelated shadcn/recharts boilerplate that injects a `<style>` block built from static config keys, not user input — low risk, but worth a future look if chart config ever becomes user-controlled.

### 3.8 — Low: No rate limiting or security headers
**File**: `server/index.cjs` (entire file)
No `express-rate-limit`, no `helmet`, no request size limits beyond Express defaults. Combined with the IDOR issues above, this means brute-forcing user ids, emails, or reset tokens is unthrottled.
**Fix**: Add `helmet()` and basic rate limiting once auth is real (rate limiting alone doesn't fix the authz gap).

### 3.9 — Informational: Verbose logging of auth attempts
**File**: `server/index.cjs:48, 55, 61, 68, 79`
Login/signup attempts, identifiers, and reset tokens are logged to stdout (`console.log("Password reset token:", token, ...)` at line 79 logs the live reset token). Not a password leak, but reset-token logging compounds finding 3.5 if logs are ever shared/exposed.

---

## 4. Dependency & Build Findings

**Lockfile inconsistency (confirmed)**: both `bun.lockb` (201 KB) and `package-lock.json` (273 KB) are committed at repo root. `package.json` has no `packageManager` field pinning one or the other. This is a real risk — two contributors using different package managers can silently diverge on resolved versions since Bun and npm don't guarantee identical resolution. Recommend picking one (repo has an npm scripts-only workflow, `npm install` was used successfully for this audit) and deleting the other lockfile.

**`npm install`**: succeeded cleanly — 525 packages installed, 8s.

**`npm audit`** (against `package-lock.json`): **20 vulnerabilities — 11 moderate, 9 high**. All findings are in transitive dependencies (build tooling: `vite`, `rollup`, `eslint`'s glob/minimatch chain — and `socket.io`'s `ws`/`engine.io` chain, plus `react-router`). Notable high-severity ones actually reachable at runtime (not just dev-time):
- `ws` 8.0.0–8.20.1 (via `socket.io` → `engine.io`/`socket.io-adapter`) — uninitialized memory disclosure + memory-exhaustion DoS (GHSA-58qx-3vcg-4xpx, GHSA-96hv-2xvq-fx4p).
- `socket.io-parser` 4.0.0–4.2.5 — unbounded binary attachments (GHSA-677m-j7p3-52f9).
- `react-router`/`react-router-dom` 6.7.0–6.30.3 — open redirect via protocol-relative `//` path (GHSA-2j2x-hqr9-3h42).
- `path-to-regexp` 8.0.0–8.3.0 — ReDoS (used by Express 5's router internally).
Remaining high/moderate findings (`vite`, `rollup`, `esbuild`/`picomatch`, `minimatch`, `flatted`, `lodash`, `postcss`, `qs`, `js-yaml`, `yaml`, `ajv`, `brace-expansion`) are dev-time/build-tool-only exposure (not shipped to the browser bundle) and lower real-world risk for this project, but `npm audit fix` was not run (read-only audit) — recommend running it and re-testing the build afterward.

**`npm run build`** (`vite build`): **succeeded**. Output:
```
✓ 1785 modules transformed.
dist/index.html                   1.17 kB │ gzip:   0.50 kB
dist/assets/index-DvVbEMnF.css   89.76 kB │ gzip:  14.35 kB
dist/assets/index-j--4LDr6.js   562.82 kB │ gzip: 170.46 kB
✓ built in 1.72s
```
Warnings (non-fatal): main JS chunk is 562.82 kB (170 kB gzipped), above Vite's 500 kB default warning threshold — no code-splitting/dynamic imports in use. Also `caniuse-lite`/browserslist data is 7 months stale (cosmetic) and `/noise.png` reference couldn't be resolved at build time (a background asset referenced by absolute path/CSS that only resolves at runtime — worth a quick manual check that it renders correctly in `dist/`).

**`npx tsc --noEmit`**: **passed with zero output** — no type errors anywhere in the project.

**`npm run lint`** (ESLint via `eslint .`): **5 errors, 10 warnings**. Real findings:
- `src/components/chat/ChatLayout.tsx:10` — `Unexpected any`.
- `src/components/chat/MessageInput.tsx:104` — `Unexpected any`.
- `src/pages/Chat.tsx:124` — empty catch block (`no-empty`) — swallows the error from `markMessageRead` silently (see Bugs section).
- `src/pages/GroupChat.tsx:40` — `Unexpected any` (in `getGroups().then((gs: any[]) => ...)`).
- `src/pages/GroupChat.tsx:100` — empty catch block, same pattern as Chat.tsx.
- 10 warnings are mostly shadcn boilerplate (`react-refresh/only-export-components` on `badge.tsx`, `button.tsx`, `form.tsx`, `navigation-menu.tsx`, `sidebar.tsx`, `sonner.tsx`, `toggle.tsx` — expected/harmless for shadcn's file structure) plus two `react-hooks/exhaustive-deps` warnings on `Chat.tsx:24` and `GroupChat.tsx:25,37` for missing `currentUserId`/`queryClient` deps — see Bugs section, these are not purely cosmetic here.

---

## 5. Bugs Found

### 5.1 — Password reset form is a non-functional duplicate (confirmed via diff, see 3.5)
**Repro**: Go to `/forgot`, submit an identifier, get redirected to `/reset?token=...`. The page rendered at `/reset` is `ResetPasswordForm.tsx`, which is identical to `ForgotPassword.tsx` — it shows "Forgot password" copy again, asks for an identifier (not a new password), and on submit calls `requestPasswordReset()` again instead of `resetPassword(token, password)`.
**Root cause**: `src/pages/ResetPasswordForm.tsx` was never actually implemented; the file content is a leftover copy of `ForgotPassword.tsx`. `src/lib/api.ts:142-150` already exports a correct `resetPassword(token, password)` function that is never called anywhere in `src/` (grep confirms zero call sites for `resetPassword` outside its own definition).
**Fix**: Rewrite `ResetPasswordForm.tsx` to read `token` from the URL query string, present a new-password (+confirm) field, and call `resetPassword(token, password)`.

### 5.2 — Stale closure / missing dependency causes `typing:start`/`typing:stop` and read-receipt handlers to use stale `currentUserId`
**File**: `src/pages/Chat.tsx:22-24` and `:26-58`
```js
useEffect(() => {
  initSocket(currentUserId);
}, []);   // currentUserId intentionally omitted — ESLint flags this (lint output, Chat.tsx:24)
```
`currentUserId` is derived fresh on every render from `localStorage` (`src/pages/Chat.tsx:19-20`) but is not a `useState`/`useMemo`-stable value, and the socket-listener effect at `src/pages/Chat.tsx:26-58` closes over `currentUserId` without listing it in its dependency array either. In practice this is low-impact today because `currentUserId` doesn't change within a mounted session, but it's a latent bug: if the user's identity ever changes without a full remount (e.g. multi-account switch, or a future "switch user" feature), the socket listeners registered in this effect will keep referencing the old `currentUserId` inside `typingDisplay`'s comparison (`src/pages/Chat.tsx:112`) and the read-receipt loop (`src/pages/Chat.tsx:114-129`), producing read receipts / typing indicators attributed to the wrong user. ESLint's `react-hooks/exhaustive-deps` warning on line 24 is the correct signal here, not noise.
**Fix**: Include `currentUserId` in both effects' dependency arrays, or derive it via `useMemo`/a proper auth context so identity changes correctly re-trigger listener re-registration.

### 5.3 — Duplicate/near-duplicate socket-listener logic between `Chat.tsx` and `GroupChat.tsx`, with `GroupChat.tsx` missing the message-dedup guard
**Files**: `src/pages/Chat.tsx:38-46` vs `src/pages/GroupChat.tsx:29-33`
`Chat.tsx`'s `message:new` handler explicitly guards against duplicate inserts from optimistic updates:
```js
if (prev.some(m => m.id === message.id)) return prev;
return [...prev, message];
```
`GroupChat.tsx`'s equivalent handler does not:
```js
queryClient.setQueryData<Message[]>(["group-messages", groupId], (prev = []) => [...prev, message]);
```
**Repro**: Send a group message. The optimistic message is added locally in `onSendMessage` (`src/pages/GroupChat.tsx:47-65`), then the server echoes `message:new` back over the socket (`server/index.cjs:322`) with the *same* `Date.now().toString()` id only if the round-trip is fast enough that no other message was created in between — but because the ids are just `Date.now().toString()` (millisecond timestamps, `server/index.cjs:319`), two messages sent within the same millisecond (e.g. rapid double-submit, or two different users) can collide, and more importantly the missing dedup guard means a normal (non-colliding) round trip will show the same message twice — once from the optimistic update path if `invalidateQueries` hasn't fired yet, once from the socket echo — until the following `invalidateQueries` call in the `finally` block reconciles it. This produces a visible flicker/duplicate bubble that self-corrects only after the query refetch completes.
**Fix**: Add the same `prev.some(m => m.id === message.id)` guard used in `Chat.tsx:42` to `GroupChat.tsx`'s handler. Also consider switching message ids to a UUID or server-generated monotonic id instead of `Date.now().toString()` (`server/index.cjs:299`, `:319`) to eliminate the collision risk entirely.

### 5.4 — Read-receipt errors silently swallowed (empty catch, flagged by lint)
**Files**: `src/pages/Chat.tsx:118-125`, `src/pages/GroupChat.tsx:94-101`
```js
try {
  await markMessageRead(m.id, currentUserId);
  queryClient.setQueryData<Message[]>(...);
} catch {}
```
If `markMessageRead` fails (network blip, server restart since there's no persistence — see architecture notes, any in-memory restart loses all messages and this call would 404 per `server/index.cjs:368-379`'s `for...of` loop finding nothing and returning 404), the failure is silently discarded. The message will appear read locally in some cases and not others depending on timing, with no user-visible error and no retry — read state can permanently desync between client and the (already non-persistent) server state.
**Fix**: At minimum log the error for debugging; consider a retry/backoff for read-receipt delivery.

### 5.5 — Server restart silently wipes all state with no client-side detection
**File**: `server/index.cjs:33-34` (`messages`, `resetTokens` as in-memory objects), all routes
Because there is no persistence layer, any server restart (crash, redeploy, nodemon reload during dev) instantly loses every user, message, friend request, and group membership except the two hardcoded seed users (`server/index.cjs:17-20`). The frontend has no reconnection/rehydration handling for this case — `initSocket` (`src/lib/socket.ts:11-15`) will reconnect the socket transparently, but React Query caches will still show stale data from before the restart until a manual refetch, and any `userId` the client holds in `localStorage` for a non-seed user (e.g. `"3"`, `"4"`...) will simply stop resolving to anything server-side, silently breaking all API calls for that session with no explicit error state surfaced to the user beyond generic fetch failures.
**Fix**: Not fixable without adding real persistence (out of scope for this audit's read-only findings) — flagging as an operational bug inherent to the current architecture, worth documenting as a known limitation.

---

## 6. Code Quality Notes

- **`server/index.cjs:167-186`** (`/friend-requests` GET handler) contains ~15 lines of commented-out reasoning/debugging notes left in the code (`// For now, assume userId is passed...`, `// Let's check api.ts again.`, etc.) — this is a single-author scratchpad-style comment block that should be cleaned up; it also documents, in the developer's own words, that the endpoint's authorization model is a known hack, which independently corroborates finding 3.2.
- **`any` usage**: 3 instances flagged by lint (`ChatLayout.tsx:10`, `MessageInput.tsx:104`, `GroupChat.tsx:40`) — minor type-safety gaps, not bugs today but reduce the value of an otherwise fully-typed (`tsc --noEmit` clean) codebase.
- **Duplicate logic between `Chat.tsx` and `GroupChat.tsx`**: beyond the dedup-guard gap in 5.3, the two files are near-identical (145 vs 118 lines) — optimistic-update, reaction, and read-receipt logic is copy-pasted with only the query key (`["messages", friendId]` vs `["group-messages", groupId]`) and a couple of API function names differing. This is a maintenance risk: the dedup fix in 5.3 is exactly the kind of divergence that happens when logic is duplicated instead of shared via a hook (e.g. a `useChatMessages(queryKey, fetchFn, sendFn)` abstraction).
- **File-naming/content mismatch**: `ResetPasswordForm.tsx` (see 3.5/5.1) is the most significant instance — the file exists, is routed, and compiles, but does not do what its name or route implies.
- Component sizes are reasonable overall (`Settings.tsx` at 396 lines and `Index.tsx` at 339 lines are the largest; neither is alarming for a page-level component in this size of app).
- No unused-import lint errors were reported by ESLint, so that category is clean per the tooling available.

---

## 7. Prioritized Fix List

1. **Implement real authentication** (server + client) — signed session tokens verified server-side on every route; stop trusting client-supplied `userId`. Root cause of nearly every Critical/High finding (3.1, 3.2, 3.4's blast radius).
2. **Fix the IDOR on `/auth/delete` and `/messages/wipe`** specifically — these are destructive and currently require zero proof of identity (3.2).
3. **Hash passwords** (bcrypt/argon2) instead of plaintext storage/comparison (3.3).
4. **Fix the password-reset flow end-to-end**: stop returning the reset token in the API response (send out-of-band), add token expiry, and actually build the missing reset-password UI (currently a non-functional duplicate of the forgot-password page) (3.5, 5.1).
5. **Restrict CORS** to known origins on both Express and Socket.io once auth exists (3.4).
6. **Resolve the lockfile split** — commit to either Bun or npm and delete the other lockfile to prevent dependency drift between contributors/machines.
7. **Run `npm audit fix`** and re-test build/runtime, prioritizing the `ws`/`socket.io-parser` (DoS/memory disclosure) and `react-router` (open redirect) findings since those affect runtime-shipped or actively-listening code, not just dev tooling.
8. **Fix the `GroupChat.tsx` message-duplication bug** by adding the same dedup guard already present in `Chat.tsx` (5.3).
9. **Stop silently swallowing errors** in the read-receipt `catch {}` blocks in `Chat.tsx` and `GroupChat.tsx` (5.4) — at minimum log them.
10. **De-duplicate `Chat.tsx`/`GroupChat.tsx`** into a shared hook to prevent future logic drift like #8.

---

## 8. Overall Assessment

As a personal/learning project this app is in reasonable shape: it builds cleanly, type-checks with zero errors, and the core realtime chat UX (messages, reactions, typing indicators, read receipts) is implemented and functionally coherent end to end. But it is not production-ready in any sense of the phrase, and the gap isn't cosmetic — there is no authentication or authorization boundary at all on the backend, meaning every account, message, and destructive action (delete account, wipe messages) is reachable by anyone who can send an HTTP request to the server with a guessable id, and the password-reset flow both leaks its own reset token in the API response and has a UI page that doesn't do what it's named. If this is staying a local/personal single-machine project, none of that matters much; if there's any intent to deploy it somewhere reachable by other people (even a small private group), the auth/authorization work in items 1-4 of the fix list is not optional polish, it's the minimum bar before anyone else's data should touch this server.
