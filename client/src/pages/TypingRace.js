// src/pages/TypingRace.js
import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import '../styles/TypingRace.css'; // We'll create this CSS file

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
  const [countdown, setCountdown] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [currentWPM, setCurrentWPM] = useState(0);
  const [currentAccuracy, setCurrentAccuracy] = useState(0);
  const inputRef = useRef();
  const startTime = useRef(null);

  useEffect(() => {
    socket.on('paragraph', (newParagraph) => {
      setParagraph(newParagraph);
      startCountdown();
    });
    
    socket.on('updatePlayers', (playersData) => {
      setPlayers(playersData);
    });
    
    socket.on('winner', (name) => {
      setWinner(name);
      setGameStarted(false);
    });

    return () => {
      socket.off('paragraph');
      socket.off('updatePlayers');
      socket.off('winner');
    };
  }, []);

  const startCountdown = () => {
    setCountdown(3);
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev === 1) {
          clearInterval(countdownInterval);
          setGameStarted(true);
          setTimeout(() => {
            if (inputRef.current) {
              inputRef.current.focus();
            }
          }, 100);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const calculateWPM = (text) => {
    if (!startTime.current) return 0;
    const words = text.trim().split(/\s+/).filter(word => word.length > 0).length;
    const minutes = (Date.now() - startTime.current) / 60000;
    return minutes > 0 ? Math.round(words / minutes) : 0;
  };

  const calculateAccuracy = (typed, original) => {
    if (!typed) return 100;
    let correct = 0;
    const minLength = Math.min(typed.length, original.length);
    for (let i = 0; i < minLength; i++) {
      if (typed[i] === original[i]) correct++;
    }
    return Math.round((correct / original.length) * 100);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    
    if (!startTime.current && value.length === 1) {
      startTime.current = Date.now();
    }
    
    setTypedText(value);

    const progress = Math.min((value.length / paragraph.length) * 100, 100);
    const wpm = calculateWPM(value);
    const accuracy = calculateAccuracy(value, paragraph);

    setCurrentWPM(wpm);
    setCurrentAccuracy(accuracy);

    socket.emit('progressUpdate', { progress, wpm, accuracy });
  };

  const joinRace = () => {
    if (username.trim()) {
      socket.emit('joinRace', { username });
      setJoined(true);
    }
  };

  const resetGame = () => {
    setTypedText('');
    setWinner('');
    setGameStarted(false);
    setCountdown(null);
    startTime.current = null;
    setCurrentWPM(0);
    setCurrentAccuracy(0);
    
    // Rejoin the race
    socket.emit('joinRace', { username });
  };

  const getPlayerList = () => {
    return Object.entries(players).sort(([, a], [, b]) => b.progress - a.progress);
  };

  const getCharacterClass = (index) => {
    if (index >= typedText.length) return '';
    if (typedText[index] === paragraph[index]) return 'correct';
    return 'incorrect';
  };

  return (
    <div className="typing-race-container">
      {!joined ? (
        <div className="join-section">
          <div className="join-card">
            <div className="join-header">
              <div className="race-icon">🏁</div>
              <h1>Typing Race</h1>
              <p>Test your typing speed against players worldwide!</p>
            </div>
            
            <div className="features-grid">
              <div className="feature">
                <span className="feature-icon">⚡</span>
                <h3>Real-time Competition</h3>
                <p>Race against other players in real-time</p>
              </div>
              <div className="feature">
                <span className="feature-icon">📊</span>
                <h3>Live Statistics</h3>
                <p>Track your WPM and accuracy</p>
              </div>
              <div className="feature">
                <span className="feature-icon">🏆</span>
                <h3>Win Prizes</h3>
                <p>Be the fastest to win the race</p>
              </div>
            </div>

            <div className="join-form">
              <div className="input-group">
                <input 
                  value={username} 
                  onChange={e => setUsername(e.target.value)} 
                  placeholder="Enter your racing name" 
                  className="username-input"
                  onKeyPress={(e) => e.key === 'Enter' && joinRace()}
                />
                <div className="input-icon">👤</div>
              </div>
              <button 
                onClick={joinRace}
                disabled={!username.trim()}
                className="join-button"
              >
                <span className="button-icon">🚀</span>
                Start Racing
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="race-section">
          <div className="race-header">
            <div className="header-left">
              <h1>Typing Race</h1>
              <div className="player-info">
                <span className="player-name">Player: {username}</span>
                <span className="stats">
                  {currentWPM} WPM • {currentAccuracy}% Accuracy
                </span>
              </div>
            </div>
            <div className="header-right">
              <button onClick={resetGame} className="reset-button">
                <span className="reset-icon">🔄</span>
                Restart
              </button>
            </div>
          </div>

          <div className="race-content">
            {countdown !== null && (
              <div className="countdown-overlay">
                <div className="countdown">
                  {countdown > 0 ? countdown : 'GO!'}
                </div>
              </div>
            )}

            <div className="text-display">
              <div className="text-container">
                {paragraph.split('').map((char, index) => (
                  <span 
                    key={index} 
                    className={`character ${getCharacterClass(index)} ${
                      index === typedText.length ? 'current' : ''
                    }`}
                  >
                    {char}
                  </span>
                ))}
              </div>
            </div>

            <div className="input-section">
              <textarea
                ref={inputRef}
                rows={3}
                onChange={handleInputChange}
                value={typedText}
                className={`typing-input ${!gameStarted ? 'disabled' : ''}`}
                placeholder={!gameStarted ? "Wait for the race to start..." : "Start typing here..."}
                disabled={!gameStarted}
                autoFocus
              />
              <div className="input-stats">
                <div className="stat">
                  <span className="stat-label">Progress</span>
                  <span className="stat-value">
                    {Math.min(Math.round((typedText.length / paragraph.length) * 100), 100)}%
                  </span>
                </div>
                <div className="stat">
                  <span className="stat-label">WPM</span>
                  <span className="stat-value">{currentWPM}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Accuracy</span>
                  <span className="stat-value">{currentAccuracy}%</span>
                </div>
              </div>
            </div>

            {winner && (
              <div className="winner-banner">
                <div className="winner-icon">🏆</div>
                <h2>Race Complete!</h2>
                <p>Congratulations, <span className="winner-name">{winner}</span> won the race!</p>
                <button onClick={resetGame} className="play-again-button">
                  <span className="button-icon">🔄</span>
                  Play Again
                </button>
              </div>
            )}

            <div className="players-section">
              <h3>Live Leaderboard</h3>
              <div className="players-list">
                {getPlayerList().map(([id, player], index) => (
                  <div key={id} className={`player-card ${player.username === username ? 'current-player' : ''}`}>
                    <div className="player-rank">#{index + 1}</div>
                    <div className="player-details">
                      <div className="player-name">
                        {player.username}
                        {player.username === username && <span className="you-badge"> (You)</span>}
                      </div>
                      <div className="player-stats">
                        {player.wpm} WPM • {player.accuracy}% Accuracy
                      </div>
                    </div>
                    <div className="player-progress">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${player.progress}%` }}
                        ></div>
                      </div>
                      <span className="progress-text">{Math.round(player.progress)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TypingRace;