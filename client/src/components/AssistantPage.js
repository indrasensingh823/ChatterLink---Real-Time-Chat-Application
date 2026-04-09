// src/pages/AssistantPage.jsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import "./AssistantPage.css";

function AssistantPage() {
  const [messages, setMessages] = useState([
    {
      sender: "Assistant",
      text: "Hello! I'm your AI assistant powered by Google Gemini. How can I help you today?",
      ts: Date.now(),
      isSystem: true,
    },
  ]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const isMountedRef = useRef(true);

  // =========================
  // COMPONENT LIFECYCLE
  // =========================
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // =========================
  // AUTO SCROLL
  // =========================
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, isTyping]);

  // =========================
  // AUTO RESIZE TEXTAREA
  // =========================
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    const newHeight = Math.min(textarea.scrollHeight, 140); // max height
    textarea.style.height = `${newHeight}px`;
  }, [input]);

  // =========================
  // HELPERS
  // =========================
  const addMessage = useCallback((msg) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const getGreeting = useCallback(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning!";
    if (hour < 18) return "Good afternoon!";
    return "Good evening!";
  }, []);

  const clearChat = useCallback(() => {
    setMessages([
      {
        sender: "Assistant",
        text: "Hello! I'm your AI assistant powered by Google Gemini. How can I help you today?",
        ts: Date.now(),
        isSystem: true,
      },
    ]);
  }, []);

  const simulateTyping = useCallback(async (text, callback) => {
    if (!isMountedRef.current) return;

    setIsTyping(true);

    // Smart delay based on message length
    const delay = Math.min(Math.max(text.length * 18, 700), 2200);

    await new Promise((resolve) => setTimeout(resolve, delay));

    if (!isMountedRef.current) return;

    setIsTyping(false);
    callback();
  }, []);

  // =========================
  // OFFLINE RESPONSE ENGINE
  // =========================
  const getOfflineResponse = useCallback((msg) => {
    const lower = msg.toLowerCase();

    // Greetings
    if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey"))
      return "Hi there! 👋 I'm ChatterLink Assistant. While I'm having connection issues, I can still help with basic questions about the app!";

    // About the Assistant
    if (lower.includes("your name") || lower.includes("who are you"))
      return "I'm ChatterLink Assistant, your friendly AI helper powered by ChatterLink AI! 🤖 I'm here to help you with everything about ChatterLink app.";

    if (lower.includes("what are you") || lower.includes("what do you do"))
      return "I'm an AI assistant designed to help you with ChatterLink features, answer questions, and provide support for the app!";

    // App Features
    if (lower.includes("feature") || lower.includes("what can you do") || lower.includes("capabilities"))
      return `ChatterLink has amazing features:
• Real-time group chatting
• Private chat rooms with passcodes
• Typing race games 🎮
• Video calls with random matching
• AI Assistant (that's me!)
• Daily quotes and jokes 💡
• Online user tracking
• Message editing & deleting`;

    if (lower.includes("main feature") || lower.includes("key feature"))
      return `The main features are:
💬 Real-time Chat Rooms
🔒 Private Chat Creation
🎮 Typing Race Competition
🎥 Video Calling
🤖 AI Assistant
💡 Daily Inspiration
👥 Online User Tracking`;

    // Chat Features
    if (lower.includes("chat") || lower.includes("messaging") || lower.includes("message"))
      return `ChatterLink offers real-time messaging with:
• Instant message delivery
• Typing indicators
• Online user lists
• Message editing & deletion
• Multiple chat rooms
• User avatars and timestamps`;

    if (lower.includes("group chat") || lower.includes("public chat"))
      return "Join the main chat room to talk with everyone online! You can see who's typing and how many users are online in real-time.";

    if (lower.includes("typing indicator"))
      return "Yes! You can see when other users are typing in the chat room. It shows '✍️ [username] is typing...' below the messages.";

    // Private Chat
    if (lower.includes("private chat") || lower.includes("private room") || lower.includes("passcode"))
      return `Private chats are secure rooms with 4-digit passcodes:
• Create rooms with unique IDs
• Share passcode with trusted friends
• End-to-end secure messaging
• Room creator controls access
• Perfect for confidential conversations`;

    if (lower.includes("create private") || lower.includes("make private"))
      return `To create a private room:
1. Go to 'Private Chat' section
2. Click 'Generate Private Room'
3. Share the Room ID and Passcode
4. Invite others using the link`;

    if (lower.includes("join private") || lower.includes("enter private"))
      return `To join a private room:
1. Get the Room ID and Passcode from the creator
2. Enter the 4-digit passcode
3. Start secure chatting instantly!`;

    // Typing Race
    if (lower.includes("typing race") || lower.includes("typing game") || lower.includes("race"))
      return `The Typing Race is a fun game where you:
• Compete against other players in real-time
• Type paragraphs as fast as you can
• Track your WPM (Words Per Minute) and accuracy
• See live progress of all players
• Win by completing the text first! 🏆`;

    if (lower.includes("wpm") || lower.includes("words per minute"))
      return "WPM stands for Words Per Minute - it measures how fast you type! Higher WPM means you're a faster typist. Professional typists usually achieve 60-100 WPM.";

    if (lower.includes("how to play typing") || lower.includes("start typing race"))
      return `To play Typing Race:
1. Enter your display name
2. Click 'Start Race'
3. Wait for the countdown
4. Type the displayed paragraph quickly
5. Watch your progress and compete!`;

    // Video Calls
    if (lower.includes("video call") || lower.includes("video chat") || lower.includes("call"))
      return `Video calling features:
• One-on-one video calls
• Random matching with online users
• Camera and microphone controls
• Real-time connection status
• Online user list to call directly
• Secure WebRTC technology`;

    if (lower.includes("random match") || lower.includes("find someone"))
      return "Use 'Random Match' to connect with any online user instantly! The system will automatically pair you with someone available for a video call.";

    if (lower.includes("how to video call") || lower.includes("start video call"))
      return `For video calls:
1. Allow camera & microphone access
2. View online users list
3. Click 'Call' next to any user
4. Or use 'Random Match' for instant connection
5. Use controls to toggle camera/mic during call`;

    // Daily Quotes & Jokes
    if (lower.includes("quote") || lower.includes("joke") || lower.includes("daily"))
      return `Get your daily dose of inspiration!
• Motivational quotes in English & Hindi
• Funny jokes to brighten your day
• Click 'Show Another' for more content
• Perfect for starting your day with positivity!`;

    if (lower.includes("motivation") || lower.includes("inspiration"))
      return `Visit the Daily Quotes section for:
💫 Inspirational quotes from famous personalities
😂 Hilarious jokes in multiple languages
🔄 Fresh content with each click
📱 Mobile-friendly design`;

    // User Management
    if (lower.includes("online user") || lower.includes("who is online") || lower.includes("users online"))
      return `You can see all online users in:
• Main chat room sidebar
• Video call user list
• Real-time updates when users join/leave
• User avatars and names for easy identification`;

    if (lower.includes("profile") || lower.includes("user profile"))
      return "Currently, users are identified by their display names. Your unique socket ID helps maintain your session and enables real-time features!";

    // Technical Questions
    if (lower.includes("how it works") || lower.includes("technology") || lower.includes("tech stack"))
      return `ChatterLink uses modern web technologies:
• Frontend: React.js with responsive CSS
• Backend: Node.js with Express
• Real-time: Socket.IO for instant updates
• Video: WebRTC for peer-to-peer calls
• Database: MongoDB for message storage`;

    if (lower.includes("socket") || lower.includes("real-time"))
      return `Socket.IO enables real-time features like:
⚡ Instant message delivery
👀 Live typing indicators
👥 Online user tracking
🎮 Real-time game updates
📞 WebRTC signaling for video calls`;

    if (lower.includes("webrtc") || lower.includes("video technology"))
      return `WebRTC provides:
• Peer-to-peer video/audio calls
• No plugins required
• Secure encrypted connections
• STUN servers for NAT traversal
• Direct browser-to-browser communication`;

    // App Usage & Navigation
    if (lower.includes("how to use") || lower.includes("get started") || lower.includes("beginner"))
      return `Getting started is easy:
1. Enter your name to join chat
2. Explore different sections from homepage
3. Try private chats, typing races, or video calls
4. Use the AI Assistant for help anytime!`;

    if (lower.includes("navigation") || lower.includes("where is") || lower.includes("find"))
      return `Main sections:
🏠 Home - Overview of all features
💬 Chat - Main group chatting
🔒 Private - Secure private rooms
🎮 Typing Race - Competitive typing game
🎥 Video Calls - One-on-one video chatting
🤖 Assistant - AI help (you're here!)
💡 Daily Quote - Inspiration & jokes`;

    // Troubleshooting
    if (lower.includes("problem") || lower.includes("issue") || lower.includes("not working") || lower.includes("error"))
      return `Common solutions:
• Refresh the page if features stop working
• Check your internet connection
• Allow camera/microphone permissions for video calls
• Clear browser cache if needed
• Try using a different browser`;

    if (lower.includes("camera not working") || lower.includes("mic not working"))
      return `For camera/mic issues:
1. Check browser permissions
2. Ensure no other app is using camera/mic
3. Try refreshing the page
4. Use Chrome/Firefox for best compatibility`;

    if (lower.includes("connection problem") || lower.includes("disconnected"))
      return `If you get disconnected:
1. Check your internet connection
2. Refresh the page to reconnect
3. The app will automatically try to reconnect
4. Your chat history remains until you leave`;

    // Privacy & Security
    if (lower.includes("privacy") || lower.includes("security") || lower.includes("safe"))
      return `ChatterLink prioritizes your privacy:
🔒 Private rooms with passcode protection
🎥 Secure WebRTC video calls
💬 Encrypted real-time messaging
🚫 No data stored longer than necessary
👁️ No unauthorized access to private conversations`;

    if (lower.includes("data storage") || lower.includes("message history"))
      return `Message storage:
• Group chat messages may be stored temporarily
• Private chat messages are more secure
• Video calls are peer-to-peer (not stored)
• Your privacy is our priority!`;

    // Support & Help
    if (lower.includes("help") || lower.includes("support") || lower.includes("guide"))
      return `I can help you with:
• Understanding app features
• Troubleshooting issues
• Navigation guidance
• Technical questions
• Usage tips and best practices
What specific help do you need?`;

    if (lower.includes("contact") || lower.includes("report") || lower.includes("bug"))
      return `For bugs or issues:
• Use the email in the footer: indrasensingh770@gmail.com
• Describe the problem in detail
• Include your browser and device info
• We'll respond as quickly as possible!`;

    // Social & About
    if (lower.includes("about app") || lower.includes("about chatterlink") || lower.includes("what is chatterlink"))
      return `ChatterLink is a real-time communication platform with:
💬 Chat, 🎮 Games, 🎥 Video, and 🤖 AI features
Built with modern web technologies
Designed for seamless user experience
Constantly evolving with new features!`;

    if (lower.includes("developer") || lower.includes("creator") || lower.includes("who made"))
      return "ChatterLink is developed with ❤️ in India! The app showcases modern web development capabilities and real-time communication features.";

    if (lower.includes("social") || lower.includes("follow") || lower.includes("instagram") || lower.includes("facebook"))
      return `Connect with us:
📸 Instagram: ChatterLink
👍 Facebook: ChatterLink
📧 Email: indrasensingh770@gmail.com
We'd love to hear your feedback!`;

    // Gratitude & Polite Responses
    if (lower.includes("thank") || lower.includes("thanks") || lower.includes("appreciate"))
      return "You're welcome! 😊 I'm glad I could help. Is there anything else you'd like to know about ChatterLink?";

    if (lower.includes("good") || lower.includes("awesome") || lower.includes("great") || lower.includes("nice") || lower.includes("cool"))
      return "Thank you! I'm happy you're enjoying ChatterLink! 🎉 What feature would you like to explore next?";

    if (lower.includes("bye") || lower.includes("goodbye") || lower.includes("see you"))
      return "Goodbye! 👋 Feel free to come back anytime if you have more questions about ChatterLink. Have a great day!";

    return `I'm currently experiencing connection issues to my AI brain, but I'd be happy to help with ChatterLink-related questions! 😊

Try asking about:
• App features and how to use them
• Private chat rooms
• Typing race game
• Video calling
• Troubleshooting issues
• Or any other ChatterLink topic!`;
  }, []);

  // =========================
  // SEND MESSAGE
  // =========================
  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userInput = input.trim();

    const userMsg = {
      sender: "You",
      text: userInput,
      ts: Date.now(),
      isUser: true,
    };

    addMessage(userMsg);
    setInput("");
    setIsLoading(true);

    try {
      const res = await axios.post("/api/gemini/chat", {
        message: userInput,
      });

      const botText =
        res.data?.reply ||
        "I apologize, but I'm having trouble connecting to my AI brain right now. Please try again in a moment.";

      await simulateTyping(botText, () => {
        if (!isMountedRef.current) return;

        addMessage({
          sender: "Assistant",
          text: botText,
          ts: Date.now(),
          isAI: true,
        });
        setIsLoading(false);
      });
    } catch (err) {
      console.error("Gemini call failed:", err?.response || err);

      const offlineReply = getOfflineResponse(userInput);

      await simulateTyping(offlineReply, () => {
        if (!isMountedRef.current) return;

        addMessage({
          sender: "Assistant",
          text: offlineReply,
          ts: Date.now(),
          isAI: true,
          isOffline: true,
        });
        setIsLoading(false);
      });
    }
  }, [input, isLoading, addMessage, simulateTyping, getOfflineResponse]);

  // =========================
  // KEYBOARD SEND
  // =========================
  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // =========================
  // RENDER
  // =========================
  return (
    <div className="assistant-container">
      {/* HEADER */}
      <div className="assistant-header">
        <div className="header-content">
          <div className="ai-icon">🤖</div>
          <div className="header-text">
            <h1>AI Assistant</h1>
            <p>Powered by Google Gemini • Smart, helpful, and always available</p>
          </div>
        </div>

        <button onClick={clearChat} className="clear-chat-btn" aria-label="Clear Chat">
          <span className="btn-icon">🔄</span>
          <span>Clear Chat</span>
        </button>
      </div>

      {/* MAIN CONTENT */}
      <div className="assistant-content">
        {/* CHAT AREA */}
        <div className="chat-container">
          {/* WELCOME */}
          <div className="welcome-message">
            <div className="welcome-icon">✨</div>
            <div className="welcome-text">
              <h3>{getGreeting()} How can I help you today?</h3>
              <p>Ask me anything about the app, get information, or just chat!</p>
            </div>
          </div>

          {/* MESSAGES */}
          <div className="messages-container">
            {messages.map((msg, i) => (
              <div
                key={`${msg.ts}-${i}`}
                className={`message-bubble ${
                  msg.isUser
                    ? "user-message"
                    : msg.isAI
                    ? "ai-message"
                    : "system-message"
                } ${msg.isOffline ? "offline" : ""}`}
              >
                <div className="message-avatar">
                  {msg.isUser ? "👤" : msg.isAI ? "🤖" : "💬"}
                </div>

                <div className="message-content">
                  <div className="message-header">
                    <span className="message-sender">{msg.sender}</span>
                    <span className="message-time">
                      {new Date(msg.ts).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div className="message-text">
                    {msg.text.split("\n").map((line, index) => (
                      <p key={index}>{line}</p>
                    ))}
                  </div>

                  {msg.isOffline && (
                    <div className="offline-indicator">
                      <span className="offline-icon">🌐</span>
                      Offline Mode
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* TYPING */}
            {isLoading && isTyping && (
              <div className="message-bubble ai-message typing">
                <div className="message-avatar">🤖</div>
                <div className="message-content">
                  <div className="message-header">
                    <span className="message-sender">Assistant</span>
                    <span className="typing-text">Typing...</span>
                  </div>

                  <div className="typing-indicator">
                    <div className="typing-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* LOADING ONLY */}
            {isLoading && !isTyping && (
              <div className="message-bubble ai-message typing">
                <div className="message-avatar">🤖</div>
                <div className="message-content">
                  <div className="message-header">
                    <span className="message-sender">Assistant</span>
                    <span className="typing-text">Thinking...</span>
                  </div>

                  <div className="typing-indicator">
                    <div className="typing-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* INPUT */}
          <div className="input-section">
            <div className="input-container">
              <div className="input-wrapper">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Message AI Assistant..."
                  className="message-input"
                  maxLength={500}
                />

                <div className="input-actions">
                  <span className="char-count">{input.length}/500</span>

                  <button
                    onClick={handleSend}
                    disabled={isLoading || !input.trim()}
                    className="send-button"
                    aria-label="Send Message"
                  >
                    {isLoading ? (
                      <div className="send-spinner"></div>
                    ) : (
                      <span className="send-icon">➤</span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="input-hint">
              Press Enter to send • Shift+Enter for new line
            </div>
          </div>
        </div>

        {/* SIDEBAR */}
        <div className="sidebar">
          {/* CAPABILITIES */}
          <div className="capabilities-panel">
            <div className="panel-header">
              <h3>Capabilities</h3>
              <div className="panel-icon">🚀</div>
            </div>

            <div className="capabilities-list">
              <div className="capability-item">
                <span className="capability-icon">💡</span>
                <div className="capability-text">
                  <strong>Smart Responses</strong>
                  <span>Powered by Google Gemini AI</span>
                </div>
              </div>

              <div className="capability-item">
                <span className="capability-icon">🌐</span>
                <div className="capability-text">
                  <strong>Online/Offline</strong>
                  <span>Works even without internet</span>
                </div>
              </div>

              <div className="capability-item">
                <span className="capability-icon">⚡</span>
                <div className="capability-text">
                  <strong>Quick Learning</strong>
                  <span>Understands context and remembers</span>
                </div>
              </div>

              <div className="capability-item">
                <span className="capability-icon">🛡️</span>
                <div className="capability-text">
                  <strong>Safe & Secure</strong>
                  <span>Your conversations are private</span>
                </div>
              </div>
            </div>
          </div>

          {/* SUGGESTIONS */}
          <div className="suggestions-panel">
            <div className="panel-header">
              <h3>Try Asking</h3>
              <div className="panel-icon">💭</div>
            </div>

            <div className="suggestions-list">
              <button
                className="suggestion-btn"
                onClick={() => setInput("What are the main features of this chat app?")}
              >
                What are the main features?
              </button>

              <button
                className="suggestion-btn"
                onClick={() => setInput("How do I create a private chat room?")}
              >
                How to create private rooms?
              </button>

              <button
                className="suggestion-btn"
                onClick={() => setInput("Tell me about the typing race game")}
              >
                About typing race game
              </button>

              <button
                className="suggestion-btn"
                onClick={() => setInput("How does video calling work here?")}
              >
                Video calling guide
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AssistantPage;