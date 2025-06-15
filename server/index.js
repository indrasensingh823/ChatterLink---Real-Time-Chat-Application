// 📦 Import Required Modules
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { findByIdAndUpdate, findByIdAndDelete } from "./models/Message.js";
import openaiRoutes from "./routes/openai.js";

// 📥 Load .env
dotenv.config();

// 🔗 MongoDB Connection Function
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    process.exit(1); // Force exit on DB connection failure
  }
};

// Connect DB
connectDB();

// 🚀 Initialize Express
const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/openai", openaiRoutes);

// 🌐 Create HTTP Server & Attach Socket.IO
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// 🧠 Memory Stores
const users = {};
let onlineUsers = 0;
const racePlayers = {};
let raceParagraph = "The quick brown fox jumps over the lazy dog.";
const privateRooms = {};

// 🎯 Socket.IO Logic
io.on("connection", (socket) => {
  onlineUsers++;
  io.emit("onlineUsers", onlineUsers);
  console.log(`🟢 Connected: ${socket.id}`);

  socket.on("disconnect", () => {
    onlineUsers--;
    io.emit("onlineUsers", onlineUsers);

    const username = users[socket.id];
    const room = [...socket.rooms].find((r) => r !== socket.id);

    if (username && room) {
      socket.to(room).emit("message", {
        user: "Admin",
        text: `${username} has left the room.`,
      });
      console.log(`🔴 ${username} disconnected from room: ${room}`);
    }

    delete users[socket.id];
    delete racePlayers[socket.id];
  });

  socket.on("join", ({ username, room }) => {
    users[socket.id] = username;
    socket.join(room);

    socket.emit("message", {
      user: "Admin",
      text: `Welcome to the room, ${username}!`,
    });

    socket.to(room).emit("message", {
      user: "Admin",
      text: `${username} has joined the room.`,
    });

    console.log(`👤 ${username} joined room: ${room}`);
  });

  socket.on("typing", (data) => {
    socket.broadcast.to("default").emit("typing", data);
  });

  socket.on("stopTyping", () => {
    socket.broadcast.to("default").emit("stopTyping");
  });

  socket.on("sendMessage", (message) => {
    const username = users[socket.id];
    const room = [...socket.rooms].find((r) => r !== socket.id);

    if (username && room) {
      const timestamp = new Date().toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      io.to(room).emit("message", {
        user: username,
        text: message,
        time: timestamp,
      });
    }
  });

  socket.on("editMessage", async ({ messageId, newText }) => {
    try {
      const updated = await findByIdAndUpdate(
        messageId,
        { text: newText, edited: true },
        { new: true }
      );
      if (updated) {
        io.to(updated.roomId).emit("messageEdited", updated);
      }
    } catch (err) {
      console.error("❌ Failed to edit message:", err.message);
    }
  });

  socket.on("deleteMessage", async ({ messageId }) => {
    try {
      const deleted = await findByIdAndDelete(messageId);
      if (deleted) {
        io.to(deleted.roomId).emit("messageDeleted", messageId);
      }
    } catch (err) {
      console.error("❌ Failed to delete message:", err.message);
    }
  });

  socket.on("joinRace", ({ username }) => {
    racePlayers[socket.id] = { username, progress: 0, wpm: 0, accuracy: 0 };
    socket.emit("paragraph", raceParagraph);
    io.emit("updatePlayers", racePlayers);
  });

  socket.on("progressUpdate", ({ progress, wpm, accuracy }) => {
    if (racePlayers[socket.id]) {
      racePlayers[socket.id] = { ...racePlayers[socket.id], progress, wpm, accuracy };

      if (progress >= 100) {
        io.emit("winner", racePlayers[socket.id].username);
      }

      io.emit("updatePlayers", racePlayers);
    }
  });

  socket.on("createPrivateRoom", ({ roomId, passcode }) => {
    privateRooms[roomId] = passcode;
    socket.join(roomId);
    console.log(`🔒 Private room created: ${roomId}`);
  });

  socket.on("joinPrivateRoom", ({ roomId, passcode }, callback) => {
    if (privateRooms[roomId] === passcode) {
      socket.join(roomId);
      callback({ success: true });
      console.log(`✅ ${socket.id} joined private room: ${roomId}`);
    } else {
      callback({ success: false, message: "Invalid passcode" });
      console.log(`❌ ${socket.id} failed to join private room: ${roomId}`);
    }
  });

  socket.on("privateMessage", ({ roomId, message }) => {
    io.to(roomId).emit("privateMessage", { userId: socket.id, message });
  });
});

// 📍 Health Check
app.get("/", (req, res) => {
  res.send("✅ Chat Server is running!");
});

// 🚀 Start Server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
