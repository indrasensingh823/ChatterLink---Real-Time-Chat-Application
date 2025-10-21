// src/pages/AssistantPage.jsx
import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import "./AssistantPage.css";

function AssistantPage() {
  const [messages, setMessages] = useState([
    {
      sender: "Assistant",
      text: "Hello! I'm your AI assistant powered by Google Gemini. How can I help you today?",
      ts: Date.now(),
      isSystem: true
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    // scroll to bottom when new message arrives
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const addMessage = (msg) => setMessages((prev) => [...prev, msg]);

  const simulateTyping = async (text, callback) => {
    setIsTyping(true);
    // Simulate typing delay based on text length
    const delay = Math.min(Math.max(text.length * 20, 800), 2000);
    await new Promise(resolve => setTimeout(resolve, delay));
    setIsTyping(false);
    callback();
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = { 
      sender: "You", 
      text: input, 
      ts: Date.now(),
      isUser: true 
    };
    addMessage(userMsg);
    const userInput = input;
    setInput("");
    setIsLoading(true);

    try {
      // send to your server route that proxies to Gemini
      const res = await axios.post("/api/gemini/chat", {
        message: userInput,
      });

      const botText = res.data?.reply || "I apologize, but I'm having trouble connecting to my AI brain right now. Please try again in a moment.";
      
      simulateTyping(botText, () => {
        addMessage({ 
          sender: "Assistant", 
          text: botText, 
          ts: Date.now(),
          isAI: true 
        });
        setIsLoading(false);
      });

    } catch (err) {
      console.error("Gemini call failed:", err?.response || err);
      
      simulateTyping(getOfflineResponse(userInput), () => {
        addMessage({
          sender: "Assistant",
          text: getOfflineResponse(userInput),
          ts: Date.now(),
          isAI: true,
          isOffline: true
        });
        setIsLoading(false);
      });
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

const getOfflineResponse = (msg) => {
  const lower = msg.toLowerCase();
  
  // Greetings
  if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) 
    return "Hi there! 👋 I'm ChatterLink Assistant. While I'm having connection issues, I can still help with basic questions about the app!";
  
  // About the Assistant
  if (lower.includes("your name") || lower.includes("who are you")) 
    return "I'm ChatterLink Assistant, your friendly AI helper powered by Google Gemini! 🤖 I'm here to help you with everything about ChatterLink app.";
  if (lower.includes("what are you") || lower.includes("what do you do"))
    return "I'm an AI assistant designed to help you with ChatterLink features, answer questions, and provide support for the app!";
  
  // App Features
  if (lower.includes("feature") || lower.includes("what can you do") || lower.includes("capabilities")) 
    return "ChatterLink has amazing features:\n• Real-time group chatting\n• Private chat rooms with passcodes\n• Typing race games 🎮\n• Video calls with random matching\n• AI Assistant (that's me!)\n• Daily quotes and jokes 💡\n• Online user tracking\n• Message editing & deleting";
  
  if (lower.includes("main feature") || lower.includes("key feature"))
    return "The main features are:\n💬 Real-time Chat Rooms\n🔒 Private Chat Creation\n🎮 Typing Race Competition\n🎥 Video Calling\n🤖 AI Assistant\n💡 Daily Inspiration\n👥 Online User Tracking";
  
  // Chat Features
  if (lower.includes("chat") || lower.includes("messaging") || lower.includes("message")) 
    return "ChatterLink offers real-time messaging with:\n• Instant message delivery\n• Typing indicators\n• Online user lists\n• Message editing & deletion\n• Multiple chat rooms\n• User avatars and timestamps";
  if (lower.includes("group chat") || lower.includes("public chat"))
    return "Join the main chat room to talk with everyone online! You can see who's typing and how many users are online in real-time.";
  if (lower.includes("typing indicator"))
    return "Yes! You can see when other users are typing in the chat room. It shows '✍️ [username] is typing...' below the messages.";
  
  // Private Chat
  if (lower.includes("private chat") || lower.includes("private room") || lower.includes("passcode")) 
    return "Private chats are secure rooms with 4-digit passcodes:\n• Create rooms with unique IDs\n• Share passcode with trusted friends\n• End-to-end secure messaging\n• Room creator controls access\n• Perfect for confidential conversations";
  if (lower.includes("create private") || lower.includes("make private"))
    return "To create a private room:\n1. Go to 'Private Chat' section\n2. Click 'Generate Private Room'\n3. Share the Room ID and Passcode\n4. Invite others using the link";
  if (lower.includes("join private") || lower.includes("enter private"))
    return "To join a private room:\n1. Get the Room ID and Passcode from the creator\n2. Enter the 4-digit passcode\n3. Start secure chatting instantly!";
  
  // Typing Race
  if (lower.includes("typing race") || lower.includes("typing game") || lower.includes("race")) 
    return "The Typing Race is a fun game where you:\n• Compete against other players in real-time\n• Type paragraphs as fast as you can\n• Track your WPM (Words Per Minute) and accuracy\n• See live progress of all players\n• Win by completing the text first! 🏆";
  if (lower.includes("wpm") || lower.includes("words per minute"))
    return "WPM stands for Words Per Minute - it measures how fast you type! Higher WPM means you're a faster typist. Professional typists usually achieve 60-100 WPM.";
  if (lower.includes("how to play typing") || lower.includes("start typing race"))
    return "To play Typing Race:\n1. Enter your display name\n2. Click 'Start Race'\n3. Wait for the countdown\n4. Type the displayed paragraph quickly\n5. Watch your progress and compete!";
  
  // Video Calls
  if (lower.includes("video call") || lower.includes("video chat") || lower.includes("call")) 
    return "Video calling features:\n• One-on-one video calls\n• Random matching with online users\n• Camera and microphone controls\n• Real-time connection status\n• Online user list to call directly\n• Secure WebRTC technology";
  if (lower.includes("random match") || lower.includes("find someone"))
    return "Use 'Random Match' to connect with any online user instantly! The system will automatically pair you with someone available for a video call.";
  if (lower.includes("how to video call") || lower.includes("start video call"))
    return "For video calls:\n1. Allow camera & microphone access\n2. View online users list\n3. Click 'Call' next to any user\n4. Or use 'Random Match' for instant connection\n5. Use controls to toggle camera/mic during call";
  
  // Daily Quotes & Jokes
  if (lower.includes("quote") || lower.includes("joke") || lower.includes("daily")) 
    return "Get your daily dose of inspiration!\n• Motivational quotes in English & Hindi\n• Funny jokes to brighten your day\n• Click 'Show Another' for more content\n• Perfect for starting your day with positivity!";
  if (lower.includes("motivation") || lower.includes("inspiration"))
    return "Visit the Daily Quotes section for:\n💫 Inspirational quotes from famous personalities\n😂 Hilarious jokes in multiple languages\n🔄 Fresh content with each click\n📱 Mobile-friendly design";
  
  // User Management
  if (lower.includes("online user") || lower.includes("who is online") || lower.includes("users online")) 
    return "You can see all online users in:\n• Main chat room sidebar\n• Video call user list\n• Real-time updates when users join/leave\n• User avatars and names for easy identification";
  if (lower.includes("profile") || lower.includes("user profile"))
    return "Currently, users are identified by their display names. Your unique socket ID helps maintain your session and enables real-time features!";
  
  // Technical Questions
  if (lower.includes("how it works") || lower.includes("technology") || lower.includes("tech stack"))
    return "ChatterLink uses modern web technologies:\n• Frontend: React.js with responsive CSS\n• Backend: Node.js with Express\n• Real-time: Socket.IO for instant updates\n• Video: WebRTC for peer-to-peer calls\n• Database: MongoDB for message storage";
  if (lower.includes("socket") || lower.includes("real-time"))
    return "Socket.IO enables real-time features like:\n⚡ Instant message delivery\n👀 Live typing indicators\n👥 Online user tracking\n🎮 Real-time game updates\n📞 WebRTC signaling for video calls";
  if (lower.includes("webrtc") || lower.includes("video technology"))
    return "WebRTC provides:\n• Peer-to-peer video/audio calls\n• No plugins required\n• Secure encrypted connections\n• STUN servers for NAT traversal\n• Direct browser-to-browser communication";
  
  // App Usage & Navigation
  if (lower.includes("how to use") || lower.includes("get started") || lower.includes("beginner"))
    return "Getting started is easy:\n1. Enter your name to join chat\n2. Explore different sections from homepage\n3. Try private chats, typing races, or video calls\n4. Use the AI Assistant for help anytime!";
  if (lower.includes("navigation") || lower.includes("where is") || lower.includes("find"))
    return "Main sections:\n🏠 Home - Overview of all features\n💬 Chat - Main group chatting\n🔒 Private - Secure private rooms\n🎮 Typing Race - Competitive typing game\n🎥 Video Calls - One-on-one video chatting\n🤖 Assistant - AI help (you're here!)\n💡 Daily Quote - Inspiration & jokes";
  
  // Troubleshooting
  if (lower.includes("problem") || lower.includes("issue") || lower.includes("not working") || lower.includes("error"))
    return "Common solutions:\n• Refresh the page if features stop working\n• Check your internet connection\n• Allow camera/microphone permissions for video calls\n• Clear browser cache if needed\n• Try using a different browser";
  if (lower.includes("camera not working") || lower.includes("mic not working"))
    return "For camera/mic issues:\n1. Check browser permissions\n2. Ensure no other app is using camera/mic\n3. Try refreshing the page\n4. Use Chrome/Firefox for best compatibility";
  if (lower.includes("connection problem") || lower.includes("disconnected"))
    return "If you get disconnected:\n1. Check your internet connection\n2. Refresh the page to reconnect\n3. The app will automatically try to reconnect\n4. Your chat history remains until you leave";
  
  // Privacy & Security
  if (lower.includes("privacy") || lower.includes("security") || lower.includes("safe"))
    return "ChatterLink prioritizes your privacy:\n🔒 Private rooms with passcode protection\n🎥 Secure WebRTC video calls\n💬 Encrypted real-time messaging\n🚫 No data stored longer than necessary\n👁️ No unauthorized access to private conversations";
  if (lower.includes("data storage") || lower.includes("message history"))
    return "Message storage:\n• Group chat messages may be stored temporarily\n• Private chat messages are more secure\n• Video calls are peer-to-peer (not stored)\n• Your privacy is our priority!";
  
  // Support & Help
  if (lower.includes("help") || lower.includes("support") || lower.includes("guide")) 
    return "I can help you with:\n• Understanding app features\n• Troubleshooting issues\n• Navigation guidance\n• Technical questions\n• Usage tips and best practices\nWhat specific help do you need?";
  if (lower.includes("contact") || lower.includes("report") || lower.includes("bug"))
    return "For bugs or issues:\n• Use the email in the footer: indrasensingh770@gmail.com\n• Describe the problem in detail\n• Include your browser and device info\n• We'll respond as quickly as possible!";
  
  // Social & About
  if (lower.includes("about app") || lower.includes("about chatterlink") || lower.includes("what is chatterlink"))
    return "ChatterLink is a real-time communication platform with:\n💬 Chat, 🎮 Games, 🎥 Video, and 🤖 AI features\nBuilt with modern web technologies\nDesigned for seamless user experience\nConstantly evolving with new features!";
  if (lower.includes("developer") || lower.includes("creator") || lower.includes("who made"))
    return "ChatterLink is developed with ❤️ in India! The app showcases modern web development capabilities and real-time communication features.";
  if (lower.includes("social") || lower.includes("follow") || lower.includes("instagram") || lower.includes("facebook"))
    return "Connect with us:\n📸 Instagram: ChatterLink\n👍 Facebook: ChatterLink\n📧 Email: indrasensingh770@gmail.com\nWe'd love to hear your feedback!";
  
  // Gratitude & Polite Responses
  if (lower.includes("thank") || lower.includes("thanks") || lower.includes("appreciate")) 
    return "You're welcome! 😊 I'm glad I could help. Is there anything else you'd like to know about ChatterLink?";
  if (lower.includes("good") || lower.includes("awesome") || lower.includes("great") || lower.includes("nice") || lower.includes("cool"))
    return "Thank you! I'm happy you're enjoying ChatterLink! 🎉 What feature would you like to explore next?";
  if (lower.includes("bye") || lower.includes("goodbye") || lower.includes("see you"))
    return "Goodbye! 👋 Feel free to come back anytime if you have more questions about ChatterLink. Have a great day!";
  
  // Default response for unrecognized queries
  return "I'm currently experiencing connection issues to my AI brain, but I'd be happy to help with ChatterLink-related questions! 😊\n\nTry asking about:\n• App features and how to use them\n• Private chat rooms\n• Typing race game\n• Video calling\n• Troubleshooting issues\n• Or any other ChatterLink topic!";
};

  const clearChat = () => {
    setMessages([
      {
        sender: "Assistant",
        text: "Hello! I'm your AI assistant powered by Google Gemini. How can I help you today?",
        ts: Date.now(),
        isSystem: true
      }
    ]);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning!";
    if (hour < 18) return "Good afternoon!";
    return "Good evening!";
  };

  return (
    <div className="assistant-container">
      <div className="assistant-header">
        <div className="header-content">
          <div className="ai-icon">🤖</div>
          <div className="header-text">
            <h1>AI Assistant</h1>
            <p>Powered by Google Gemini • Smart, helpful, and always available</p>
          </div>
        </div>
        <button onClick={clearChat} className="clear-chat-btn">
          <span className="btn-icon">🔄</span>
          Clear Chat
        </button>
      </div>

      <div className="assistant-content">
        <div className="chat-container">
          <div className="welcome-message">
            <div className="welcome-icon">✨</div>
            <div className="welcome-text">
              <h3>{getGreeting()} How can I help you today?</h3>
              <p>Ask me anything about the app, get information, or just chat!</p>
            </div>
          </div>

          <div className="messages-container">
            {messages.map((msg, i) => (
              <div 
                key={i} 
                className={`message-bubble ${
                  msg.isUser ? 'user-message' : 
                  msg.isAI ? 'ai-message' : 
                  'system-message'
                } ${msg.isOffline ? 'offline' : ''}`}
              >
                <div className="message-avatar">
                  {msg.isUser ? '👤' : msg.isAI ? '🤖' : '💬'}
                </div>
                <div className="message-content">
                  <div className="message-header">
                    <span className="message-sender">{msg.sender}</span>
                    <span className="message-time">
                      {new Date(msg.ts).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  <div className="message-text">
                    {msg.text.split('\n').map((line, index) => (
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
            
            <div ref={bottomRef} />
          </div>

          <div className="input-section">
            <div className="input-container">
              <div className="input-wrapper">
                <textarea
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Message AI Assistant..."
                  className="message-input"
                  maxLength="500"
                />
                <div className="input-actions">
                  <span className="char-count">{input.length}/500</span>
                  <button 
                    onClick={handleSend} 
                    disabled={isLoading || !input.trim()}
                    className="send-button"
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

        <div className="sidebar">
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