import { io, Socket } from "socket.io-client";

let _socket: Socket | null = null;

export const socket = {
  on: (...args: Parameters<Socket["on"]>) => _socket?.on(...args),
  off: (...args: Parameters<Socket["off"]>) => _socket?.off(...args),
  emit: (...args: Parameters<Socket["emit"]>) => _socket?.emit(...args),
};

export function initSocket(userId: string) {
  if (_socket) return;
  _socket = io("http://localhost:4000", { transports: ["websocket"], query: { userId } });
}

export function joinChat(userId: string, friendId: string) {
  _socket?.emit("join", { userId, friendId });
}