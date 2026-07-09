import { io, Socket } from "socket.io-client";
import { SOCKET_URL } from "../utils/constants";

/**
 * A single shared socket instance for the whole app.
 * Connection is created lazily (autoConnect: false) and started
 * explicitly via connectSocket(), typically from the useSocket hook.
 *
 * `auth` is a callback (not a plain object) so the JWT is re-read from
 * localStorage on every connect/reconnect — important since a client can
 * open the projector screen before anyone has logged in, or an admin can
 * log in after the socket already tried to connect once.
 */
export const socket: Socket = io(SOCKET_URL, {
  withCredentials: true,
  autoConnect: false,
  transports: ["websocket"],
  auth: (cb) => cb({ token: localStorage.getItem("token") }),
});

export function connectSocket(): void {
  if (!socket.connected) {
    socket.connect();
  }
}

export function disconnectSocket(): void {
  if (socket.connected) {
    socket.disconnect();
  }
}
