import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import { useLocation } from "react-router-dom";
import queryString from "query-string";

const socket = io("http://localhost:5001"); // ✅ Make sure this URL is correct
 // Change to your IP

function ChatRoom() {
  const location = useLocation();
  const { username, room } = queryString.parse(location.search);

  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    socket.emit("join", { username, room });

    socket.on("message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.disconnect();
    };
  }, [username, room]);

  const sendMessage = () => {
    if (message) {
      socket.emit("sendMessage", message);
      setMessage("");
    }
  };

  return (
    <div>
      <h2>Room: {room}</h2>
      <div>
        {messages.map((msg, i) => (
          <p key={i}><strong>{msg.user}:</strong> {msg.text}</p>
        ))}
      </div>
      <input
        type="text"
        value={message}
        placeholder="Type message..."
        onChange={(e) => setMessage(e.target.value)}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

export default ChatRoom;
