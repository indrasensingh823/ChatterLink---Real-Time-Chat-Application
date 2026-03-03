import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import { useLocation } from "react-router-dom";
import queryString from "query-string";

/* ==============================
   ✅ SOCKET SERVER CONFIG
   ============================== */

const SOCKET_SERVER_URL =
  process.env.REACT_APP_SOCKET_SERVER_URL || "http://localhost:5001";

const socket = io(SOCKET_SERVER_URL, {
  transports: ["websocket"],
  withCredentials: true,
});

function ChatRoom() {
  const location = useLocation();
  const { username, room } = queryString.parse(location.search);

  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!username || !room) return;

    // Join room
    socket.emit("join", { username, room });

    // Listen messages
    socket.on("message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.off("message");
      socket.disconnect();
    };
  }, [username, room]);

  const sendMessage = () => {
    if (message.trim()) {
      socket.emit("sendMessage", message);
      setMessage("");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Room: {room}</h2>

      <div
        style={{
          border: "1px solid #ccc",
          height: "300px",
          overflowY: "auto",
          padding: "10px",
          marginBottom: "10px",
        }}
      >
        {messages.map((msg, i) => (
          <p key={i}>
            <strong>{msg.user}:</strong> {msg.text}
          </p>
        ))}
      </div>

      <input
        type="text"
        value={message}
        placeholder="Type message..."
        onChange={(e) => setMessage(e.target.value)}
        style={{ padding: "8px", width: "70%" }}
      />
      <button
        onClick={sendMessage}
        style={{ padding: "8px 15px", marginLeft: "10px" }}
      >
        Send
      </button>
    </div>
  );
}

export default ChatRoom;