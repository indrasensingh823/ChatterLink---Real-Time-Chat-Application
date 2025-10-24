// server/index.js - VERCEL COMPATIBLE VERSION
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import geminiRoutes from "./routes/gemini.js";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

// 📥 Load .env
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔗 MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/chatterlink";

// 🆕 VERCEL FIX: Use memory storage instead of file system
const memoryStorage = multer.memoryStorage();

// 🆕 VERCEL FIX: Remove file system dependencies
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";
const NODE_ENV = process.env.NODE_ENV || "development";

console.log(`🌐 Environment: ${NODE_ENV}`);
console.log(`🔗 Frontend URL: ${CLIENT_URL}`);

// 🧠 In-Memory Storage for Meetings
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

// 🆕 VERCEL FIX: Conditional DB connection
if (process.env.VERCEL !== '1') {
  connectDB();
}

// 🚀 Initialize Express
const app = express();

// 🆕 ENHANCED CORS CONFIG - Frontend Integration + Localhost
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      CLIENT_URL,
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "https://chatter-link-real-time-chat-applica-ruddy.vercel.app/",
      process.env.CLIENT_URL
    ].filter(Boolean);

    if (allowedOrigins.indexOf(origin) !== -1 || NODE_ENV === 'development') {
      callback(null, true);
    } else {
      console.log(`🚫 CORS blocked for origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ✅ Use routes
app.use("/api/gemini", geminiRoutes);

// 📁 File Upload Configurations - VERCEL COMPATIBLE
const uploadGeneral = multer({
  storage: memoryStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
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
  }
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

// 🆕 VERCEL FIX: Simplified file upload (memory storage only)
app.post('/upload', uploadGeneral.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: 'No file uploaded' 
      });
    }

    // 🆕 VERCEL FIX: Return file data directly (no file system storage)
    const fileInfo = {
      originalName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      buffer: req.file.buffer.toString('base64'), // Convert to base64 for client
      encoding: req.file.encoding
    };
    
    console.log(`📁 FILE UPLOAD SUCCESS: ${req.file.originalname} (${req.file.size} bytes)`);
    
    res.json({
      success: true,
      message: 'File uploaded successfully (stored in memory)',
      fileInfo: fileInfo,
      note: 'In Vercel environment, files are stored in memory temporarily'
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

// 🆕 ENHANCED Health Check with Frontend Integration Info
app.get("/", (req, res) => {
  res.json({ 
    success: true,
    message: "✅ ChatterLink Server - API is running!",
    database: dbConnected ? "MongoDB Connected" : "In-Memory Storage",
    environment: NODE_ENV,
    platform: process.env.VERCEL ? 'Vercel Serverless' : 'Traditional Server',
    frontendUrl: CLIENT_URL,
    inMemoryMeetingsCount: inMemoryMeetings.size,
    timestamp: new Date().toISOString(),
    integration: "Frontend-Backend Connection: ✅ ACTIVE",
    note: process.env.VERCEL ? 'Running on Vercel - Some features limited' : 'Running on traditional server'
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
    storage: process.env.VERCEL ? "memory" : "file system",
    note: process.env.VERCEL ? "Files stored temporarily in memory" : "Files stored on server"
  });
});

// Database status endpoint
app.get("/api/db-status", (req, res) => {
  res.json({
    success: true,
    database: dbConnected ? "connected" : "disconnected",
    storage: dbConnected ? "mongodb" : "in-memory",
    inMemoryMeetingsCount: inMemoryMeetings.size,
    environment: NODE_ENV,
    platform: process.env.VERCEL ? 'Vercel' : 'Traditional',
    frontendIntegration: "active",
    message: dbConnected ? 
      "MongoDB is connected and working" : 
      "Using in-memory storage (MongoDB not available)"
  });
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

// 🆕 VERCEL FIX: Export the app for serverless functions - TOP LEVEL
export default app;

// 🆕 VERCEL FIX: Traditional server startup (only if not in Vercel)
if (process.env.VERCEL !== '1') {
  import('http').then(({ createServer }) => {
    import('socket.io').then(({ Server }) => {
      
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

      // 🌐 HTTP Server + Socket.IO (Traditional server only)
      const server = createServer(app);
      const PORT = process.env.PORT || 5001;

      // Socket.IO Config
      const io = new Server(server, {
        cors: { 
          origin: function (origin, callback) {
            const allowedOrigins = [
              CLIENT_URL,
              "http://localhost:3000",
              "http://127.0.0.1:3000",
              "https://chatter-link-real-time-chat-applica-ruddy.vercel.app/",
              process.env.CLIENT_URL
            ].filter(Boolean);

            if (allowedOrigins.indexOf(origin) !== -1 || NODE_ENV === 'development') {
              callback(null, true);
            } else {
              console.log(`🚫 Socket.IO CORS blocked for origin: ${origin}`);
              callback(new Error('Not allowed by CORS'));
            }
          },
          methods: ["GET", "POST"],
          credentials: true
        },
        maxHttpBufferSize: 1e8
      });

      // Socket.IO Logic
      io.on("connection", (socket) => {
        onlineUsersCount++;
        emitOnlineCount();
        console.log(`🟢 Socket connected: ${socket.id}`);

        // Basic Chat Features
        socket.on("request-online-list", () => {
          const list = Object.entries(users).map(([id, name]) => ({ id, name }));
          socket.emit("onlineUsersList", list);
        });

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

        socket.on("typing", (data) => {
          socket.broadcast.emit("typing", data);
        });
        
        socket.on("stopTyping", () => {
          socket.broadcast.emit("stopTyping");
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

        socket.on("disconnect", () => {
          onlineUsersCount--;
          emitOnlineCount();
          cleanupUser(socket.id);
          emitOnlineList();
          console.log(`🔴 Socket disconnected: ${socket.id}`);
        });
      });

      // Start Traditional Server
      server.listen(PORT, () => {
        console.log(`🚀 Traditional Server running on port ${PORT}`);
        console.log(`🔗 Socket.IO enabled: http://localhost:${PORT}`);
        console.log(`💬 Real-time chat features: ✅ ACTIVE`);
      });
    });
  });
}