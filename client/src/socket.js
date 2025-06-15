// src/socket.js
import { io } from "socket.io-client";

const socket = io("http://localhost:5001"); // or your server IP

export default socket;
