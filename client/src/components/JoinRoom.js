import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function JoinRoom() {
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");
  const navigate = useNavigate();

  const handleJoin = () => {
    if (username && room) {
      navigate(`/chat?username=${username}&room=${room}`);
    }
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Enter your name"
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="text"
        placeholder="Enter room"
        onChange={(e) => setRoom(e.target.value)}
      />
      <button onClick={handleJoin}>Join</button>
    </div>
  );
}

export default JoinRoom;
