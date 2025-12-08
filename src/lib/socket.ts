let _ws: WebSocket | null = null;

export const socket = {
  on: (cb: (evt: MessageEvent) => void) => _ws && (_ws.onmessage = cb),
  off: () => { if (_ws) _ws.onmessage = null; },
  send: (data: any) => { if (_ws && _ws.readyState === WebSocket.OPEN) _ws.send(JSON.stringify(data)); },
};

export function initSocket() {
  if (_ws) return;
  const auth = JSON.parse(localStorage.getItem("authUser") || "null");
  const token = auth?.token || auth?.accessToken || null;
  const base = import.meta.env.VITE_API_URL?.replace(/^http/, 'ws') || "ws://localhost:4000";
  const url = token ? `${base}/ws?token=${encodeURIComponent(token)}` : `${base}/ws`;
  _ws = new WebSocket(url);
  _ws.onopen = () => console.log("WebSocket connected");
  _ws.onclose = () => { console.log("WebSocket closed"); _ws = null; };
}

export function joinChat(userId: string, friendId: string) {
  socket.send({ type: "join", userId, friendId });
}