//PrivateChatCreate.js

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import '../App.css';

const socket = io(
  window.location.hostname === "localhost"
    ? "http://localhost:5001"
    : `http://${window.location.hostname}:5001`
);

function PrivateChatCreate() {
  const navigate = useNavigate();
  const [roomInfo, setRoomInfo] = useState(null);

  const createRoom = () => {
    const newRoomId = Math.random().toString(36).substring(2, 8);
    const newPasscode = Math.floor(1000 + Math.random() * 9000).toString();
    socket.emit('createPrivateRoom', { roomId: newRoomId, passcode: newPasscode });
    setRoomInfo({ roomId: newRoomId, passcode: newPasscode });
  };

  const goToRoom = () => {
    if (roomInfo) {
      navigate(`/private/${roomInfo.roomId}`, { state: { passcode: roomInfo.passcode } });
    }
  };

  return (
    <div className="private-chat-create">
      <h2>Create Private Chat Room</h2>
      {!roomInfo ? (
        <button onClick={createRoom}>Generate Private Room</button>
      ) : (
        <>
          <p><strong>Sharable Link:</strong> {window.location.origin}/private/{roomInfo.roomId}</p>
          <p><strong>Passcode:</strong> {roomInfo.passcode}</p>
          <button onClick={goToRoom}>Go to Room</button>
        </>
      )}
    </div>
  );
}

export default PrivateChatCreate;
