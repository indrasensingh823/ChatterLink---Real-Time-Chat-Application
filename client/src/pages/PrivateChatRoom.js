//PrivateChatRoom.js

import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import '../App.css';

const socket = io(
  window.location.hostname === "localhost"
    ? "http://localhost:5001"
    : `http://${window.location.hostname}:5001`
);

function PrivateChatRoom() {
  const { roomId } = useParams();
  const location = useLocation();
  const initialPasscode = location.state?.passcode || '';
  
  const [passcodeInput, setPasscodeInput] = useState(initialPasscode);
  const [verified, setVerified] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    socket.on('privateMessage', (data) => {
      setMessages(prev => [...prev, `${data.userId === socket.id ? 'You' : data.userId}: ${data.message}`]);
    });

    return () => {
      socket.off('privateMessage');
    };
  }, []);

  const handleVerify = () => {
    socket.emit('joinPrivateRoom', { roomId, passcode: passcodeInput }, (response) => {
      if (response.success) {
        setVerified(true);
      } else {
        alert(response.message || 'Invalid passcode');
      }
    });
  };

  const sendMessage = () => {
    if (message.trim()) {
      socket.emit('privateMessage', { roomId, message });
      setMessages(prev => [...prev, `You: ${message}`]);
      setMessage('');
    }
  };

  return (
    <div className="private-chat-room">
      {!verified ? (
        <div>
          <h3>Enter Passcode for Room: {roomId}</h3>
          <input
            value={passcodeInput}
            onChange={e => setPasscodeInput(e.target.value)}
            placeholder="Passcode"
          />
          <button onClick={handleVerify}>Join Room</button>
        </div>
      ) : (
        <div>
          <h3>Private Chat Room: {roomId}</h3>
          <div className="chat-box" style={{ border: '1px solid #ccc', padding: '10px', height: '300px', overflowY: 'scroll' }}>
            {messages.map((msg, idx) => (
              <div key={idx}>{msg}</div>
            ))}
          </div>
          <input
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Type your message"
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      )}
    </div>
  );
}

export default PrivateChatRoom;
