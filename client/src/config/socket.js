// src/config/socket.js
import { io } from "socket.io-client";

export const SOCKET_SERVER_URL =
  process.env.REACT_APP_SOCKET_SERVER_URL ||
  (window.location.hostname === "localhost"
    ? "http://localhost:5001"
    : "https://chatterlink-server.onrender.com");

// Create socket only when needed
export const createSocket = () =>
  io(SOCKET_SERVER_URL, {
    transports: ["websocket", "polling"],
    withCredentials: true,
    autoConnect: true,
  });