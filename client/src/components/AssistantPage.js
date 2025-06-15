// File: src/pages/AssistantPage.jsx
import React, { useState } from "react";
import axios from "axios";
import './AssistantPage.css';

function AssistantPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { sender: "You", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/api/openai/chat", {
        message: input,
      });

      const botText = res.data.reply;
      setMessages((prev) => [...prev, { sender: "Assistant", text: botText }]);
    } catch (err) {
      // Fallback response
      setMessages((prev) => [
        ...prev,
        {
          sender: "Assistant",
          text: getOfflineResponse(input),
        },
      ]);
    } finally {
      setInput("");
      setIsLoading(false);
    }
  };

  const getOfflineResponse = (msg) => {
    const lower = msg.toLowerCase();
    if (lower.includes("hello")) return "Hi there! I'm here to help you offline too.";
    if (lower.includes("your name")) return "I'm ChatterLink Assistant Bot 🤖 (offline mode).";
    if (lower.includes("help")) return "Sure! You can ask me anything related to the app.";
    return "Sorry, I'm offline right now. Try asking something simple!";
  };

  return (
    <div className="assistant-page">
      <h2>💬 Chat with Assistant</h2>
      <div className="chat-box">
        {messages.map((msg, index) => (
          <p key={index}><strong>{msg.sender}:</strong> {msg.text}</p>
        ))}
        {isLoading && <p><strong>Assistant:</strong> Typing...</p>}
      </div>
      <div className="chat-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}

export default AssistantPage;
