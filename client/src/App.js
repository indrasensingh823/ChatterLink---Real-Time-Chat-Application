// src/App.js
import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import About from './components/About.js';
import AssistantPage from './components/AssistantPage.js'; // add .js
import PrivateChatCreate from './pages/PrivateChatCreate.js';
import PrivateChatRoom from './pages/PrivateChatRoom.js';
import DailyQuote from './pages/DailyQuote.js'; 
import './App.css';
import TypingRace from './pages/TypingRace.js';

const SOCKET_SERVER_URL = window.location.hostname === "localhost"
  ? "http://localhost:5001"
  : `https://chatterlink-real-time-chat-application-2.onrender.com`;

// Header component
const Header = () => (
  <header style={{ backgroundColor: '#282c34', padding: '1rem', color: 'white' }}>
    <h1 className="app-title">💬 ChatterLink</h1>
  </header>
);

// Footer component
const Footer = () => (
  <footer style={{
    backgroundColor: '#282c34',
    padding: '1rem',
    color: 'white',
    marginTop: 'auto',
    textAlign: 'center'
  }}>
    <div style={{ marginBottom: '0.5rem' }}>
      <a href="#" target="_blank" rel="noopener noreferrer"
        style={{ color: 'white', margin: '0 10px', fontSize: '1.5rem', textDecoration: 'none' }}
        aria-label="Instagram"
        onMouseEnter={e => (e.target.style.color = '#e4405f')}
        onMouseLeave={e => (e.target.style.color = 'white')}>
        <i className="fab fa-instagram"></i>
      </a>
      <a href="#" target="_blank" rel="noopener noreferrer"
        style={{ color: 'white', margin: '0 10px', fontSize: '1.5rem', textDecoration: 'none' }}
        aria-label="Facebook"
        onMouseEnter={e => (e.target.style.color = '#1877f2')}
        onMouseLeave={e => (e.target.style.color = 'white')}>
        <i className="fab fa-facebook-f"></i>
      </a>
      <a href="mailto:indrasensingh770@gmail.com"
        style={{ color: 'white', margin: '0 10px', fontSize: '1.5rem', textDecoration: 'none' }}
        aria-label="Email"
        onMouseEnter={e => (e.target.style.color = '#f39c12')}
        onMouseLeave={e => (e.target.style.color = 'white')}>
        <i className="fas fa-envelope"></i>
      </a>
    </div>
    <p style={{ margin: 0 }}>&copy; 2025 ChatterLink</p>
    <span> Made with ❤️ in India</span>
  </footer>
);

// Home component
const Home = () => {
  const navigate = useNavigate();
  return (
    <div style={{ padding: '2rem' }}>
      <h2>Welcome to ChatterLink</h2>
      <p>Stay connected, share your thoughts, and chat instantly with friends — anytime, anywhere.</p>
      <button onClick={() => navigate('/login')}>Get Started</button>
      <button onClick={() => window.location.href = "/About"} className="about-link-btn">
      ℹ️ About
     </button>
     {/* // In your Home.jsx */}
      <button onClick={() => window.location.href = '/assistant'} className="feature-button">
       💬 Use Assistant
      </button>

      <button onClick={() => window.location.href = '/typing-race'} className="feature-button">
      🎮 Typing Race Game
     </button>

    <button onClick={() => window.location.href = '/private/create'} className="feature-button">
     🔒 Start Private Chat Room
    </button>

    <button onClick={() => window.location.href = '/daily-quote'} className="feature-button">
    💡 Daily Quote / Joke
    </button>



    </div>
  );
};

// Login component
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
    <div style={{ padding: '2rem' }}>
      <h2>Enter Your Name to Join Chat</h2>
      <form onSubmit={handleJoin}>
        <input
          type="text"
          placeholder="Your Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={{ padding: '0.5rem', width: '70%', marginBottom: '1rem' }}
        />
        <br />
        <button type="submit" style={{ padding: '0.5rem 1rem' }}>Join</button>
      </form>
    </div>
  );
};

