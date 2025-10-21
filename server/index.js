// server/index.js - COMPLETE MERGED CODE WITH ALL FEATURES
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { findByIdAndUpdate, findByIdAndDelete } from "./models/Message.js";
import geminiRoutes from "./routes/gemini.js";
import openaiRoutes from "./routes/openai.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import crypto from "crypto";

// 📥 Load .env
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔗 MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/chatterlink";
const PORT = process.env.PORT || 5001;
const RECORDINGS_DIR = process.env.RECORDINGS_DIR || path.join(process.cwd(), "recordings");
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// 🛠️ CRITICAL FIX: Ensure uploads directory exists with proper permissions
try {
  [RECORDINGS_DIR, UPLOADS_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ Created directory: ${dir}`);
    }
  });
} catch (error) {
  console.error('❌ Directory creation error:', error);
}

// 🧠 In-Memory Storage for Meetings (Fallback when MongoDB fails)
const inMemoryMeetings = new Map();
let meetingCounter = 1;
let dbConnected = false;

// 🔧 Helper function to generate unique meeting links
function generateMeetingLink() {
  return `meeting-${crypto.randomBytes(8).toString('hex')}-${Date.now()}`;
}

// Mongoose Meeting model
const meetingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ""
  },
  startAt: {
    type: Date,
    required: true
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  host: {
    type: String,
    default: "Anonymous Host"
  },
  meetingLink: {
    type: String,
    unique: true,
    sparse: true,
    default: generateMeetingLink
  }
});

meetingSchema.index({ meetingLink: 1 }, { unique: true, sparse: true });
const Meeting = mongoose.model("Meeting", meetingSchema);

// Connect DB with fallback
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    dbConnected = true;
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    
    try {
      await Meeting.ensureIndexes();
      console.log('✅ Database indexes verified');
    } catch (indexError) {
      console.log('ℹ️ Index setup completed');
    }
    
  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    console.log(`🔄 Using in-memory storage for meetings...`);
    dbConnected = false;
  }
};
connectDB();

// 🚀 Initialize Express
const app = express();
app.use(cors({
  origin: process.env.CLIENT_URL || "*",
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use("/recordings", express.static(RECORDINGS_DIR));
app.use('/uploads', express.static(UPLOADS_DIR));

// ✅ Use routes
app.use("/api/gemini", geminiRoutes);
// app.use("/api/openai", openaiRoutes);

// 📁 File Upload Configurations - FIXED

// 1. Meeting Recordings Upload Config
const recordingsStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, RECORDINGS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".webm";
    const meetingId = req.params.meetingId || "unknown";
    const safeMeetingId = meetingId.replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `${safeMeetingId}_${Date.now()}${ext}`);
  }
});

const uploadRecordings = multer({ 
  storage: recordingsStorage,
  limits: { fileSize: 100 * 1024 * 1024 }
});

// 2. General File Upload Config - COMPLETELY FIXED
const generalStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // CRITICAL FIX: Double-check directory exists
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // FIX: Better filename sanitization
    const safeFilename = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, uniqueSuffix + '-' + safeFilename);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm',
    'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4',
    'application/pdf', 'text/plain', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/zip', 'application/x-rar-compressed'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed`), false);
  }
};

const uploadGeneral = multer({
  storage: generalStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: fileFilter
});

// ========== API ROUTES ==========

