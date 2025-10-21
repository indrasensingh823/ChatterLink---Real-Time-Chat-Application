// src/pages/MeetingCreate.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/meeting.css";

export default function MeetingCreate() {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [startAt, setStartAt] = useState("");
  const [host, setHost] = useState("");
  const [duration, setDuration] = useState(60); // Default 60 minutes
  const [creating, setCreating] = useState(false);
  const [dbStatus, setDbStatus] = useState("checking");
  const [createdMeetings, setCreatedMeetings] = useState([]);
  const [activeTab, setActiveTab] = useState("create"); // 'create', 'upcoming', 'past', 'recordings'
  const navigate = useNavigate();

  // API base URL
  const API_BASE = process.env.NODE_ENV === 'production' 
    ? window.location.origin 
    : 'http://localhost:5001';

  // Set default start time to current time + 30 minutes
  useEffect(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30);
    
    // Format for datetime-local input (YYYY-MM-DDTHH:MM)
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    const defaultDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
    setStartAt(defaultDateTime);

    // Set default host name
    const savedName = localStorage.getItem('userName') || 'Host';
    setHost(savedName);

    // Check database status
    checkDbStatus();
    
    // Load created meetings from localStorage
    loadCreatedMeetings();
  }, []);

  const checkDbStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/db-status`);
      const data = await response.json();
      setDbStatus(data.database);
    } catch (error) {
      console.error("Failed to check DB status:", error);
      setDbStatus("disconnected");
    }
  };

  const fixDatabaseIssue = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/cleanup-duplicates`, {
        method: 'POST'
      });
      const data = await response.json();
      if (data.success) {
        alert("Database cleanup successful! Try creating meeting again.");
        checkDbStatus();
      } else {
        alert("Cleanup failed: " + data.message);
      }
    } catch (error) {
      alert("Cleanup request failed: " + error.message);
    }
  };

  const loadCreatedMeetings = () => {
    const savedMeetings = localStorage.getItem('createdMeetings');
    if (savedMeetings) {
      setCreatedMeetings(JSON.parse(savedMeetings));
    }
  };

  const saveCreatedMeeting = (meetingData) => {
    const updatedMeetings = [...createdMeetings, meetingData];
    setCreatedMeetings(updatedMeetings);
    localStorage.setItem('createdMeetings', JSON.stringify(updatedMeetings));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert("Meeting link copied to clipboard!");
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  };

  const generateMeetingLink = (meetingId) => {
    return `${window.location.origin}/meeting/${meetingId}`;
  };

  const createMeeting = async () => {
    // Validation
    if (!title.trim()) {
      alert("Meeting title is required");
      return;
    }

    if (!startAt) {
      alert("Please select a start time");
      return;
    }

    // Validate if start time is in the future
    const selectedTime = new Date(startAt);
    const currentTime = new Date();
    if (selectedTime <= currentTime) {
      alert("Meeting start time must be in the future");
      return;
    }

    setCreating(true);
    
    try {
      console.log("Creating meeting with data:", { 
        title: title.trim(), 
        description: desc.trim(), 
        startAt: new Date(startAt).toISOString(), 
        host: host.trim() || "Anonymous Host",
        duration: duration
      });

      const response = await fetch(`${API_BASE}/api/meetings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          title: title.trim(), 
          description: desc.trim(), 
          startAt: new Date(startAt).toISOString(), 
          host: host.trim() || "Anonymous Host",
          duration: duration
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      if (data.success) {
        const meetingId = data.meetingId;
        const meetingLink = generateMeetingLink(meetingId);
        
        // Save meeting data
        const meetingData = {
          id: meetingId,
          title: title.trim(),
          description: desc.trim(),
          startAt: new Date(startAt).toISOString(),
          host: host.trim() || "Anonymous Host",
          duration: duration,
          link: meetingLink,
          createdAt: new Date().toISOString(),
          status: 'scheduled'
        };
        
        saveCreatedMeeting(meetingData);
        
        console.log("Meeting created successfully:", meetingId);
        
        // Show storage type message
        if (data.storage === "in-memory") {
          alert("Meeting created successfully! (Note: Using temporary storage - meetings will be lost on server restart)");
        } else {
          alert("Meeting created successfully!");
        }
        
        // Save host name for future use
        if (host.trim()) {
          localStorage.setItem('userName', host.trim());
        }
        
        // Show shareable link
        setActiveTab('upcoming');
      } else {
        throw new Error(data.message || "Failed to create meeting");
      }
    } catch (error) {
      console.error("Create meeting error:", error);
      
      // Better error messages with specific handling for duplicate key error
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        alert("Network error: Cannot connect to server. Please make sure the server is running on port 5001.");
      } else if (error.message.includes('E11000') || error.message.includes('duplicate key')) {
        alert(
          "Database duplicate key error. This is a known issue. " +
          "We're automatically fixing it. Please try again in a few seconds."
        );
        // Auto-fix the issue
        setTimeout(() => {
          fixDatabaseIssue();
        }, 1000);
      } else if (error.message.includes('Mongo') || error.message.includes('database')) {
        alert("Database connection issue. Trying to create meeting in temporary storage...");
        // Retry after showing message
        setTimeout(() => createMeeting(), 100);
      } else {
        alert(`Create failed: ${error.message}`);
      }
    } finally {
      setCreating(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createMeeting();
  };

  const isFormValid = title.trim() && startAt && new Date(startAt) > new Date();

  // Filter meetings by status
  const upcomingMeetings = createdMeetings.filter(meeting => 
    new Date(meeting.startAt) > new Date()
  ).sort((a, b) => new Date(a.startAt) - new Date(b.startAt));

  const pastMeetings = createdMeetings.filter(meeting => 
    new Date(meeting.startAt) <= new Date()
  ).sort((a, b) => new Date(b.startAt) - new Date(a.startAt));

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMeetingStatus = (meeting) => {
    const now = new Date();
    const startTime = new Date(meeting.startAt);
    const endTime = new Date(startTime.getTime() + meeting.duration * 60000);
    
    if (now < startTime) return 'upcoming';
    if (now >= startTime && now <= endTime) return 'live';
    return 'ended';
  };

  return (
    <div className="page meeting-create">
      <div className="meeting-create-container">
        <div className="header-section">
          <h2>Video Meeting Manager</h2>
          <p className="subtitle">Create, schedule and manage your video meetings</p>
        </div>
        
        {/* Database Status Indicator */}
        <div className={`db-status ${dbStatus === 'connected' ? 'connected' : 'disconnected'}`}>
          <span className="status-indicator"></span>
          Database: {dbStatus === 'connected' ? 'Connected' : 'Using Temporary Storage'}
          {dbStatus === 'connected' && (
            <button 
              onClick={fixDatabaseIssue}
              className="fix-db-btn"
            >
              Fix DB Issues
            </button>
          )}
        </div>
        
        {/* Navigation Tabs */}
        <div className="tabs-container">
          <div className="tabs">
            <button 
              className={`tab ${activeTab === 'create' ? 'active' : ''}`}
              onClick={() => setActiveTab('create')}
            >
              Create Meeting
            </button>
            <button 
              className={`tab ${activeTab === 'upcoming' ? 'active' : ''}`}
              onClick={() => setActiveTab('upcoming')}
            >
              Upcoming Meetings ({upcomingMeetings.length})
            </button>
            <button 
              className={`tab ${activeTab === 'past' ? 'active' : ''}`}
              onClick={() => setActiveTab('past')}
            >
              Past Meetings ({pastMeetings.length})
            </button>
            <button 
              className={`tab ${activeTab === 'recordings' ? 'active' : ''}`}
              onClick={() => setActiveTab('recordings')}
            >
              Recordings
            </button>
          </div>
        </div>

        {/* Create Meeting Tab */}
        {activeTab === 'create' && (
          <div className="tab-content">
            <form onSubmit={handleSubmit} className="meeting-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="title">Meeting Title *</label>
                  <input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter meeting title"
                    maxLength={100}
                    disabled={creating}
                  />
                  <div className="char-count">{title.length}/100</div>
                </div>

                <div className="form-group">
                  <label htmlFor="host">Host Name</label>
                  <input
                    id="host"
                    type="text"
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    placeholder="Your name"
                    maxLength={50}
                    disabled={creating}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="desc">Description (Optional)</label>
                <textarea
                  id="desc"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Meeting description, agenda, or notes..."
                  rows={4}
                  maxLength={500}
                  disabled={creating}
                />
                <div className="char-count">{desc.length}/500</div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="startAt">Start Time *</label>
                  <input
                    id="startAt"
                    type="datetime-local"
                    value={startAt}
                    onChange={(e) => setStartAt(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    disabled={creating}
                  />
                  <div className="help-text">
                    Select when you want the meeting to start
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="duration">Duration (minutes)</label>
                  <select
                    id="duration"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    disabled={creating}
                  >
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                    <option value={180}>3 hours</option>
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="btn-secondary"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isFormValid || creating}
                  className="btn-primary"
                >
                  {creating ? (
                    <>
                      <span className="spinner"></span>
                      Creating...
                    </>
                  ) : (
                    "Create & Schedule Meeting"
                  )}
                </button>
              </div>
            </form>

            <div className="meeting-tips">
              <h4>Tips for a great meeting:</h4>
              <ul>
                <li>Choose a clear, descriptive title</li>
                <li>Share the meeting link with participants in advance</li>
                <li>Test your audio and video before starting</li>
                <li>Use the description to outline the meeting agenda</li>
                <li>Set appropriate duration for your meeting</li>
              </ul>
            </div>
          </div>
        )}

        {/* Upcoming Meetings Tab */}
        {activeTab === 'upcoming' && (
          <div className="tab-content">
            <div className="meetings-header">
              <h3>Upcoming Meetings</h3>
              <p>Scheduled meetings that haven't started yet</p>
            </div>
            
            {upcomingMeetings.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📅</div>
                <h4>No upcoming meetings</h4>
                <p>Create your first meeting to get started</p>
                <button 
                  className="btn-primary"
                  onClick={() => setActiveTab('create')}
                >
                  Create Meeting
                </button>
              </div>
            ) : (
              <div className="meetings-grid">
                {upcomingMeetings.map(meeting => (
                  <div key={meeting.id} className="meeting-card">
                    <div className="meeting-card-header">
                      <h4>{meeting.title}</h4>
                      <span className={`status-badge ${getMeetingStatus(meeting)}`}>
                        {getMeetingStatus(meeting)}
                      </span>
                    </div>
                    
                    <div className="meeting-card-body">
                      <div className="meeting-info">
                        <div className="info-item">
                          <span className="label">Host:</span>
                          <span className="value">{meeting.host}</span>
                        </div>
                        <div className="info-item">
                          <span className="label">When:</span>
                          <span className="value">{formatDateTime(meeting.startAt)}</span>
                        </div>
                        <div className="info-item">
                          <span className="label">Duration:</span>
                          <span className="value">{meeting.duration} minutes</span>
                        </div>
                        {meeting.description && (
                          <div className="info-item">
                            <span className="label">Description:</span>
                            <span className="value">{meeting.description}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="meeting-link-section">
                        <label>Shareable Meeting Link:</label>
                        <div className="link-container">
                          <input 
                            type="text" 
                            value={meeting.link} 
                            readOnly 
                            className="meeting-link-input"
                          />
                          <button 
                            onClick={() => copyToClipboard(meeting.link)}
                            className="copy-btn"
                            title="Copy meeting link"
                          >
                            📋
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="meeting-card-actions">
                      <button 
                        onClick={() => navigate(`/meeting/${meeting.id}`)}
                        className="btn-primary"
                      >
                        Join Meeting
                      </button>
                      <button 
                        onClick={() => copyToClipboard(meeting.link)}
                        className="btn-secondary"
                      >
                        Copy Link
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Past Meetings Tab */}
        {activeTab === 'past' && (
          <div className="tab-content">
            <div className="meetings-header">
              <h3>Past Meetings</h3>
              <p>Meetings that have already ended</p>
            </div>
            
            {pastMeetings.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🕒</div>
                <h4>No past meetings</h4>
                <p>Your past meetings will appear here</p>
              </div>
            ) : (
              <div className="meetings-list">
                {pastMeetings.map(meeting => (
                  <div key={meeting.id} className="meeting-item past">
                    <div className="meeting-item-main">
                      <h4>{meeting.title}</h4>
                      <div className="meeting-meta">
                        <span>Host: {meeting.host}</span>
                        <span>•</span>
                        <span>{formatDateTime(meeting.startAt)}</span>
                        <span>•</span>
                        <span>{meeting.duration} minutes</span>
                      </div>
                      {meeting.description && (
                        <p className="meeting-description">{meeting.description}</p>
                      )}
                    </div>
                    <div className="meeting-item-actions">
                      <button 
                        onClick={() => copyToClipboard(meeting.link)}
                        className="btn-secondary"
                      >
                        Copy Link
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Recordings Tab */}
        {activeTab === 'recordings' && (
          <div className="tab-content">
            <div className="meetings-header">
              <h3>Meeting Recordings</h3>
              <p>Access your recorded meeting sessions</p>
            </div>
            
            <div className="empty-state">
              <div className="empty-icon">🎥</div>
              <h4>Recording Feature Coming Soon</h4>
              <p>We're working on bringing you the ability to record and playback your meetings.</p>
              <div className="feature-list">
                <h5>Planned Features:</h5>
                <ul>
                  <li>Automatic meeting recording</li>
                  <li>Cloud storage for recordings</li>
                  <li>Playback with transcript</li>
                  <li>Download and share recordings</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}