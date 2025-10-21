// src/pages/MeetingRoom.js
import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import io from "socket.io-client";

const SOCKET_URL = process.env.NODE_ENV === 'production' 
  ? window.location.origin 
  : "http://localhost:5001";

export default function MeetingRoom() {
  const { id: meetingId } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [canJoin, setCanJoin] = useState(false);
  const [joined, setJoined] = useState(false);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Video and media states
  const localVideoRef = useRef();
  const screenVideoRef = useRef();
  const peersRef = useRef({});
  const socketRef = useRef();
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  
  // Chat and UI states
  const [chat, setChat] = useState([]);
  const [message, setMessage] = useState("");
  const [participants, setParticipants] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [mediaState, setMediaState] = useState({ audio: true, video: true });
  
  // Enhanced features states
  const [pinnedUser, setPinnedUser] = useState(null);
  const [maximizedVideo, setMaximizedVideo] = useState(null);
  const [showParticipantsList, setShowParticipantsList] = useState(true);
  
  // Refs
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const remoteVideosRef = useRef({});

  // Fetch meeting metadata
  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${SOCKET_URL}/api/meetings/${meetingId}`);
        const data = await response.json();
        
        if (data.success) {
          setMeeting(data.meeting);
          const startAt = new Date(data.meeting.startAt);
          const now = new Date();
          setCanJoin(now >= startAt);
        } else {
          setError("Meeting not found: " + data.message);
        }
      } catch (err) {
        setError("Error loading meeting: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMeeting();
  }, [meetingId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      leaveMeeting();
    };
  }, []);

  const joinMeeting = async () => {
    if (!userName.trim()) {
      setError("Please enter your name");
      return;
    }

    if (!canJoin && meeting) {
      const start = new Date(meeting.startAt);
      if (new Date() < start) {
        setError(`Meeting starts at ${start.toLocaleString()}`);
        return;
      }
    }

    setLoading(true);
    setError("");

    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: true 
      });
      localStreamRef.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Initialize socket connection
      socketRef.current = io(SOCKET_URL, { 
        transports: ["websocket", "polling"] 
      });

      setupSocketHandlers();
      
    } catch (err) {
      console.error("Media access error:", err);
      setError("Camera/microphone permission required: " + err.message);
      setLoading(false);
    }
  };

  const setupSocketHandlers = () => {
    const socket = socketRef.current;

    socket.on("connect", () => {
      console.log("Connected to meeting server");
      socket.emit("join-meeting", { 
        meetingId, 
        user: { name: userName.trim() } 
      });
      setJoined(true);
      setLoading(false);
    });

    socket.on("participants", (participantsList) => {
      setParticipants(participantsList);
      participantsList.forEach(participant => {
        createPeerConnection(participant.id, true);
      });
    });

    socket.on("peer-joined", ({ id, user }) => {
      setParticipants(prev => [...prev, { id, user }]);
      createPeerConnection(id, true);
    });

    socket.on("peer-left", ({ id }) => {
      setParticipants(prev => prev.filter(p => p.id !== id));
      // Reset pinned/maximized if that user left
      if (pinnedUser === id) setPinnedUser(null);
      if (maximizedVideo === id) setMaximizedVideo(null);
      removePeer(id);
    });

    // WebRTC signaling handlers
    socket.on("webrtc-offer", async ({ from, sdp, user }) => {
      await createPeerConnection(from, false);
      const pc = peersRef.current[from]?.pc;
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("webrtc-answer", { to: from, sdp: pc.localDescription });
      }
    });

    socket.on("webrtc-answer", async ({ from, sdp }) => {
      const pc = peersRef.current[from]?.pc;
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      }
    });

    socket.on("webrtc-ice", async ({ from, candidate }) => {
      const pc = peersRef.current[from]?.pc;
      if (pc) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn("addIceCandidate failed:", e);
        }
      }
    });

    // Chat handlers
    socket.on("chat-message", ({ user, message: msg, time }) => {
      setChat(prev => [...prev, { user, message: msg, time, id: Date.now() + Math.random() }]);
    });

    socket.on("recording-available", ({ url }) => {
      setChat(prev => [...prev, { 
        user: { name: "System" }, 
        message: `Recording available: ${url}`, 
        time: new Date().toISOString(),
        id: Date.now() + Math.random()
      }]);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setError("Failed to connect to meeting server");
      setLoading(false);
    });
  };

  const createPeerConnection = (socketId, isOfferer) => {
    if (peersRef.current[socketId]) return peersRef.current[socketId];

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" }
      ]
    });

    // Add local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    pc.onicecandidate = (e) => {
      if (e.candidate && socketRef.current) {
        socketRef.current.emit("webrtc-ice", { 
          to: socketId, 
          candidate: e.candidate 
        });
      }
    };

    pc.ontrack = (e) => {
      const stream = e.streams[0];
      
      // Store the remote stream
      if (!peersRef.current[socketId]) {
        peersRef.current[socketId] = { pc };
      }
      peersRef.current[socketId].remoteStream = stream;
      
      // Force re-render to update video displays
      setParticipants(prev => [...prev]);
    };

    pc.onconnectionstatechange = () => {
      console.log(`Connection state with ${socketId}:`, pc.connectionState);
      if (pc.connectionState === "failed" || pc.connectionState === "closed") {
        removePeer(socketId);
      }
    };

    peersRef.current[socketId] = { pc };

    if (isOfferer) {
      pc.createOffer()
        .then(offer => pc.setLocalDescription(offer))
        .then(() => {
          if (socketRef.current) {
            socketRef.current.emit("webrtc-offer", { 
              to: socketId, 
              sdp: pc.localDescription 
            });
          }
        })
        .catch(console.error);
    }

    return peersRef.current[socketId];
  };

  const removePeer = (socketId) => {
    const peer = peersRef.current[socketId];
    if (!peer) return;

    try {
      peer.pc.close();
    } catch (error) {
      console.warn("Error closing peer connection:", error);
    }

    delete peersRef.current[socketId];
    delete remoteVideosRef.current[socketId];
  };

  const leaveMeeting = () => {
    // Stop all media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }

    // Stop recording if active
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    }

    // Close all peer connections
    Object.keys(peersRef.current).forEach(removePeer);

    // Disconnect socket
    if (socketRef.current) {
      socketRef.current.emit("leave-meeting", { meetingId });
      socketRef.current.disconnect();
    }

    setJoined(false);
    setIsScreenSharing(false);
    setPinnedUser(null);
    setMaximizedVideo(null);
  };

  const sendChatMessage = () => {
    if (!message.trim() || !socketRef.current) return;

    socketRef.current.emit("chat-message", { 
      meetingId, 
      message: message.trim(), 
      user: { name: userName } 
    });

    setMessage("");
  };

  const toggleScreenShare = async () => {
    try {
      if (isScreenSharing) {
        // Stop screen share
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach(track => track.stop());
          screenStreamRef.current = null;
        }

        // Switch back to camera
        const cameraStream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        
        // Replace video track in all peer connections
        const videoTrack = cameraStream.getVideoTracks()[0];
        Object.values(peersRef.current).forEach(({ pc }) => {
          const sender = pc.getSenders().find(s => s.track?.kind === "video");
          if (sender) {
            sender.replaceTrack(videoTrack);
          }
        });

        // Update local stream and video
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach(track => track.stop());
        }
        localStreamRef.current = cameraStream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = cameraStream;
        }

        setIsScreenSharing(false);
        if (maximizedVideo === 'screen') setMaximizedVideo(null);
      } else {
        // Start screen share
        const displayStream = await navigator.mediaDevices.getDisplayMedia({ 
          video: true 
        });

        // Create a separate video element for screen share
        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = displayStream;
        }

        // Replace video track in all peer connections
        const videoTrack = displayStream.getVideoTracks()[0];
        Object.values(peersRef.current).forEach(({ pc }) => {
          const sender = pc.getSenders().find(s => s.track?.kind === "video");
          if (sender) {
            sender.replaceTrack(videoTrack);
          }
        });

        screenStreamRef.current = displayStream;
        setIsScreenSharing(true);
        
        // Auto-maximize screen share
        setMaximizedVideo('screen');
        setPinnedUser(null);

        // Handle when user stops screen share
        videoTrack.onended = () => {
          toggleScreenShare();
        };
      }
    } catch (err) {
      console.error("Screen share error:", err);
      setError("Screen share failed: " + err.message);
    }
  };

  const toggleRecording = () => {
    if (!isRecording) {
      startRecording();
    } else {
      stopRecording();
    }
  };

  const startRecording = () => {
    if (!localStreamRef.current) {
      setError("Please enable camera first");
      return;
    }

    try {
      recordedChunksRef.current = [];
      const recorder = new MediaRecorder(localStreamRef.current, {
        mimeType: 'video/webm;codecs=vp9,opus'
      });

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(recordedChunksRef.current, { 
          type: "video/webm" 
        });
        
        await uploadRecording(blob);
      };

      recorder.start(1000); // Collect data every second
      setIsRecording(true);
      
      setChat(prev => [...prev, {
        user: { name: "System" },
        message: "Recording started...",
        time: new Date().toISOString(),
        id: Date.now()
      }]);

    } catch (err) {
      console.error("Recording error:", err);
      setError("Recording failed: " + err.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      setChat(prev => [...prev, {
        user: { name: "System" },
        message: "Recording stopped, uploading...",
        time: new Date().toISOString(),
        id: Date.now()
      }]);
    }
  };

  const uploadRecording = async (blob) => {
    try {
      const formData = new FormData();
      formData.append("file", blob, `recording_${meetingId}_${Date.now()}.webm`);

      const response = await fetch(`${SOCKET_URL}/api/meetings/${meetingId}/recording`, {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        if (socketRef.current) {
          socketRef.current.emit("recording-available", { 
            meetingId, 
            url: data.url 
          });
        }
        
        setChat(prev => [...prev, {
          user: { name: "System" },
          message: `Recording uploaded: ${data.url}`,
          time: new Date().toISOString(),
          id: Date.now()
        }]);
      } else {
        throw new Error(data.message || "Upload failed");
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError("Upload failed: " + err.message);
    }
  };

  const toggleMedia = (type) => {
    if (!localStreamRef.current) return;

    const newState = { ...mediaState, [type]: !mediaState[type] };
    setMediaState(newState);

    const track = localStreamRef.current
      .getTracks()
      .find(t => t.kind === type);

    if (track) {
      track.enabled = newState[type];
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && joined) {
      sendChatMessage();
    }
  };

  // Enhanced features functions
  const handlePinUser = (userId) => {
    if (pinnedUser === userId) {
      setPinnedUser(null);
    } else {
      setPinnedUser(userId);
      setMaximizedVideo(null);
    }
  };

  const handleMaximizeVideo = (videoType) => {
    if (maximizedVideo === videoType) {
      setMaximizedVideo(null);
    } else {
      setMaximizedVideo(videoType);
      setPinnedUser(null);
    }
  };

  const getParticipantName = (participantId) => {
    if (participantId === 'local') return `${userName} (You)`;
    if (participantId === 'screen') return `${userName}'s Screen`;
    const participant = participants.find(p => p.id === participantId);
    return participant?.user?.name || `User ${participantId?.slice(-4) || 'Unknown'}`;
  };

  const getVideoStream = (videoType) => {
    if (videoType === 'local') return localStreamRef.current;
    if (videoType === 'screen') return screenStreamRef.current;
    return peersRef.current[videoType]?.remoteStream;
  };

  // Render video element for different types
  const renderVideoElement = (videoType, className, autoPlay = true, muted = false) => {
    const stream = getVideoStream(videoType);
    
    if (!stream) return null;

    return (
      <video
        ref={el => {
          if (el && stream) {
            el.srcObject = stream;
          }
        }}
        autoPlay={autoPlay}
        muted={muted}
        playsInline
        className={className}
        onLoadedMetadata={(e) => e.target.play().catch(console.error)}
      />
    );
  };

  if (loading && !joined) {
    return (
      <div className="meeting-page loading">
        <div className="loading-spinner"></div>
        <p>Loading meeting...</p>
      </div>
    );
  }

  return (
    <div className="meeting-page">
      <header className="meeting-header">
        <div className="meeting-info">
          <h2>{meeting?.title || "Meeting Room"}</h2>
          <p className="meeting-description">{meeting?.description}</p>
          <p className="meeting-time">
            {meeting && `Started: ${new Date(meeting.startAt).toLocaleString()}`}
          </p>
        </div>
        <div className="meeting-actions">
          {joined && (
            <span className="participant-count">
              {participants.length + 1} participants
            </span>
          )}
        </div>
      </header>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError("")} className="close-error">×</button>
        </div>
      )}

      {!joined ? (
        <div className="join-section">
          <div className="join-form">
            <h3>Join Meeting</h3>
            <div className="form-group">
              <label htmlFor="userName">Your Name</label>
              <input
                id="userName"
                type="text"
                placeholder="Enter your name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                disabled={loading}
              />
            </div>
            
            <div className="join-actions">
              <button 
                onClick={joinMeeting}
                disabled={loading || !userName.trim()}
                className="join-button"
              >
                {loading ? "Joining..." : "Join Meeting"}
              </button>
              <button 
                onClick={() => navigate(-1)}
                className="back-button"
              >
                Go Back
              </button>
            </div>

            {!canJoin && meeting && (
              <div className="meeting-notice">
                <p>⏰ This meeting starts at {new Date(meeting.startAt).toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="meeting-room">
          {/* Main Video Area */}
          <div className="video-main-area">
            {/* Maximized Video View */}
            {maximizedVideo && (
              <div className="maximized-video-container">
                <div className="maximized-header">
                  <span className="maximized-title">
                    {getParticipantName(maximizedVideo)} 
                    {maximizedVideo === 'screen' && ' - Screen Share'}
                  </span>
                  <button 
                    onClick={() => setMaximizedVideo(null)}
                    className="minimize-btn"
                  >
                    ✕ Minimize
                  </button>
                </div>
                {renderVideoElement(maximizedVideo, "maximized-video", true, maximizedVideo === 'local' || maximizedVideo === 'screen')}
              </div>
            )}

            {/* Pinned User View */}
            {!maximizedVideo && pinnedUser && (
              <div className="pinned-video-container">
                <div className="pinned-header">
                  <span className="pinned-title">
                    📌 {getParticipantName(pinnedUser)}
                  </span>
                  <button 
                    onClick={() => setPinnedUser(null)}
                    className="unpin-btn"
                  >
                    ✕ Unpin
                  </button>
                </div>
                {renderVideoElement(pinnedUser, "pinned-video", true, pinnedUser === 'local' || pinnedUser === 'screen')}
              </div>
            )}

            {/* Default Local Video when nothing pinned/maximized */}
            {!maximizedVideo && !pinnedUser && (
              <div className="default-local-video">
                <div className="video-header">
                  <span>You {userName && `(${userName})`}</span>
                  <div className="media-indicators">
                    {!mediaState.audio && <span className="muted-indicator">🔇</span>}
                    {!mediaState.video && <span className="muted-indicator">📷 off</span>}
                    {isScreenSharing && <span className="sharing-indicator">🖥️ Sharing</span>}
                  </div>
                </div>
                {renderVideoElement('local', "local-video-main", true, true)}
              </div>
            )}
          </div>

          {/* Video Grid and Sidebar */}
          <div className="meeting-content">
            {/* Video Grid */}
            <div className="video-grid-section">
              <div className="section-header">
                <h4>Participants</h4>
                <button 
                  onClick={() => setShowParticipantsList(!showParticipantsList)}
                  className="toggle-list-btn"
                >
                  {showParticipantsList ? '👁️' : '👁️'}
                </button>
              </div>
              
              <div className="video-grid">
                {/* Local Video in Grid */}
                <div className={`video-grid-item ${pinnedUser === 'local' ? 'pinned' : ''} ${maximizedVideo === 'local' ? 'maximized' : ''}`}>
                  <div className="video-overlay">
                    <span className="video-name">You ({userName})</span>
                    <div className="video-actions">
                      <button 
                        onClick={() => handleMaximizeVideo('local')}
                        className="video-action-btn maximize"
                        title="Maximize"
                      >
                        ⛶
                      </button>
                      <button 
                        onClick={() => handlePinUser('local')}
                        className={`video-action-btn pin ${pinnedUser === 'local' ? 'active' : ''}`}
                        title={pinnedUser === 'local' ? 'Unpin' : 'Pin'}
                      >
                        {pinnedUser === 'local' ? '📌' : '📌'}
                      </button>
                    </div>
                  </div>
                  {renderVideoElement('local', "grid-video", true, true)}
                </div>

                {/* Screen Share in Grid */}
                {isScreenSharing && (
                  <div className={`video-grid-item screen-share ${maximizedVideo === 'screen' ? 'maximized' : ''}`}>
                    <div className="video-overlay">
                      <span className="video-name">Your Screen</span>
                      <div className="video-actions">
                        <button 
                          onClick={() => handleMaximizeVideo('screen')}
                          className="video-action-btn maximize"
                          title="Maximize Screen"
                        >
                          ⛶
                        </button>
                      </div>
                    </div>
                    {renderVideoElement('screen', "grid-video", true, true)}
                  </div>
                )}

                {/* Remote Videos in Grid */}
                {participants.map(participant => (
                  <div 
                    key={participant.id} 
                    className={`video-grid-item ${pinnedUser === participant.id ? 'pinned' : ''} ${maximizedVideo === participant.id ? 'maximized' : ''}`}
                  >
                    <div className="video-overlay">
                      <span className="video-name">{participant.user?.name || `User ${participant.id.slice(-4)}`}</span>
                      <div className="video-actions">
                        <button 
                          onClick={() => handleMaximizeVideo(participant.id)}
                          className="video-action-btn maximize"
                          title="Maximize"
                        >
                          ⛶
                        </button>
                        <button 
                          onClick={() => handlePinUser(participant.id)}
                          className={`video-action-btn pin ${pinnedUser === participant.id ? 'active' : ''}`}
                          title={pinnedUser === participant.id ? 'Unpin' : 'Pin'}
                        >
                          {pinnedUser === participant.id ? '📌' : '📌'}
                        </button>
                      </div>
                    </div>
                    {renderVideoElement(participant.id, "grid-video")}
                  </div>
                ))}
              </div>
            </div>

            {/* Participants List Sidebar */}
            {showParticipantsList && (
              <div className="participants-sidebar">
                <div className="sidebar-header">
                  <h4>Participants ({participants.length + 1})</h4>
                  <button 
                    onClick={() => setShowParticipantsList(false)}
                    className="close-sidebar"
                  >
                    ✕
                  </button>
                </div>
                <div className="participants-list">
                  <div className="participant-item local">
                    <span className="participant-name">👤 {userName} (You)</span>
                    <div className="participant-status">
                      {!mediaState.audio && <span className="status-muted">🔇</span>}
                      {!mediaState.video && <span className="status-muted">📷</span>}
                      {isScreenSharing && <span className="status-sharing">🖥️</span>}
                    </div>
                  </div>
                  {participants.map(participant => (
                    <div key={participant.id} className="participant-item">
                      <span className="participant-name">👤 {participant.user?.name || `User ${participant.id.slice(-4)}`}</span>
                      <div className="participant-actions">
                        <button 
                          onClick={() => handlePinUser(participant.id)}
                          className={`pin-btn ${pinnedUser === participant.id ? 'active' : ''}`}
                        >
                          {pinnedUser === participant.id ? '📌' : '📌'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="control-bar">
            <div className="media-controls">
              <button 
                onClick={() => toggleMedia('audio')}
                className={`control-btn ${!mediaState.audio ? 'muted' : ''}`}
                title={mediaState.audio ? 'Mute' : 'Unmute'}
              >
                {mediaState.audio ? '🎤' : '🔇'}
              </button>
              <button 
                onClick={() => toggleMedia('video')}
                className={`control-btn ${!mediaState.video ? 'muted' : ''}`}
                title={mediaState.video ? 'Turn off camera' : 'Turn on camera'}
              >
                {mediaState.video ? '📹' : '📷 off'}
              </button>
              <button 
                onClick={toggleScreenShare}
                className={`control-btn ${isScreenSharing ? 'active' : ''}`}
                title={isScreenSharing ? 'Stop screen share' : 'Share screen'}
              >
                {isScreenSharing ? '🖥️ Stop' : '🖥️ Share'}
              </button>
              <button 
                onClick={toggleRecording}
                className={`control-btn ${isRecording ? 'recording' : ''}`}
                title={isRecording ? 'Stop recording' : 'Start recording'}
              >
                {isRecording ? '⏹️ Stop' : '⏺️ Record'}
              </button>
              <button 
                onClick={() => setShowParticipantsList(!showParticipantsList)}
                className="control-btn"
                title="Participants list"
              >
                👥 ({participants.length + 1})
              </button>
            </div>
            
            <button 
              onClick={leaveMeeting}
              className="leave-button"
              title="Leave meeting"
            >
              Leave Meeting
            </button>
          </div>

          {/* Chat Area */}
          <div className="chat-area">
            <div className="chat-header">
              <h4>Chat ({chat.length})</h4>
            </div>
            
            <div className="chat-messages">
              {chat.map((msg) => (
                <div key={msg.id} className="chat-message">
                  <div className="message-header">
                    <strong className="message-sender">
                      {msg.user?.name || msg.user}
                    </strong>
                    <span className="message-time">
                      {new Date(msg.time).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="message-content">{msg.message}</div>
                </div>
              ))}
            </div>

            <div className="chat-input">
              <input
                type="text"
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={!socketRef.current}
              />
              <button 
                onClick={sendChatMessage}
                disabled={!message.trim() || !socketRef.current}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .meeting-page {
          padding: 20px;
          max-width: 1400px;
          margin: 0 auto;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          color: #333;
        }

        .loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 50vh;
          color: white;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(255,255,255,0.3);
          border-top: 4px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .meeting-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
          padding: 20px;
          background: rgba(255, 255, 255, 0.95);
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
          backdrop-filter: blur(10px);
        }

        .meeting-info h2 {
          margin: 0 0 8px 0;
          color: #2c3e50;
          font-size: 1.5em;
        }

        .meeting-description {
          color: #6c757d;
          margin: 0 0 8px 0;
        }

        .meeting-time {
          color: #495057;
          font-size: 14px;
          margin: 0;
        }

        .participant-count {
          background: #e9ecef;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 600;
          color: #495057;
        }

        .error-message {
          background: #f8d7da;
          color: #721c24;
          padding: 12px 16px;
          border-radius: 12px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .close-error {
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          color: #721c24;
        }

        .join-section {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 60vh;
        }

        .join-form {
          background: rgba(255, 255, 255, 0.95);
          padding: 40px;
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          width: 100%;
          max-width: 450px;
          backdrop-filter: blur(10px);
        }

        .join-form h3 {
          margin: 0 0 25px 0;
          text-align: center;
          color: #2c3e50;
          font-size: 1.8em;
        }

        .form-group {
          margin-bottom: 25px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #495057;
        }

        .form-group input {
          width: 100%;
          padding: 15px;
          border: 2px solid #e9ecef;
          border-radius: 12px;
          font-size: 16px;
          transition: all 0.3s ease;
        }

        .form-group input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .join-actions {
          display: flex;
          gap: 15px;
          flex-direction: column;
        }

        .join-button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 15px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .join-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
        }

        .join-button:disabled {
          background: #6c757d;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .back-button {
          background: #6c757d;
          color: white;
          border: none;
          padding: 15px;
          border-radius: 12px;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .back-button:hover {
          background: #5a6268;
          transform: translateY(-2px);
        }

        .meeting-notice {
          margin-top: 20px;
          padding: 15px;
          background: #fff3cd;
          border-radius: 12px;
          text-align: center;
          color: #856404;
        }

        .meeting-room {
          display: flex;
          flex-direction: column;
          gap: 20px;
          height: 80vh;
        }

        .video-main-area {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
          backdrop-filter: blur(10px);
          min-height: 300px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .maximized-video-container,
        .pinned-video-container,
        .default-local-video {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .maximized-header,
        .pinned-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
          padding: 10px 0;
          border-bottom: 2px solid #e9ecef;
        }

        .maximized-title,
        .pinned-title {
          font-weight: 600;
          color: #2c3e50;
          font-size: 1.2em;
        }

        .minimize-btn,
        .unpin-btn {
          background: #6c757d;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
        }

        .minimize-btn:hover,
        .unpin-btn:hover {
          background: #5a6268;
        }

        .maximized-video {
          width: 100%;
          height: 100%;
          background: #000;
          border-radius: 12px;
          object-fit: contain;
        }

        .pinned-video {
          width: 100%;
          height: 100%;
          background: #000;
          border-radius: 12px;
          object-fit: cover;
        }

        .local-video-main {
          width: 100%;
          height: 100%;
          max-height: 400px;
          background: #000;
          border-radius: 12px;
          object-fit: cover;
        }

        .meeting-content {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 20px;
        }

        .video-grid-section {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
          backdrop-filter: blur(10px);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .section-header h4 {
          margin: 0;
          color: #2c3e50;
        }

        .toggle-list-btn {
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          padding: 5px;
          border-radius: 6px;
        }

        .toggle-list-btn:hover {
          background: #e9ecef;
        }

        .video-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 15px;
          max-height: 300px;
          overflow-y: auto;
        }

        .video-grid-item {
          position: relative;
          background: #000;
          border-radius: 12px;
          overflow: hidden;
          aspect-ratio: 4/3;
          transition: all 0.3s ease;
          border: 3px solid transparent;
        }

        .video-grid-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.2);
        }

        .video-grid-item.pinned {
          border-color: #ff6b6b;
        }

        .video-grid-item.maximized {
          border-color: #4ecdc4;
        }

        .video-grid-item.screen-share {
          border-color: #45b7d1;
        }

        .video-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          background: linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 100%);
          color: white;
          padding: 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 2;
        }

        .video-name {
          font-size: 12px;
          font-weight: 600;
        }

        .video-actions {
          display: flex;
          gap: 5px;
        }

        .video-action-btn {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          padding: 4px 8px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          backdrop-filter: blur(10px);
          transition: all 0.2s ease;
        }

        .video-action-btn:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(1.1);
        }

        .video-action-btn.active {
          background: #ff6b6b;
        }

        .grid-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .participants-sidebar {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
          backdrop-filter: blur(10px);
          width: 280px;
          max-height: 400px;
          display: flex;
          flex-direction: column;
        }

        .sidebar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 2px solid #e9ecef;
        }

        .sidebar-header h4 {
          margin: 0;
          color: #2c3e50;
        }

        .close-sidebar {
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          padding: 5px;
          border-radius: 6px;
          color: #6c757d;
        }

        .close-sidebar:hover {
          background: #e9ecef;
        }

        .participants-list {
          flex: 1;
          overflow-y: auto;
        }

        .participant-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          margin-bottom: 8px;
          background: #f8f9fa;
          border-radius: 10px;
          transition: all 0.2s ease;
        }

        .participant-item:hover {
          background: #e9ecef;
          transform: translateX(5px);
        }

        .participant-item.local {
          background: #e3f2fd;
          border-left: 4px solid #2196f3;
        }

        .participant-name {
          font-weight: 500;
          color: #495057;
        }

        .participant-status {
          display: flex;
          gap: 5px;
        }

        .status-muted {
          color: #dc3545;
        }

        .status-sharing {
          color: #28a745;
        }

        .pin-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 14px;
          padding: 5px;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .pin-btn:hover {
          background: #e9ecef;
          transform: scale(1.2);
        }

        .pin-btn.active {
          color: #ff6b6b;
        }

        .control-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(255, 255, 255, 0.95);
          padding: 20px;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
          backdrop-filter: blur(10px);
        }

        .media-controls {
          display: flex;
          gap: 10px;
        }

        .control-btn {
          padding: 12px 20px;
          border: 2px solid #e9ecef;
          background: white;
          border-radius: 12px;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.3s ease;
          min-width: 60px;
        }

        .control-btn:hover {
          background: #f8f9fa;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .control-btn.muted {
          background: #dc3545;
          color: white;
          border-color: #dc3545;
        }

        .control-btn.active {
          background: #28a745;
          color: white;
          border-color: #28a745;
        }

        .control-btn.recording {
          background: #dc3545;
          color: white;
          border-color: #dc3545;
          animation: pulse 1s infinite;
        }

        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }

        .leave-button {
          background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .leave-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(255, 107, 107, 0.3);
        }

        .chat-area {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
          backdrop-filter: blur(10px);
          display: flex;
          flex-direction: column;
          height: 300px;
        }

        .chat-header {
          padding: 16px 20px;
          border-bottom: 2px solid #e9ecef;
        }

        .chat-header h4 {
          margin: 0;
          color: #2c3e50;
        }

        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px 20px;
        }

        .chat-message {
          margin-bottom: 12px;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 12px;
          transition: all 0.2s ease;
        }

        .chat-message:hover {
          background: #e9ecef;
        }

        .message-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }

        .message-sender {
          color: #495057;
          font-size: 14px;
        }

        .message-time {
          font-size: 12px;
          color: #6c757d;
        }

        .message-content {
          color: #212529;
          line-height: 1.4;
        }

        .chat-input {
          display: flex;
          padding: 16px 20px;
          border-top: 2px solid #e9ecef;
          gap: 10px;
        }

        .chat-input input {
          flex: 1;
          padding: 12px;
          border: 2px solid #e9ecef;
          border-radius: 12px;
          font-size: 14px;
          transition: all 0.3s ease;
        }

        .chat-input input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .chat-input button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .chat-input button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .chat-input button:disabled {
          background: #6c757d;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        @media (max-width: 768px) {
          .meeting-page {
            padding: 10px;
          }

          .meeting-header {
            flex-direction: column;
            gap: 12px;
          }

          .meeting-content {
            grid-template-columns: 1fr;
          }

          .participants-sidebar {
            width: 100%;
          }

          .video-grid {
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          }

          .control-bar {
            flex-direction: column;
            gap: 12px;
          }

          .media-controls {
            flex-wrap: wrap;
            justify-content: center;
          }

          .control-btn {
            min-width: 50px;
            padding: 10px 15px;
          }
        }
      `}</style>
    </div>
  );
}