import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import "../styles/VideoCall.css";

const SOCKET_SERVER = window.location.hostname === "localhost"
  ? "http://localhost:5001"
  : `http://${window.location.hostname}:5001`;

const STUN_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
  ],
};

export default function VideoCall() {
  const [socketConnected, setSocketConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [meId, setMeId] = useState("");
  const [inCall, setInCall] = useState(false);
  const [pairedWith, setPairedWith] = useState(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isFindingMatch, setIsFindingMatch] = useState(false);
  const [callStatus, setCallStatus] = useState("Ready to connect");

  const socketRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();

  useEffect(() => {
    socketRef.current = io(SOCKET_SERVER, { transports: ["websocket"] });

    socketRef.current.on("connect", () => {
      setSocketConnected(true);
      setMeId(socketRef.current.id);
      setCallStatus("Connected to server");
    });

    socketRef.current.on("onlineUsersList", (list) => setOnlineUsers(list));

    // Incoming offer
    socketRef.current.on("call-offer", async ({ from, offer }) => {
      setCallStatus("Incoming call...");
      await ensureLocalStream();
      await createPeerConnection(from, false);

      if (!pcRef.current.currentRemoteDescription) {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pcRef.current.createAnswer();
        await pcRef.current.setLocalDescription(answer);
        socketRef.current.emit("call-answer", { to: from, answer });
        setPairedWith(from);
        setInCall(true);
        setCallStatus("Call connected");
      }
    });

    // Incoming answer
    socketRef.current.on("call-answer", async ({ answer }) => {
      if (!pcRef.current.currentRemoteDescription) {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        setInCall(true);
        setCallStatus("Call connected");
      }
    });

    // ICE candidates
    socketRef.current.on("ice-candidate", ({ candidate }) => {
      if (pcRef.current && candidate) {
        pcRef.current.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.warn);
      }
    });

    // Random match found
    socketRef.current.on("random-match-found", ({ otherId }) => {
      setIsFindingMatch(false);
      startCallTo(otherId);
    });

    // Call ended
    socketRef.current.on("call-ended", endCurrentCallCleanup);

    socketRef.current.emit("request-online-list");

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      stopLocalStream();
    };
    // eslint-disable-next-line
  }, []);

  async function ensureLocalStream() {
    if (localStreamRef.current) return;
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      localStreamRef.current = s;
      if (localVideoRef.current) localVideoRef.current.srcObject = s;
    } catch (err) {
      alert("Camera / Microphone access is required.");
      console.error(err);
    }
  }

  function stopLocalStream() {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
  }

  async function createPeerConnection(peerId, isInitiator = true) {
    // Close previous if exists
    if (pcRef.current) pcRef.current.close();

    pcRef.current = new RTCPeerConnection(STUN_SERVERS);

    if (!localStreamRef.current) await ensureLocalStream();
    localStreamRef.current.getTracks().forEach((track) => pcRef.current.addTrack(track, localStreamRef.current));

    remoteStreamRef.current = new MediaStream();
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStreamRef.current;

    pcRef.current.ontrack = (event) => {
      event.streams[0].getTracks().forEach((t) => remoteStreamRef.current.addTrack(t));
    };

    pcRef.current.onicecandidate = ({ candidate }) => {
      if (candidate) socketRef.current.emit("ice-candidate", { to: peerId, candidate });
    };

    pcRef.current.onconnectionstatechange = () => {
      if (!pcRef.current) return;
      if (["disconnected", "failed"].includes(pcRef.current.connectionState)) {
        setCallStatus("Call disconnected");
        endCurrentCallCleanup();
      }
    };

    return pcRef.current;
  }

  async function startCallTo(targetId) {
    if (!socketRef.current || inCall) return;
    setCallStatus("Calling...");
    await ensureLocalStream();
    await createPeerConnection(targetId, true);

    const offer = await pcRef.current.createOffer();
    await pcRef.current.setLocalDescription(offer);
    socketRef.current.emit("call-offer", { to: targetId, offer });
    setPairedWith(targetId);
    setInCall(true);
    setCallStatus("Call connected");
  }

  function endCurrentCallCleanup() {
    if (pcRef.current) pcRef.current.close();
    pcRef.current = null;
    setPairedWith(null);
    setInCall(false);
    setIsFindingMatch(false);
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  }

  function endCall() {
    if (pairedWith && socketRef.current) socketRef.current.emit("end-call", { to: pairedWith });
    setCallStatus("Call ended");
    endCurrentCallCleanup();
  }

  function handleToggleMic() {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
    setIsMicOn((prev) => !prev);
  }

  function handleToggleCam() {
    if (!localStreamRef.current) return;
    localStreamRef.current.getVideoTracks().forEach((t) => (t.enabled = !t.enabled));
    setIsCamOn((prev) => !prev);
  }

  function handleCallUser(id) {
    if (inCall) return alert("Already in call.");
    startCallTo(id);
  }

  function handleRandomMatch() {
    if (socketRef.current) {
      setIsFindingMatch(true);
      setCallStatus("Finding random match...");
      socketRef.current.emit("random-match-request");
      
      // Timeout after 30 seconds
      setTimeout(() => {
        if (isFindingMatch && !inCall) {
          setIsFindingMatch(false);
          setCallStatus("No match found. Try again.");
        }
      }, 30000);
    }
  }

  function renderUserRow(u) {
    const isMe = u.id === meId;
    return (
      <div key={u.id} className={`user-row ${isMe ? "me" : ""}`}>
        <div className="user-avatar">
          {u.name?.[0]?.toUpperCase() || "?"}
        </div>
        <div className="user-info">
          <div className="user-name">
            {isMe ? `${u.name} (You)` : u.name || "Anonymous"}
          </div>
          <div className="user-status">
            {isMe ? "Online" : "Available"}
          </div>
        </div>
        <div className="user-actions">
          {!isMe && (
            <button 
              className="call-user-btn" 
              onClick={() => handleCallUser(u.id)}
              disabled={inCall}
            >
              <span className="btn-icon">📞</span>
              Call
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="video-call-container">
      <div className="video-call-header">
        <div className="header-content">
          <div className="header-icon">🎥</div>
          <div className="header-text">
            <h1>Live Video Calls</h1>
            <p>Connect with people through real-time video calls</p>
          </div>
        </div>
        <div className="connection-status">
          <div className={`status-indicator ${socketConnected ? 'connected' : 'disconnected'}`}>
            <div className="status-dot"></div>
            {socketConnected ? 'Connected' : 'Disconnected'}
          </div>
          <div className="call-status">{callStatus}</div>
        </div>
      </div>

      <div className="video-call-content">
        <div className="video-section">
          <div className="video-container">
            <div className="video-wrapper local-video">
              <video 
                ref={localVideoRef} 
                autoPlay 
                muted 
                playsInline 
                className={`video-element ${!isCamOn ? 'video-disabled' : ''}`}
              />
              <div className="video-overlay">
                <div className="video-label">
                  <span className="label-icon">👤</span>
                  You {!isCamOn && '(Camera Off)'}
                </div>
                <div className="video-indicators">
                  {!isMicOn && <div className="indicator mute-indicator">🔇 Muted</div>}
                  {!isCamOn && <div className="indicator video-off-indicator">📷 Off</div>}
                </div>
              </div>
            </div>

            <div className="video-wrapper remote-video">
              <video 
                ref={remoteVideoRef} 
                autoPlay 
                playsInline 
                className="video-element"
              />
              <div className="video-overlay">
                <div className="video-label">
                  <span className="label-icon">👥</span>
                  {inCall ? 'Remote User' : 'Waiting for connection...'}
                </div>
                {!inCall && (
                  <div className="waiting-connection">
                    <div className="pulse-animation"></div>
                    <span>Ready to connect</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="controls-section">
            <div className="control-buttons">
              <button 
                onClick={handleToggleCam}
                className={`control-btn ${isCamOn ? 'active' : 'inactive'}`}
              >
                <span className="btn-icon">
                  {isCamOn ? '📹' : '📷'}
                </span>
                {isCamOn ? 'Camera On' : 'Camera Off'}
              </button>

              <button 
                onClick={handleToggleMic}
                className={`control-btn ${isMicOn ? 'active' : 'inactive'}`}
              >
                <span className="btn-icon">
                  {isMicOn ? '🎤' : '🎤'}
                </span>
                {isMicOn ? 'Mic On' : 'Mic Off'}
              </button>

              {!inCall ? (
                <button 
                  onClick={handleRandomMatch}
                  className="control-btn primary match-btn"
                  disabled={isFindingMatch}
                >
                  <span className="btn-icon">
                    {isFindingMatch ? '⏳' : '🔀'}
                  </span>
                  {isFindingMatch ? 'Finding Match...' : 'Random Match'}
                </button>
              ) : (
                <button 
                  onClick={endCall}
                  className="control-btn danger end-call-btn"
                >
                  <span className="btn-icon">📞</span>
                  End Call
                </button>
              )}
            </div>

            {isFindingMatch && (
              <div className="match-finding">
                <div className="searching-animation">
                  <div className="searching-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
                <p>Searching for someone to connect with...</p>
              </div>
            )}
          </div>
        </div>

        <div className="sidebar">
          <div className="panel online-users-panel">
            <div className="panel-header">
              <h3>Online Users</h3>
              <div className="online-count">{onlineUsers.length}</div>
            </div>
            <div className="users-list">
              {onlineUsers.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">👥</div>
                  <p>No users online</p>
                </div>
              ) : (
                onlineUsers.map(renderUserRow)
              )}
            </div>
          </div>

          <div className="panel tips-panel">
            <div className="panel-header">
              <h3>Quick Tips</h3>
              <div className="tips-icon">💡</div>
            </div>
            <div className="tips-list">
              <div className="tip-item">
                <span className="tip-icon">📱</span>
                <div className="tip-text">Allow camera & microphone access when prompted</div>
              </div>
              <div className="tip-item">
                <span className="tip-icon">🎧</span>
                <div className="tip-text">Use headphones for better audio quality</div>
              </div>
              <div className="tip-item">
                <span className="tip-icon">🌐</span>
                <div className="tip-text">Good internet connection required for smooth video</div>
              </div>
              <div className="tip-item">
                <span className="tip-icon">⚡</span>
                <div className="tip-text">Random match connects you with online users instantly</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}