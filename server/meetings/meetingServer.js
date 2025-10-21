// server/meetings/meetingServer.js
import { Server } from "socket.io";

export default function setupMeetingServer(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  const meetingNamespace = io.of("/meeting");

  meetingNamespace.on("connection", (socket) => {
    console.log(`🟢 Meeting socket connected: ${socket.id}`);

    socket.on("join-room", (roomId, userName) => {
      socket.join(roomId);
      socket.to(roomId).emit("user-connected", socket.id, userName);
    });

    socket.on("signal", ({ roomId, signal, from }) => {
      socket.to(roomId).emit("signal", { signal, from });
    });

    socket.on("chat-message", ({ roomId, userName, message }) => {
      meetingNamespace.to(roomId).emit("chat-message", { userName, message });
    });

    socket.on("leave-room", (roomId) => {
      socket.leave(roomId);
      socket.to(roomId).emit("user-disconnected", socket.id);
    });

    socket.on("disconnect", () => {
      console.log(`🔴 Meeting socket disconnected: ${socket.id}`);
    });
  });

  console.log("✅ Meeting signaling server ready at /meeting namespace");
}