// 🎯 Meeting Routes
app.post("/api/meetings", async (req, res) => {
  try {
    const { title, description, startAt, host } = req.body;
    
    if (!title || !startAt) {
      return res.status(400).json({ 
        success: false, 
        message: "Title and start time are required" 
      });
    }

    let meetingId;
    
    if (dbConnected) {
      try {
        const meetingData = {
          title: title.trim(),
          description: description ? description.trim() : "",
          startAt: new Date(startAt),
          host: host ? host.trim() : "Anonymous Host",
          meetingLink: generateMeetingLink()
        };
        
        const meeting = new Meeting(meetingData);
        await meeting.save();
        meetingId = meeting._id;
        console.log(`📝 Meeting created in MongoDB: ${meetingId}`);
      } catch (mongoError) {
        if (mongoError.code === 11000) {
          console.log('🔄 Duplicate key error, retrying...');
          const meetingData = {
            title: title.trim(),
            description: description ? description.trim() : "",
            startAt: new Date(startAt),
            host: host ? host.trim() : "Anonymous Host",
            meetingLink: generateMeetingLink()
          };
          
          const meeting = new Meeting(meetingData);
          await meeting.save();
          meetingId = meeting._id;
          console.log(`📝 Meeting created in MongoDB (retry): ${meetingId}`);
        } else {
          throw mongoError;
        }
      }
    } else {
      meetingId = `mem_${meetingCounter++}_${Date.now()}`;
      const meeting = {
        _id: meetingId,
        title: title.trim(),
        description: description ? description.trim() : "",
        startAt: new Date(startAt),
        host: host ? host.trim() : "Anonymous Host",
        createdAt: new Date(),
        meetingLink: generateMeetingLink()
      };
      
      inMemoryMeetings.set(meetingId, meeting);
      console.log(`📝 Meeting created in memory: ${meetingId}`);
    }
    
    res.json({ 
      success: true, 
      meetingId: meetingId,
      message: "Meeting created successfully",
      storage: dbConnected ? "mongodb" : "in-memory"
    });
  } catch (err) {
    console.error("Meeting creation error:", err);
    
    if (err.name === 'MongoServerSelectionError' || err.name === 'MongoNetworkError' || err.code === 11000) {
      const { title, description, startAt, host } = req.body;
      const meetingId = `mem_fallback_${meetingCounter++}_${Date.now()}`;
      const meeting = {
        _id: meetingId,
        title: title.trim(),
        description: description ? description.trim() : "",
        startAt: new Date(startAt),
        host: host ? host.trim() : "Anonymous Host",
        createdAt: new Date(),
        meetingLink: generateMeetingLink()
      };
      
      inMemoryMeetings.set(meetingId, meeting);
      dbConnected = false;
      
      console.log(`📝 Meeting created in memory (fallback): ${meetingId}`);
      
      res.json({ 
        success: true, 
        meetingId: meetingId,
        message: "Meeting created successfully (in-memory storage)",
        storage: "in-memory"
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: err.message,
        code: err.code
      });
    }
  }
});

app.get("/api/meetings/:id", async (req, res) => {
  try {
    let meeting;
    
    if (dbConnected) {
      meeting = await Meeting.findById(req.params.id).lean();
    } else {
      meeting = inMemoryMeetings.get(req.params.id);
    }
    
    if (!meeting) {
      return res.status(404).json({ 
        success: false, 
        message: "Meeting not found" 
      });
    }
    
    res.json({ 
      success: true, 
      meeting,
      storage: dbConnected ? "mongodb" : "in-memory"
    });
  } catch (err) {
    console.error("Get meeting error:", err);
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
});

// Upload meeting recording
app.post("/api/meetings/:meetingId/recording", uploadRecordings.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: "No file uploaded" 
      });
    }
    
    const url = `/recordings/${req.file.filename}`;
    const fullUrl = `${req.protocol}://${req.get('host')}${url}`;
    
    console.log(`🎥 Recording uploaded for meeting ${req.params.meetingId}: ${req.file.filename}`);
    
    res.json({ 
      success: true, 
      url: fullUrl,
      filename: req.file.filename,
      message: "Recording uploaded successfully"
    });
  } catch (err) {
    console.error("Recording upload error:", err);
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
});

// 🛠️ CRITICAL FIX: General file upload - COMPLETELY REWORKED
app.post('/upload', uploadGeneral.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: 'No file uploaded' 
      });
    }

    // FIX: Generate proper file URL
    const fileUrl = `/uploads/${req.file.filename}`;
    const fullFileUrl = `${req.protocol}://${req.get('host')}${fileUrl}`;
    
    console.log(`📁 FILE UPLOAD SUCCESS: ${req.file.originalname} -> ${req.file.filename} (${req.file.size} bytes)`);
    
    res.json({
      success: true,
      message: 'File uploaded successfully',
      filename: req.file.filename,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      fileUrl: fullFileUrl,
      relativeUrl: fileUrl // Also return relative URL for flexibility
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      success: false,
      error: 'File upload failed: ' + error.message 
    });
  }
});

