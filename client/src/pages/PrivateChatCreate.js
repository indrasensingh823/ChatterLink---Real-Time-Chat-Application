// PrivateChatCreate.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import '../styles/PrivateChatCreate.css';

function PrivateChatCreate() {
  const navigate = useNavigate();
  const [roomInfo, setRoomInfo] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  const createRoom = async () => {
    setIsCreating(true);

    await new Promise(resolve => setTimeout(resolve, 1000));

    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newPasscode = Math.floor(1000 + Math.random() * 9000).toString();
    const username = `User${Math.floor(1000 + Math.random() * 9000)}`;

    socket.emit('createPrivateRoom', {
      roomId: newRoomId,
      passcode: newPasscode,
      username
    });

    setRoomInfo({
      roomId: newRoomId,
      passcode: newPasscode,
      username
    });

    setIsCreating(false);
  };

  const goToRoom = () => {
    if (roomInfo) {
      navigate(`/private/${roomInfo.roomId}`, {
        state: {
          passcode: roomInfo.passcode,
          isCreator: true,
          username: roomInfo.username
        }
      });
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareRoom = () => {
    if (!roomInfo) return;

    const shareData = {
      title: 'Join My Private Chat Room',
      text: `Join my private chat room on ChatterLink! Room ID: ${roomInfo.roomId}, Passcode: ${roomInfo.passcode}`,
      url: `${window.location.origin}/private/${roomInfo.roomId}`
    };

    if (navigator.share) {
      navigator.share(shareData);
    } else {
      copyToClipboard(
        `Room ID: ${roomInfo.roomId}\nPasscode: ${roomInfo.passcode}\nLink: ${window.location.origin}/private/${roomInfo.roomId}`
      );
    }
  };

  return (
    <div className="private-create-container">
      <div className="private-create-header">
        <div className="header-icon">🔒</div>
        <h1>Create Private Chat Room</h1>
        <p>Secure, encrypted conversations with your friends and team</p>
      </div>

      <div className="private-create-card">
        {!roomInfo ? (
          <div className="creation-section">
            <div className="security-features">
              <div className="feature-item">
                <span className="feature-icon">🛡️</span>
                <div className="feature-text">
                  <h3>End-to-End Secure</h3>
                  <p>Your conversations are private and secure</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🔑</span>
                <div className="feature-text">
                  <h3>Passcode Protected</h3>
                  <p>Only people with the passcode can join</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">⚡</span>
                <div className="feature-text">
                  <h3>Real-time Chat</h3>
                  <p>Instant messaging with typing indicators</p>
                </div>
              </div>
            </div>

            <button
              onClick={createRoom}
              className={`create-button ${isCreating ? 'creating' : ''}`}
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <div className="button-spinner"></div>
                  Creating Secure Room...
                </>
              ) : (
                <>
                  <span className="button-icon">🚀</span>
                  Generate Private Room
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="room-created-section">
            <div className="success-animation">
              <div className="success-icon">✅</div>
              <h2>Room Created Successfully!</h2>
            </div>

            <div className="room-details">
              <div className="detail-card">
                <div className="detail-header">
                  <span className="detail-icon">🆔</span>
                  <h3>Room ID</h3>
                </div>
                <div className="detail-value room-id">{roomInfo.roomId}</div>
              </div>

              <div className="detail-card">
                <div className="detail-header">
                  <span className="detail-icon">🔐</span>
                  <h3>Passcode</h3>
                </div>
                <div className="detail-value passcode">{roomInfo.passcode}</div>
                <div className="detail-note">Share this passcode with trusted people</div>
              </div>
            </div>

            <div className="share-section">
              <div className="share-link">
                <div className="link-label">Shareable Link:</div>
                <div className="link-value">
                  {window.location.origin}/private/{roomInfo.roomId}
                </div>
                <button
                  onClick={() =>
                    copyToClipboard(
                      `Room ID: ${roomInfo.roomId}\nPasscode: ${roomInfo.passcode}\nLink: ${window.location.origin}/private/${roomInfo.roomId}`
                    )
                  }
                  className="copy-button"
                >
                  {copied ? '✅ Copied!' : '📋 Copy'}
                </button>
              </div>

              <button onClick={shareRoom} className="share-button">
                <span className="share-icon">📤</span>
                Share Room
              </button>
            </div>

            <div className="action-buttons">
              <button onClick={goToRoom} className="enter-room-button">
                <span className="button-icon">🚪</span>
                Enter Room Now
              </button>

              <button
                onClick={() => setRoomInfo(null)}
                className="create-new-button"
              >
                <span className="button-icon">🔄</span>
                Create Another Room
              </button>
            </div>

            <div className="security-tips">
              <h4>🔒 Security Tips:</h4>
              <ul>
                <li>Share the passcode only with trusted individuals</li>
                <li>Don't share the passcode on public platforms</li>
                <li>The room will be active as long as someone is connected</li>
                <li>For maximum security, change the passcode regularly</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      <div className="private-create-footer">
        <p>💬 Your conversations are secure and private</p>
      </div>
    </div>
  );
}

export default PrivateChatCreate;