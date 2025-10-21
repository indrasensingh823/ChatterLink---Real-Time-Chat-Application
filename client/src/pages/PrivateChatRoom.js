// PrivateChatRoom.js
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import '../styles/PrivateChatRoom.css'; // We'll create this CSS file

const socket = io(
  window.location.hostname === "localhost"
    ? "http://localhost:5001"
    : `http://${window.location.hostname}:5001`
);

function PrivateChatRoom() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const initialPasscode = location.state?.passcode || '';
  const isCreator = location.state?.isCreator || false;
  
  const [passcodeInput, setPasscodeInput] = useState(initialPasscode);
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUser, setTypingUser] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (verified) {
      socket.on('privateMessage', (data) => {
        const newMessage = {
          id: Date.now() + Math.random(),
          userId: data.userId,
          username: data.userId === socket.id ? 'You' : `User ${data.userId.slice(-4)}`,
          text: data.message,
          time: new Date().toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          isOwn: data.userId === socket.id
        };
        setMessages(prev => [...prev, newMessage]);
      });

      // Handle file upload events
      socket.on('file_uploaded', (data) => {
        const newMessage = {
          id: Date.now() + Math.random(),
          userId: data.user,
          username: data.user === socket.id ? 'You' : `User ${data.user.slice(-4)}`,
          file: data.file,
          time: data.time,
          isOwn: data.user === socket.id,
          isFile: true
        };
        setMessages(prev => [...prev, newMessage]);
      });

      socket.on('userJoined', (data) => {
        setOnlineUsers(prev => [...prev, data.userId]);
        setMessages(prev => [...prev, {
          id: Date.now(),
          userId: 'system',
          username: 'System',
          text: `${data.userId === socket.id ? 'You' : `User ${data.userId.slice(-4)}`} joined the room`,
          time: new Date().toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          isSystem: true
        }]);
      });

      socket.on('userLeft', (data) => {
        setOnlineUsers(prev => prev.filter(id => id !== data.userId));
        setMessages(prev => [...prev, {
          id: Date.now(),
          userId: 'system',
          username: 'System',
          text: `User ${data.userId.slice(-4)} left the room`,
          time: new Date().toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          isSystem: true
        }]);
      });

      socket.on('typing', (data) => {
        if (data.userId !== socket.id) {
          setTypingUser(`User ${data.userId.slice(-4)}`);
        }
      });

      socket.on('stopTyping', () => {
        setTypingUser('');
      });
    }

    return () => {
      socket.off('privateMessage');
      socket.off('file_uploaded');
      socket.off('userJoined');
      socket.off('userLeft');
      socket.off('typing');
      socket.off('stopTyping');
    };
  }, [verified]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleVerify = async () => {
    if (!passcodeInput.trim()) {
      alert('Please enter a passcode');
      return;
    }

    setVerifying(true);
    
    socket.emit('joinPrivateRoom', { roomId, passcode: passcodeInput }, (response) => {
      setVerifying(false);
      if (response.success) {
        setVerified(true);
        socket.emit('userJoined', { roomId, userId: socket.id });
      } else {
        alert(response.message || 'Invalid passcode. Please try again.');
      }
    });
  };

  const sendMessage = () => {
    if (message.trim()) {
      socket.emit('privateMessage', { roomId, message });
      setMessage('');
      socket.emit('stopTyping', { roomId });
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // File size validation (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size too large. Please select a file smaller than 10MB.');
      return;
    }

    setIsUploading(true);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('username', socket.id);
    formData.append('room', roomId);

    try {
      const response = await fetch(
        window.location.hostname === "localhost" 
          ? "http://localhost:5001/upload" 
          : `http://${window.location.hostname}:5001/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      
      // Emit file upload event to socket
      socket.emit('file_upload', {
        filename: data.filename,
        originalName: file.name,
        fileType: file.type,
        fileSize: file.size,
        fileUrl: data.fileUrl,
        username: socket.id,
        roomId: roomId
      });

    } catch (error) {
      console.error('Upload error:', error);
      alert('File upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.startsWith('audio/')) return '🎵';
    if (fileType.startsWith('video/')) return '🎬';
    if (fileType === 'application/pdf') return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('sheet') || fileType.includes('excel')) return '📊';
    if (fileType.includes('zip') || fileType.includes('rar')) return '📦';
    return '📎';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleTyping = () => {
    socket.emit('typing', { roomId, userId: socket.id });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stopTyping', { roomId });
    }, 2000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const leaveRoom = () => {
    socket.emit('userLeft', { roomId, userId: socket.id });
    navigate('/private/create');
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    alert('Room ID copied to clipboard!');
  };

  return (
    <div className="private-chat-room-container">
      {!verified ? (
        <div className="verification-section">
          <div className="verification-card">
            <div className="verification-header">
              <div className="lock-icon">🔒</div>
              <h1>Private Room Access</h1>
              <p>Enter the passcode to join this secure chat room</p>
            </div>

            <div className="room-info">
              <div className="room-id-display">
                <span className="room-label">Room ID:</span>
                <span className="room-value">{roomId}</span>
                <button onClick={copyRoomId} className="copy-room-id">📋</button>
              </div>
            </div>

            <div className="passcode-input-group">
              <input
                type="password"
                value={passcodeInput}
                onChange={e => setPasscodeInput(e.target.value)}
                placeholder="Enter 4-digit passcode"
                className="passcode-input"
                maxLength="4"
                onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
              />
              <div className="input-icon">🔑</div>
            </div>

            <button 
              onClick={handleVerify}
              disabled={verifying}
              className={`verify-button ${verifying ? 'verifying' : ''}`}
            >
              {verifying ? (
                <>
                  <div className="button-spinner"></div>
                  Verifying...
                </>
              ) : (
                <>
                  <span className="button-icon">🚪</span>
                  Join Private Room
                </>
              )}
            </button>

            {isCreator && (
              <div className="creator-note">
                <span className="note-icon">💡</span>
                You created this room. Share the passcode with others to let them join.
              </div>
            )}

            <div className="security-features">
              <h3>🔒 Secure Features</h3>
              <ul>
                <li>End-to-end encrypted messaging</li>
                <li>Passcode protected access</li>
                <li>Real-time user presence</li>
                <li>Secure room isolation</li>
                <li>Secure file sharing</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="chat-room-section">
          <div className="chat-room-header">
            <div className="header-left">
              <button onClick={leaveRoom} className="back-button">
                <span className="back-icon">←</span>
                Leave
              </button>
              <div className="room-info-header">
                <h2>Private Room</h2>
                <div className="room-id-header">
                  <span className="room-id-label">ID: {roomId}</span>
                  <span className="online-count">
                    <span className="online-dot"></span>
                    {onlineUsers.length} online
                  </span>
                </div>
              </div>
            </div>
            <div className="header-right">
              <button onClick={copyRoomId} className="share-button">
                <span className="share-icon">📋</span>
                Copy ID
              </button>
            </div>
          </div>

          <div className="chat-room-layout">
            <div className="online-users-sidebar">
              <h3>Online Users ({onlineUsers.length})</h3>
              <div className="users-list">
                {onlineUsers.map(userId => (
                  <div key={userId} className="user-item">
                    <div className="user-avatar">
                      {userId === socket.id ? '👤' : '👥'}
                    </div>
                    <span className="user-name">
                      {userId === socket.id ? 'You' : `User ${userId.slice(-4)}`}
                    </span>
                    <div className="user-status"></div>
                  </div>
                ))}
              </div>
              
              <div className="security-badge">
                <span className="badge-icon">🛡️</span>
                <span className="badge-text">Secure Room</span>
              </div>

              <div className="file-sharing-info">
                <h4>📁 File Sharing</h4>
                <div className="supported-files">
                  <span>Supported: Images, Videos, Audio, PDF, Documents</span>
                  <span className="file-size-limit">Max: 10MB</span>
                </div>
              </div>
            </div>

            <div className="chat-area">
              <div className="messages-container">
                {messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`message-bubble ${msg.isOwn ? 'own-message' : ''} ${msg.isSystem ? 'system-message' : ''} ${msg.isFile ? 'file-message' : ''}`}
                  >
                    {!msg.isSystem && !msg.isOwn && (
                      <div className="message-avatar">
                        {msg.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="message-content">
                      {!msg.isSystem && !msg.isOwn && (
                        <div className="message-sender">{msg.username}</div>
                      )}
                      
                      {msg.isFile ? (
                        <div className="file-message-content">
                          <div className="file-info">
                            <span className="file-icon">
                              {getFileIcon(msg.file.fileType)}
                            </span>
                            <div className="file-details">
                              <div className="file-name">{msg.file.originalName}</div>
                              <div className="file-size">{formatFileSize(msg.file.fileSize)}</div>
                            </div>
                          </div>
                          <a 
                            href={msg.file.fileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="download-button"
                          >
                            Download
                          </a>
                        </div>
                      ) : (
                        <div className="message-text">{msg.text}</div>
                      )}
                      
                      <div className="message-time">{msg.time}</div>
                    </div>
                  </div>
                ))}
                
                {typingUser && (
                  <div className="typing-indicator">
                    <div className="typing-avatar">
                      {typingUser.charAt(0).toUpperCase()}
                    </div>
                    <div className="typing-content">
                      <div className="typing-text">{typingUser} is typing</div>
                      <div className="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              <div className="message-input-section">
                <div className="input-container">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.xls,.xlsx,.zip,.rar"
                    style={{ display: 'none' }}
                    id="file-input"
                  />
                  <button 
                    type="button" 
                    className="file-upload-button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    title="Share file"
                  >
                    {isUploading ? '📤' : '📎'}
                  </button>
                  
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      handleTyping();
                    }}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your secure message..."
                    className="message-input"
                  />
                  <button 
                    onClick={sendMessage}
                    disabled={!message.trim()}
                    className="send-button"
                  >
                    <span className="send-icon">➤</span>
                  </button>
                </div>
                <div className="encryption-notice">
                  <span className="lock-icon-small">🔒</span>
                  Messages and files are end-to-end encrypted
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PrivateChatRoom;