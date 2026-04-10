// src/App.js
import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation, Link } from 'react-router-dom';
import About from './components/About.js';
import AssistantPage from './components/AssistantPage.js';
import PrivateChatCreate from './pages/PrivateChatCreate.js';
import PrivateChatRoom from './pages/PrivateChatRoom.js';
import DailyQuote from './pages/DailyQuote.js';
import TypingRace from './pages/TypingRace.js';
import VideoCall from './pages/VideoCall.js';
import MeetingCreate from "./pages/MeetingCreate.js";
import MeetingRoom from "./pages/MeetingRoom.js";
import './App.css';

// ✅ Backend URL (Production + Local)
const SOCKET_SERVER_URL =
  process.env.REACT_APP_SOCKET_SERVER_URL ||
  (window.location.hostname === "localhost"
    ? "http://localhost:5001"
    : "https://chatterlink-server.onrender.com");

// Enhanced Header Component
const Header = () => (
  <header className="app-header">
    <div className="header-content">
      <div className="logo-container">
        <img src="/logo.png" alt="ChatterLink Logo" className="logo-img" />
        <div className="brand-text">
          <h1 className="app-title">ChatterLink</h1>
          <p className="app-tagline">Connect • Chat • Collaborate</p>
        </div>
      </div>
      <nav className="nav-links">
        <Link to="/" className="nav-link">Home</Link>
        <Link to="/about" className="nav-link">About</Link>
        <Link to="/assistant" className="nav-link">AI Assistant</Link>
      </nav>
    </div>
  </header>
);

// Enhanced Footer Component
const Footer = () => (
  <footer className="app-footer">
    <div className="footer-content">
      <div className="social-links">
        <a href="https://instagram.com" className="social-link instagram" aria-label="Instagram">
          <i className="fab fa-instagram"></i>
        </a>
        <a href="https://facebook.com" className="social-link facebook" aria-label="Facebook">
          <i className="fab fa-facebook-f"></i>
        </a>
        <a href="mailto:indrasensingh770@gmail.com" className="social-link email" aria-label="Email">
          <i className="fas fa-envelope"></i>
        </a>
      </div>
      <div className="footer-info">
        <p>&copy; 2026 ChatterLink - Connect, Chat, Collaborate</p>
        <span className="made-with-love">Made with ❤️ in India</span>
      </div>
    </div>
  </footer>
);

// Enhanced Home Component
const Home = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: "🤖",
      title: "AI Assistant",
      description: "Get smart help with our AI-powered assistant",
      path: "/assistant",
      color: "#4CAF50"
    },
    {
      icon: "🎮",
      title: "Typing Race",
      description: "Test your typing speed against others",
      path: "/typing-race",
      color: "#2196F3"
    },
    {
      icon: "🔒",
      title: "Private Chat",
      description: "Secure private rooms with passcode protection",
      path: "/private/create",
      color: "#FF9800"
    },
    {
      icon: "💡",
      title: "Daily Inspiration",
      description: "Get your daily dose of quotes and jokes",
      path: "/daily-quote",
      color: "#9C27B0"
    },
    {
      icon: "🎥",
      title: "Video Calls",
      description: "High-quality video calls with friends",
      path: "/video",
      color: "#F44336"
    },
    {
      icon: "🗓️",
      title: "Meetings",
      description: "Create and join virtual meetings",
      path: "/meeting/create",
      color: "#607D8B"
    }
  ];

  return (
    <div className="home-container">
      <div className="hero-section">
        <div className="hero-content">
          <h2 className="hero-title">Welcome to ChatterLink</h2>
          <p className="hero-description">
            Experience the future of real-time communication. Connect with friends,
            collaborate with teams, and enjoy seamless chatting with advanced features.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="cta-button primary"
          >
            🚀 Get Started
          </button>
        </div>
        <div className="hero-graphics">
          <div className="floating-icon">💬</div>
          <div className="floating-icon">🎮</div>
          <div className="floating-icon">🎥</div>
        </div>
      </div>

      <div className="features-section">
        <h3 className="section-title">Explore Amazing Features</h3>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div
              key={index}
              className="feature-card"
              onClick={() => navigate(feature.path)}
              style={{ '--accent-color': feature.color }}
            >
              <div className="feature-icon" style={{ backgroundColor: feature.color }}>
                {feature.icon}
              </div>
              <h4 className="feature-title">{feature.title}</h4>
              <p className="feature-description">{feature.description}</p>
              <div className="feature-arrow">→</div>
            </div>
          ))}
        </div>
      </div>

      <div className="stats-section">
        <div className="stat-item">
          <div className="stat-number">10K+</div>
          <div className="stat-label">Active Users</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">99.9%</div>
          <div className="stat-label">Uptime</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">24/7</div>
          <div className="stat-label">Support</div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Login Component