// Handle file upload errors
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 50MB.'
      });
    }
  }
  res.status(500).json({
    success: false,
    error: error.message
  });
});

// Health Check with Database Status
app.get("/", (req, res) => {
  res.json({ 
    success: true,
    message: "✅ ChatterLink Server - Chat + WebRTC + Meetings + File Sharing + AI is running!",
    database: dbConnected ? "MongoDB Connected" : "In-Memory Storage",
    inMemoryMeetingsCount: inMemoryMeetings.size,
    timestamp: new Date().toISOString()
  });
});

app.get("/upload-info", (req, res) => {
  res.json({
    success: true,
    maxFileSize: "50MB",
    allowedTypes: [
      "Images (JPEG, PNG, GIF, WebP)",
      "Videos (MP4, MPEG, WebM)",
      "Audio (MP3, WAV, OGG)",
      "Documents (PDF, Word, Excel, Text)",
      "Archives (ZIP, RAR)"
    ],
    uploadEndpoint: "/upload",
    uploadsDirectory: UPLOADS_DIR
  });
});

app.get("/api/upload-info", (req, res) => {
  res.json({
    success: true,
    maxFileSize: "50MB",
    allowedTypes: [
      "Images (JPEG, PNG, GIF, WebP)",
      "Videos (MP4, MPEG, WebM)",
      "Audio (MP3, WAV, OGG)",
      "Documents (PDF, Word, Excel, Text)",
      "Archives (ZIP, RAR)"
    ],
    uploadEndpoint: "/api/upload",
    uploadsDirectory: UPLOADS_DIR
  });
});

// Database status endpoint
app.get("/api/db-status", (req, res) => {
  res.json({
    success: true,
    database: dbConnected ? "connected" : "disconnected",
    storage: dbConnected ? "mongodb" : "in-memory",
    inMemoryMeetingsCount: inMemoryMeetings.size,
    message: dbConnected ? 
      "MongoDB is connected and working" : 
      "Using in-memory storage (MongoDB not available)"
  });
});

