// src/pages/TypingRace.js
import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

import '../App.css';

// Create socket connection
const SOCKET_SERVER_URL = window.location.hostname === "localhost"
  ? "http://localhost:5001"
  : `http://${window.location.hostname}:5001`;

const socket = io(SOCKET_SERVER_URL);

function TypingRace() {
  const [username, setUsername] = useState('');
  const [joined, setJoined] = useState(false);
  const [paragraph, setParagraph] = useState('');
  const [typedText, setTypedText] = useState('');
  const [players, setPlayers] = useState({});
  const [winner, setWinner] = useState('');
  const inputRef = useRef();
  const startTime = useRef(null);

  useEffect(() => {
    socket.on('paragraph', setParagraph);
    socket.on('updatePlayers', setPlayers);
    socket.on('winner', name => setWinner(name));

    return () => {
      socket.off('paragraph');
      socket.off('updatePlayers');
      socket.off('winner');
    };
  }, []);

  const calculateWPM = (text) => {
    const words = text.trim().split(' ').length;
    const minutes = (Date.now() - startTime.current) / 60000;
    return Math.round(words / minutes);
  };

  const calculateAccuracy = (typed, original) => {
    let correct = 0;
    for (let i = 0; i < typed.length; i++) {
      if (typed[i] === original[i]) correct++;
    }
    return Math.round((correct / original.length) * 100);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    if (!startTime.current) startTime.current = Date.now();
    setTypedText(value);

    const progress = Math.min((value.length / paragraph.length) * 100, 100);
    const wpm = calculateWPM(value);
    const accuracy = calculateAccuracy(value, paragraph);

    socket.emit('progressUpdate', { progress, wpm, accuracy });
  };

  const joinRace = () => {
    if (username.trim()) {
      socket.emit('joinRace', { username });
      setJoined(true);
    }
  };

  return (
    <div className="race-container">
      {!joined ? (
        <div className="join-form">
          <h2>Join Typing Race</h2>
          <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter your name" />
          <button onClick={joinRace}>Start Race</button>
        </div>
      ) : (
        <div className="race-area">
          <h2>Type the Paragraph</h2>
          <p className="paragraph">{paragraph}</p>
          <textarea
            ref={inputRef}
            rows={4}
            onChange={handleInputChange}
            value={typedText}
            className="typing-box"
            placeholder="Start typing here..."
          />
          {winner && <div className="winner">🏆 Winner: {winner}</div>}
          <div className="progress-area">
            {Object.entries(players).map(([id, p]) => (
              <div key={id} className="progress-bar-wrapper">
                <label>{p.username} - {p.wpm} WPM, {p.accuracy}%</label>
                <div className="progress-bar">
                  <div className="progress" style={{ width: `${p.progress}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default TypingRace;