const Login = () => {
  const [name, setName] = useState('');
  const navigate = useNavigate();

  const handleJoin = (e) => {
    e.preventDefault();
    if (name.trim()) {
      navigate(`/chat?name=${encodeURIComponent(name)}`);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h2>Join the Conversation</h2>
          <p>Enter your name to start chatting</p>
        </div>
        <form onSubmit={handleJoin} className="login-form">
          <div className="input-group">
            <input
              type="text"
              placeholder="Enter your name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="name-input"
            />
            <div className="input-icon">👤</div>
          </div>
          <button type="submit" className="login-button">
            Join Chat Room
          </button>
        </form>
        <div className="login-features">
          <div className="feature-tag">🎯 Real-time Messaging</div>
          <div className="feature-tag">👥 Group Chats</div>
          <div className="feature-tag">🔒 Secure</div>
        </div>
      </div>
    </div>
  );
};

// Enhanced ChatRoom Component with File Sharing
const ChatRoom = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const name = queryParams.get('name');

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [typingUser, setTypingUser] = useState('');
  const [onlineCount, setOnlineCount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!name) return;

    socketRef.current = io(SOCKET_SERVER_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    socketRef.current.on("connect", () => {
      socketRef.current.emit("join", { username: name, room: "default" });
      socketRef.current.emit("request-online-list");
    });

    socketRef.current.on("message", (data) => {
      setMessages((prevMessages) => [...prevMessages, data]);
    });

    socketRef.current.on("file_uploaded", (data) => {
      setMessages((prevMessages) => [...prevMessages, data]);
    });

    socketRef.current.on("typing", (username) => {
      setTypingUser(username);
    });

    socketRef.current.on("stopTyping", () => {
      setTypingUser('');
    });

    socketRef.current.on("onlineUsersCount", (count) => {
      setOnlineCount(count);
    });

    socketRef.current.on("onlineUsersList", (usersList) => {
      setOnlineUsers(usersList);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      clearTimeout(typingTimeoutRef.current);
    };
  }, [name]);

  const handleSend = (e) => {
    e.preventDefault();
    if (message.trim() && socketRef.current) {
      socketRef.current.emit("sendMessage", message);
      setMessage('');
      socketRef.current.emit("stopTyping");
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleTyping = () => {
    if (!socketRef.current) return;

    socketRef.current.emit("typing", name);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current.emit("stopTyping");
    }, 2000);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File size too large. Please select a file smaller than 10MB.');
      return;
    }

    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('username', name);
    formData.append('room', 'default');

    try {
      const response = await fetch(`${SOCKET_SERVER_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();

      if (socketRef.current) {
        socketRef.current.emit('file_upload', {
          filename: data.filename,
          originalName: file.name,
          fileType: file.type,
          fileSize: file.size,
          fileUrl: data.fileUrl,
          username: name
        });
      }

    } catch (error) {
      console.error('❌ Upload error:', error);
      alert('File upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.startsWith('audio/')) return '🎵';
    if (fileType.startsWith('video/')) return '🎬';
    if (fileType === 'application/pdf') return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('sheet') || fileType.includes('excel')) return '📊';
    return '📎';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="chatroom-container">
      <div className="chatroom-header">
        <div className="chatroom-info">
          <h2>💬 General Chat</h2>
          <div className="online-indicator">
            <span className="online-dot"></span>
            {onlineCount} users online
          </div>
        </div>
        <div className="user-welcome">
          Welcome, <span className="username">{name}</span>! 👋
        </div>
      </div>

      <div className="chatroom-layout">
        <div className="online-users-sidebar">
          <h3>Online Users ({onlineUsers.length})</h3>
          <div className="users-list">
            {onlineUsers.map((user, index) => (
              <div key={user.id || index} className="user-item">
                <div className="user-avatar">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <span className="user-name">{user.name}</span>
                <div className="user-status"></div>
              </div>
            ))}
          </div>
        </div>

        <div className="chat-area">
          <div className="messages-container">
            {messages.map((msg, index) => (
              <div
                key={msg._id || index}
                className={`message-bubble ${msg.user === name ? 'own-message' : ''} ${msg.file ? 'file-message' : ''}`}
              >
                {msg.user !== name && (
                  <div className="message-avatar">
                    {msg.user?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="message-content">
                  {msg.user !== name && (
                    <div className="message-sender">{msg.user}</div>
                  )}

                  {msg.file ? (
                    <div className="file-message-content">
                      <div className="file-info">
                        <span className="file-icon">
                          {getFileIcon(msg.file.fileType)}
                        </span>
                        <div className="file-details">
                          <div className="file-name">{msg.file.originalName}</div>
                          <div className="file-size">{formatFileSize(msg.file.fileSize)}</div>
                        </div>
                      </div>
                      <a
                        href={msg.file.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="download-button"
                      >
                        Download
                      </a>
                    </div>
                  ) : (
                    <div className="message-text">{msg.text}</div>
                  )}

                  <div className="message-time">
                    {msg.time || formatTime(Date.now())}
                  </div>
                </div>
              </div>
            ))}

            {typingUser && typingUser !== name && (
              <div className="typing-indicator">
                <div className="typing-avatar">
                  {typingUser.charAt(0).toUpperCase()}
                </div>
                <div className="typing-content">
                  <div className="typing-text">✍️ {typingUser} is typing</div>
                  <div className="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="message-form">
            <div className="input-container">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                style={{ display: 'none' }}
                id="file-input"
              />
              <button
                type="button"
                className="file-upload-button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? '📤' : '📎'}
              </button>

              <input
                type="text"
                placeholder="Type your message..."
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  handleTyping();
                }}
                required
                className="message-input"
              />
              <button type="submit" className="send-button">
                <span className="send-text">Send</span>
                <span className="send-icon">➤</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/chat" element={<ChatRoom />} />
          <Route path="/about" element={<About />} />
          <Route path="/assistant" element={<AssistantPage />} />
          <Route path="/typing-race" element={<TypingRace />} />
          <Route path="/private/create" element={<PrivateChatCreate />} />
          <Route path="/private/:roomId" element={<PrivateChatRoom />} />
          <Route path="/daily-quote" element={<DailyQuote />} />
          <Route path="/video" element={<VideoCall />} />
          <Route path="/meeting/create" element={<MeetingCreate />} />
          <Route path="/meeting/:link" element={<MeetingRoom />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}