// Database cleanup endpoint
app.post("/api/cleanup-db", async (req, res) => {
  try {
    if (!dbConnected) {
      return res.json({
        success: true,
        message: "Using in-memory storage, no cleanup needed"
      });
    }

    const result = await Meeting.deleteMany({
      $or: [
        { meetingLink: { $exists: false } },
        { meetingLink: null }
      ]
    });

    await Meeting.syncIndexes();

    res.json({
      success: true,
      message: `Database cleanup completed. Removed ${result.deletedCount} problematic documents.`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error("Database cleanup error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get all meetings (for debugging)
app.get("/api/debug/meetings", async (req, res) => {
  try {
    if (dbConnected) {
      const meetings = await Meeting.find({}).lean();
      res.json({
        success: true,
        count: meetings.length,
        meetings: meetings
      });
    } else {
      const meetings = Array.from(inMemoryMeetings.values());
      res.json({
        success: true,
        count: meetings.length,
        meetings: meetings,
        storage: "in-memory"
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 📍 Private Rooms Info Endpoint
app.get("/private-rooms", (req, res) => {
  const roomInfo = Object.keys(privateRooms).map(roomId => ({
    roomId,
    userCount: privateRooms[roomId].users.length,
    createdBy: privateRooms[roomId].createdBy
  }));
  
  res.json({
    success: true,
    activePrivateRooms: roomInfo.length,
    rooms: roomInfo
  });
});

// 🧠 In-Memory Stores for Chat Features
const users = {};
let onlineUsersCount = 0;
const racePlayers = {};
let raceParagraph = "The quick brown fox jumps over the lazy dog.";
const privateRooms = {};
if (!global.__onlineQueue) global.__onlineQueue = [];
const queue = global.__onlineQueue;

// 🔧 Helper Functions
function emitOnlineList() {
  const list = Object.entries(users).map(([id, name]) => ({ id, name }));
  io.emit("onlineUsersList", list);
}

function emitOnlineCount() {
  io.emit("onlineUsersCount", onlineUsersCount);
}

function cleanupUser(socketId) {
  const username = users[socketId];
  const room = [...io.sockets.sockets.get(socketId)?.rooms || []].find((r) => r !== socketId);

  if (username && room) {
    io.to(room).emit("message", {
      user: "Admin",
      text: `${username} has left the room.`,
    });
    console.log(`🔴 ${username} disconnected from room: ${room}`);
  }

  delete users[socketId];
  delete racePlayers[socketId];

  Object.keys(privateRooms).forEach(roomId => {
    if (privateRooms[roomId] && privateRooms[roomId].users) {
      privateRooms[roomId].users = privateRooms[roomId].users.filter(id => id !== socketId);
      if (privateRooms[roomId].users.length === 0) {
        delete privateRooms[roomId];
        console.log(`🗑️ Cleaned up empty private room: ${roomId}`);
      }
    }
  });

  const idx = queue.indexOf(socketId);
  if (idx !== -1) queue.splice(idx, 1);
}

// 🌐 HTTP Server + Socket.IO
const server = createServer(app);
const io = new Server(server, {
  cors: { 
    origin: process.env.CLIENT_URL || "*", 
    methods: ["GET", "POST"],
    credentials: true
  },
  maxHttpBufferSize: 1e8 // 100MB for file uploads
});

// 🎯 Socket.IO Logic - ALL FEATURES INCLUDED

io.on("connection", (socket) => {
  onlineUsersCount++;
  emitOnlineCount();
  console.log(`🟢 Socket connected: ${socket.id}`);

  // ========== MEETING FEATURES ==========
  
  // Join meeting room
  socket.on("join-meeting", ({ meetingId, user }) => {
    socket.join(meetingId);
    socket.data.user = user;
    console.log(`${user?.name || socket.id} joined meeting ${meetingId}`);

    socket.to(meetingId).emit("peer-joined", { 
      id: socket.id, 
      user: socket.data.user 
    });
    
    const clients = Array.from(io.sockets.adapter.rooms.get(meetingId) || []);
    const participants = clients.filter(id => id !== socket.id).map(id => ({
      id,
      user: io.sockets.sockets.get(id)?.data?.user || null
    }));
    
    socket.emit("participants", participants);
    console.log(`📊 Sent ${participants.length} participants to ${socket.id}`);
  });

  // Leave meeting
  socket.on("leave-meeting", ({ meetingId }) => {
    socket.leave(meetingId);
    socket.to(meetingId).emit("peer-left", { id: socket.id });
    console.log(`🚪 ${socket.id} left meeting ${meetingId}`);
  });

  // Meeting WebRTC signaling: offer/answer/ice
  socket.on("webrtc-offer", ({ to, sdp }) => {
    console.log(`📞 WebRTC OFFER from ${socket.id} to ${to}`);
    io.to(to).emit("webrtc-offer", { 
      from: socket.id, 
      sdp, 
      user: socket.data.user || null 
    });
  });

  socket.on("webrtc-answer", ({ to, sdp }) => {
    console.log(`📞 WebRTC ANSWER from ${socket.id} to ${to}`);
    io.to(to).emit("webrtc-answer", { 
      from: socket.id, 
      sdp 
    });
  });

  socket.on("webrtc-ice", ({ to, candidate }) => {
    console.log(`🧊 ICE candidate from ${socket.id} to ${to}`);
    io.to(to).emit("webrtc-ice", { 
      from: socket.id, 
      candidate 
    });
  });

  // Meeting chat messages
  socket.on("chat-message", ({ meetingId, message, user }) => {
    const messageData = {
      message, 
      user, 
      time: new Date().toISOString(),
      id: Date.now() + Math.random()
    };
    
    console.log(`💬 Chat in meeting ${meetingId} from ${user?.name}: ${message}`);
    io.to(meetingId).emit("chat-message", messageData);
  });

  // Meeting recording notifications
  socket.on("recording-available", ({ meetingId, url }) => {
    console.log(`🎥 Recording available in meeting ${meetingId}: ${url}`);
    io.to(meetingId).emit("recording-available", { url });
  });

  // ========== GENERAL CHAT & GAME FEATURES ==========

  // Request Current Online List
  socket.on("request-online-list", () => {
    const list = Object.entries(users).map(([id, name]) => ({ id, name }));
    socket.emit("onlineUsersList", list);
  });

  // Join a Chat Room
  socket.on("join", ({ username, room }) => {
    users[socket.id] = username;
    socket.join(room);

    socket.emit("message", {
      user: "Admin",
      text: `Welcome to the room, ${username}!`,
      time: new Date().toISOString()
    });

    socket.to(room).emit("message", {
      user: "Admin",
      text: `${username} has joined the room.`,
      time: new Date().toISOString()
    });

    emitOnlineList();
    console.log(`👤 ${username} joined room: ${room}`);
  });

  // Typing Indicators
  socket.on("typing", (data) => {
    socket.broadcast.emit("typing", data);
  });
  
  socket.on("stopTyping", () => {
    socket.broadcast.emit("stopTyping");
  });

  // Send Message
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
      
      const messageData = {
        user: username, 
        text: message, 
        time: timestamp,
        id: Date.now() + Math.random()
      };
      
      console.log(`💬 General chat from ${username} in ${room}: ${message}`);
      io.to(room).emit("message", messageData);
    }
  });

  // 🔹 Edit Message
  socket.on("editMessage", async ({ messageId, newText }) => {
    try {
      const updated = await findByIdAndUpdate(
        messageId,
        { text: newText, edited: true },
        { new: true }
      );
      if (updated) io.to(updated.roomId).emit("messageEdited", updated);
    } catch (err) {
      console.error("❌ Edit failed:", err.message);
    }
  });

  // 🔹 Delete Message
  socket.on("deleteMessage", async ({ messageId }) => {
    try {
      const deleted = await findByIdAndDelete(messageId);
      if (deleted) io.to(deleted.roomId).emit("messageDeleted", messageId);
    } catch (err) {
      console.error("❌ Delete failed:", err.message);
    }
  });

  // ========== FILE SHARING FEATURES - COMPLETELY FIXED ==========

  // 🛠️ FIX 1: General Chat File Sharing - SIMPLIFIED AND FIXED
  socket.on("file_upload", (fileData) => {
    try {
      const username = users[socket.id];
      // FIX: Get the correct room the user is in
      const rooms = Array.from(socket.rooms).filter(room => room !== socket.id);
      const room = rooms[0]; // User should be in one main room

      if (username && room) {
        const timestamp = new Date().toLocaleTimeString("en-IN", {
          timeZone: "Asia/Kolkata",
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
        
        console.log(`📁 FILE UPLOAD in general chat by ${username}:`, {
          originalName: fileData.originalName,
          fileSize: fileData.fileSize,
          fileType: fileData.fileType,
          fileUrl: fileData.fileUrl,
          room: room
        });
        
        const fileMessage = {
          user: username,
          file: fileData,
          time: timestamp,
          type: 'file',
          id: Date.now() + Math.random()
        };
        
        // FIX: Emit to everyone in the room including sender
        io.to(room).emit("file_uploaded", fileMessage);
        console.log(`✅ File shared successfully in general chat room: ${room}`);
      } else {
        console.log(`❌ File upload failed: User not in room or no username`);
        console.log(`   Username: ${username}, Room: ${room}, All rooms: ${Array.from(socket.rooms)}`);
        socket.emit("file_upload_error", { message: "You need to join a room first" });
      }
    } catch (error) {
      console.error('File upload socket error:', error);
      socket.emit("file_upload_error", { message: "File sharing failed: " + error.message });
    }
  });

  // 🛠️ FIX 2: Private Room File Sharing - SIMPLIFIED AND FIXED
  socket.on("privateFileUpload", (data) => {
    try {
      const { roomId, fileInfo } = data;
      const username = users[socket.id] || `User${socket.id.slice(-4)}`;
      
      console.log(`📁 Private file upload attempt by ${username} in room ${roomId}:`, fileInfo);

      // FIX: Better room validation
      if (privateRooms[roomId] && privateRooms[roomId].users.includes(socket.id)) {
        const timestamp = new Date().toLocaleTimeString("en-IN", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        });

        const fileMessageData = {
          userId: socket.id,
          username: username,
          file: fileInfo,
          time: timestamp,
          type: 'file',
          id: Date.now() + Math.random()
        };

        console.log(`📁 FILE SHARED in private room ${roomId} by ${username}:`, {
          originalName: fileInfo.originalName,
          fileSize: fileInfo.fileSize,
          fileType: fileInfo.fileType,
          fileUrl: fileInfo.fileUrl
        });

        // FIX: Emit to everyone in the private room including sender
        io.to(roomId).emit("privateFileUploaded", fileMessageData);
        console.log(`✅ File shared successfully in private room: ${roomId}`);
      } else {
        console.log(`❌ Private file upload failed: User ${socket.id} not in room ${roomId}`);
        console.log(`   Available rooms:`, Object.keys(privateRooms));
        console.log(`   Room users:`, privateRooms[roomId]?.users);
        socket.emit("file_upload_error", { message: "You are not in this private room" });
      }
    } catch (error) {
      console.error('Private file upload socket error:', error);
      socket.emit("file_upload_error", { message: "File sharing failed: " + error.message });
    }
  });

  // 🛠️ FIX 3: Unified File Upload Notification - NEW & IMPROVED
  socket.on("notify_file_upload", (data) => {
    try {
      const { roomId, fileInfo, isPrivate = false } = data;
      const username = users[socket.id];
      
      if (!username) {
        socket.emit("file_upload_error", { message: "User not found" });
        return;
      }

      const timestamp = new Date().toLocaleTimeString("en-IN", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      const fileMessage = {
        userId: socket.id,
        username: username,
        file: fileInfo,
        time: timestamp,
        type: 'file',
        id: Date.now() + Math.random()
      };

      console.log(`📢 File upload notification:`, {
        username,
        roomId,
        isPrivate,
        fileName: fileInfo.originalName
      });

      if (isPrivate) {
        // Private room file - FIX: Better validation
        if (privateRooms[roomId] && privateRooms[roomId].users.includes(socket.id)) {
          io.to(roomId).emit("privateFileUploaded", fileMessage);
          console.log(`✅ Notified private room ${roomId} about file upload`);
        } else {
          console.log(`❌ Cannot notify private room: User not in room ${roomId}`);
          socket.emit("file_upload_error", { message: "You are not in this private room" });
        }
      } else {
        // General chat file - FIX: Check if user is in the room
        if (socket.rooms.has(roomId)) {
          io.to(roomId).emit("file_uploaded", fileMessage);
          console.log(`✅ Notified room ${roomId} about file upload`);
        } else {
          console.log(`❌ Cannot notify room: User not in room ${roomId}`);
          socket.emit("file_upload_error", { message: "You are not in this room" });
        }
      }
    } catch (error) {
      console.error('Notify file upload error:', error);
      socket.emit("file_upload_error", { message: "Notification failed: " + error.message });
    }
  });

  // Typing Race Game
  socket.on("joinRace", ({ username }) => {
    racePlayers[socket.id] = { username, progress: 0, wpm: 0, accuracy: 0 };
    socket.emit("paragraph", raceParagraph);
    io.emit("updatePlayers", racePlayers);
  });

  socket.on("progressUpdate", ({ progress, wpm, accuracy }) => {
    if (racePlayers[socket.id]) {
      racePlayers[socket.id] = { 
        ...racePlayers[socket.id], 
        progress, 
        wpm, 
        accuracy 
      };
      if (progress >= 100) {
        io.emit("winner", racePlayers[socket.id].username);
      }
      io.emit("updatePlayers", racePlayers);
    }
  });

  // ========== PRIVATE ROOMS ==========

  socket.on("createPrivateRoom", ({ roomId, passcode, username }) => {
    privateRooms[roomId] = { 
      passcode, 
      users: [socket.id],
      createdBy: socket.id,
      createdAt: new Date()
    };
    
    users[socket.id] = username;
    socket.join(roomId);
    
    console.log(`🔒 Private room created: ${roomId} by ${username}`);
    
    socket.emit("privateRoomCreated", { 
      success: true, 
      roomId,
      message: "Private room created successfully!"
    });
  });

  socket.on("joinPrivateRoom", ({ roomId, passcode, username }, callback) => {
    if (!privateRooms[roomId]) {
      callback({ success: false, message: "Room does not exist" });
      return;
    }

    if (privateRooms[roomId].passcode === passcode) {
      users[socket.id] = username;
      privateRooms[roomId].users.push(socket.id);
      socket.join(roomId);
      
      io.to(roomId).emit("userJoinedPrivate", {
        userId: socket.id,
        username: username,
        message: `${username} joined the room`,
        time: new Date().toISOString()
      });
      
      const roomUsers = privateRooms[roomId].users.map(id => ({
        id,
        username: users[id] || `User${id.slice(-4)}`
      }));
      
      // Send current room users to the new joiner
      socket.emit("privateRoomUsers", roomUsers);
      
      // Notify others about the updated user list
      socket.to(roomId).emit("privateRoomUsers", roomUsers);
      
      callback({ success: true });
      console.log(`✅ ${username} joined private room: ${roomId}`);
    } else {
      callback({ success: false, message: "Invalid passcode" });
    }
  });

  // Private room messaging
  socket.on("privateMessage", ({ roomId, message, username }) => {
    if (privateRooms[roomId] && privateRooms[roomId].users.includes(socket.id)) {
      const timestamp = new Date().toLocaleTimeString("en-IN", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });

      const messageData = {
        userId: socket.id,
        username: username || users[socket.id] || `User${socket.id.slice(-4)}`,
        message: message,
        time: timestamp,
        type: 'message',
        id: Date.now() + Math.random()
      };

      console.log(`📨 Private message in ${roomId} from ${messageData.username}: ${message}`);
      io.to(roomId).emit("privateMessage", messageData);
    } else {
      socket.emit("error", { message: "You are not in this room" });
    }
  });

  // Private room user management
  socket.on("leavePrivateRoom", ({ roomId }) => {
    if (privateRooms[roomId]) {
      privateRooms[roomId].users = privateRooms[roomId].users.filter(id => id !== socket.id);
      
      socket.to(roomId).emit("userLeftPrivate", {
        userId: socket.id,
        username: users[socket.id] || `User${socket.id.slice(-4)}`,
        message: `${users[socket.id] || 'A user'} left the room`,
        time: new Date().toISOString()
      });

      // Update user list for remaining users
      const remainingUsers = privateRooms[roomId].users.map(id => ({
        id,
        username: users[id] || `User${id.slice(-4)}`
      }));
      io.to(roomId).emit("privateRoomUsers", remainingUsers);

      if (privateRooms[roomId].users.length === 0) {
        delete privateRooms[roomId];
        console.log(`🗑️ Cleaned up empty private room: ${roomId}`);
      }
      
      socket.leave(roomId);
    }
  });

  // Private room typing indicators
  socket.on("privateTyping", ({ roomId }) => {
    if (privateRooms[roomId] && privateRooms[roomId].users.includes(socket.id)) {
      socket.to(roomId).emit("privateTyping", {
        userId: socket.id,
        username: users[socket.id] || `User${socket.id.slice(-4)}`
      });
    }
  });

  socket.on("privateStopTyping", ({ roomId }) => {
    if (privateRooms[roomId] && privateRooms[roomId].users.includes(socket.id)) {
      socket.to(roomId).emit("privateStopTyping", {
        userId: socket.id
      });
    }
  });

  // ========== RANDOM MATCH WEBRTC ==========

  socket.on("call-offer", ({ to, offer }) => {
    io.to(to).emit("call-offer", { from: socket.id, offer });
  });

  socket.on("call-answer", ({ to, answer }) => {
    io.to(to).emit("call-answer", { from: socket.id, answer });
  });

  socket.on("ice-candidate", ({ to, candidate }) => {
    if (candidate) {
      io.to(to).emit("ice-candidate", { from: socket.id, candidate });
    }
  });

  socket.on("end-call", ({ to }) => {
    io.to(to).emit("call-ended", { from: socket.id });
  });

  // Random Match Queue
  socket.on("random-match-request", () => {
    if (!queue.includes(socket.id)) queue.push(socket.id);
    
    if (queue.length >= 2) {
      const a = queue.shift();
      const b = queue.shift();
      const roomId = `${a}-${b}`;
      
      io.to(a).emit("random-match-found", { 
        roomId, 
        otherId: b 
      });
      io.to(b).emit("random-match-found", { 
        roomId, 
        otherId: a 
      });
    }
  });

  // Serve React build
app.use(express.static(path.join(__dirname, "../client/build")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/build", "index.html"));
});

  // ========== DISCONNECT HANDLER ==========

  socket.on("disconnect", () => {
    onlineUsersCount--;
    emitOnlineCount();
    
    // Handle meeting room leaves
    for (const room of socket.rooms) {
      if (room === socket.id) continue;
      socket.to(room).emit("peer-left", { id: socket.id });
    }
    
    // Handle private room leaves
    Object.keys(privateRooms).forEach(roomId => {
      if (privateRooms[roomId] && privateRooms[roomId].users.includes(socket.id)) {
        socket.to(roomId).emit("userLeftPrivate", {
          userId: socket.id,
          username: users[socket.id] || `User${socket.id.slice(-4)}`,
          message: `${users[socket.id] || 'A user'} disconnected`,
          time: new Date().toISOString()
        });
        
        privateRooms[roomId].users = privateRooms[roomId].users.filter(id => id !== socket.id);
        
        // Update user list for remaining users
        const remainingUsers = privateRooms[roomId].users.map(id => ({
          id,
          username: users[id] || `User${id.slice(-4)}`
        }));
        io.to(roomId).emit("privateRoomUsers", remainingUsers);
        
        if (privateRooms[roomId].users.length === 0) {
          delete privateRooms[roomId];
        }
      }
    });
    
    cleanupUser(socket.id);
    emitOnlineList();
    
    console.log(`🔴 Socket disconnected: ${socket.id}`);
  });
});

// 🗑️ Clean up old files
setInterval(() => {
  try {
    const uploadFiles = fs.readdirSync(UPLOADS_DIR);
    const recordingsFiles = fs.readdirSync(RECORDINGS_DIR);
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    [...uploadFiles, ...recordingsFiles].forEach(file => {
      const filePath = path.join(file.includes('recordings') ? RECORDINGS_DIR : UPLOADS_DIR, file);
      try {
        const stats = fs.statSync(filePath);
        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filePath);
          console.log('🗑️ Deleted old file:', file);
        }
      } catch (error) {
        console.log('Could not delete file:', file, error.message);
      }
    });
  } catch (error) {
    console.error('Error cleaning up old files:', error);
  }
}, 24 * 60 * 60 * 1000);

// 🚀 Start Server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📁 Meeting recordings: ${RECORDINGS_DIR}`);
  console.log(`📁 General uploads: ${UPLOADS_DIR}`);
  console.log(`🔗 API Base: http://localhost:${PORT}/api`);
  console.log(`🔗 File upload: http://localhost:${PORT}/upload`);
  console.log(`🔗 Meetings: http://localhost:${PORT}/api/meetings`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/db-status`);
  console.log(`🤖 Gemini AI: http://localhost:${PORT}/api/gemini`);
  console.log(`💬 Features: Meetings + General Chat + Private Rooms + File Sharing + WebRTC + AI`);
  console.log(`🔊 Audio: Working`);
  console.log(`📁 File Sharing: ✅ COMPLETELY FIXED - Now working for both general and private chats`);
  console.log(`🤖 AI Integration: ✅ Gemini AI Enabled`);
  console.log(`🗄️  Database: ${dbConnected ? 'MongoDB Connected' : 'Using In-Memory Storage'}`);
});