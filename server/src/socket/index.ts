import { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { initSocket as createIO, getIO, emitToAuction, SOCKET_EVENTS } from "./ioInstance";
import { registerAuctionHandlers } from "./auctionHandlers";

export { getIO, emitToAuction, SOCKET_EVENTS };

/** Initializes Socket.io and wires up the auction engine's room/action handlers. */
export function initSocket(httpServer: HttpServer): SocketIOServer {
  const io = createIO(httpServer);

  registerAuctionHandlers(io);

  io.on(SOCKET_EVENTS.CONNECTION, (socket: Socket) => {
    console.log(`[socket] client connected: ${socket.id}`);
    socket.on(SOCKET_EVENTS.DISCONNECT, () => {
      console.log(`[socket] client disconnected: ${socket.id}`);
    });
  });

  return io;
}