// ChatRoom component
const ChatRoom = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const name = queryParams.get('name');

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const socketRef = useRef();
  const messagesEndRef = useRef(null);
  const [typingUser, setTypingUser] = useState('');
  let typingTimeout;
  const [onlineCount, setOnlineCount] = useState(0);
  




  useEffect(() => {
    socketRef.current = io(SOCKET_SERVER_URL);

    socketRef.current.emit("join", { username: name, room: "default" });

    socketRef.current.on("message", (data) => {
      setMessages(prevMessages => [...prevMessages, data]);
    });

    socketRef.current.on("typing", (username) => {
  setTypingUser(username);

    socketRef.current.on("onlineUsers", (count) => {
    setOnlineCount(count);
  });

  return () => {
    socketRef.current.off("onlineUsers");
  };
});

socketRef.current.on("stopTyping", () => {
  setTypingUser('');
});


    return () => {
      socketRef.current.disconnect();
    };
  }, [name]);

  const handleSend = (e) => {
    e.preventDefault();
    if (message.trim()) {
      socketRef.current.emit("sendMessage", message);
      setMessage('');
    }
  };

  const scrollToBottom = () => {
  messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
};

useEffect(() => {
  scrollToBottom();

//   socketRef.current.on("typing", (username) => {
//   setTypingUser(username);
// });

// socketRef.current.on("stopTyping", () => {
//   setTypingUser('');
// });

}, [messages]);


  return (
    <div style={{ padding: '2rem' }}>
      <h2>Hello, {name} 👋</h2>
      <div className="chat-box" style={{
        border: '1px solid #ccc',
        padding: '1rem',
        height: '300px',
        overflowY: 'auto',
        marginBottom: '1rem',
        backgroundColor: '#f9f9f9',
        borderRadius: '5px',

      }}>

      {typingUser && typingUser !== name && (
         <p style={{ fontStyle: 'italic', color: '#888' }}>
          ✍️ {typingUser} is typing...
      </p>
    )}

<div style={{
  backgroundColor: "transparent",
  padding: "0.5rem 1rem",
  borderBottom: "1px solid #ccc",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  position: 'sticky',
   top: '0',
}}>
  <strong>💬 Chat Room</strong>
  <span style={{ color: 'green' }}>🟢 {onlineCount} users online</span>
</div>

{messages.map((msg, index) => (
  <div key={msg._id || index} className="message-container">
    <div className="avatar">
      {msg.user?.charAt(0).toUpperCase()}
      {/* OR initials: {msg.user?.charAt(0).toUpperCase()} */}
    </div>
    <div className="message-content">
      <div>
        <span className="message-user">{msg.user}</span>
        <span className="message-time">({msg.time})</span>
      </div>
      <div className="message-text">{msg.text}</div>
    </div>
  </div>
))}


{/* ✅ Typing effect after the last message */}
{typingUser && typingUser !== name && (
  <div className="message-container">
    <div className="avatar">⌨️</div>
    <div className="message-content">
      <div className="message-user typing" style={{ fontStyle: 'italic', color: '#888' }}>
        ✍️ {typingUser} is typing...
      </div>
    </div>
  </div>
)}

{/* <div style={{
  backgroundColor: "#f0f0f0",
  padding: "0.5rem 1rem",
  borderBottom: "1px solid #ccc",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center"
}}>
  <strong>💬 Chat Room</strong>
  <span style={{ color: 'green' }}>🟢 {onlineCount} users online</span>
</div> */}

 <div ref={messagesEndRef} /> {/* 👈 Auto-scroll target */}
      </div>
      <form onSubmit={handleSend}>
        <input
          type="text"
          placeholder="Type message..."
          value={message}
          onChange={(e) => {
             setMessage(e.target.value);
             socketRef.current.emit("typing", name);

          // Clear previous timeout
             clearTimeout(typingTimeout);

          // Stop typing after 2 seconds of inactivity
          typingTimeout = setTimeout(() => {
          socketRef.current.emit("stopTyping");
       }, 2000);
    }}
          required
          style={{ padding: '0.5rem', width: '70%' }}    
        />       
        <button type="submit" style={{ padding: '0.5rem', marginLeft: '0.5rem' }}>Send</button>
      </form>
    </div>
  );
};

// Main App
function App() {

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', }}>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/chat" element={<ChatRoom />} />
        <Route path="/About" element={<About />} />
        <Route path="/assistant" element={<AssistantPage />} />

         <Route path="/typing-race" element={<TypingRace />} />
          <Route path="/private/create" element={<PrivateChatCreate />} />
          <Route path="/private/:roomId" element={<PrivateChatRoom />} />
           <Route path="/daily-quote" element={<DailyQuote />} />

      </Routes>
      <Footer />
    </div>
  );
}
export default App;
