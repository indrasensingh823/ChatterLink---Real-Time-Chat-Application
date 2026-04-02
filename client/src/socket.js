import { io } from "socket.io-client";

const SOCKET_SERVER_URL =
  process.env.REACT_APP_SOCKET_SERVER_URL || "http://localhost:5001";

const socket = io(SOCKET_SERVER_URL, {
  transports: ["websocket", "polling"],
  autoConnect: true,
});

export default socket;