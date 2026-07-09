import { useEffect } from "react";
import { socket, connectSocket, disconnectSocket } from "../services/socket";

/**
 * Connects to the Socket.io server for the lifetime of the consuming
 * component and cleans up on unmount. Auction-specific event handling
 * will be layered on top of this once auction logic is built.
 */
export function useSocket() {
  useEffect(() => {
    connectSocket();
    return () => {
      disconnectSocket();
    };
  }, []);

  return socket;
}
