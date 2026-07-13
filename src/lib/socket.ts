import { io, Socket } from "socket.io-client";

let _socket: Socket | null = null;

export const socket = {
  on: (...args: Parameters<Socket["on"]>) => _socket?.on(...args),
  off: (...args: Parameters<Socket["off"]>) => _socket?.off(...args),
  emit: (...args: Parameters<Socket["emit"]>) => _socket?.emit(...args),
};

function getSocketUrl() {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return envUrl;
  return typeof window !== "undefined" ? `http://${window.location.hostname}:4000` : "http://localhost:4000";
}

export function initSocket(token: string) {
  if (_socket) return;
  _socket = io(getSocketUrl(), { transports: ["websocket"], query: { token } });
}

export function joinChat(friendId: string) {
  _socket?.emit("join", { friendId });
}

export function joinGroup(groupId: string) {
  _socket?.emit("group:join", { groupId });
}
