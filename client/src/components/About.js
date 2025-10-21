// src/About.js
import React from 'react';
import './About.css';

const About = () => {
  return (
    <div className="about-container">
      <div className="about-box">
        <h1 className="title">💬 About ChatterLink</h1>
        
        <p className="desc">
          Welcome to <strong>ChatterLink</strong> — a next-generation real-time communication platform that brings together chatting, private rooms, intelligent assistant, typing race, daily quotes, and upcoming live meeting & video calling features — all in one place.
        </p>

        <h2>🎯 Purpose</h2>
        <p>
          ChatterLink aims to make online communication simple, secure, and interactive.  
          Whether you want to chat privately, join a global room, enjoy an AI-powered assistant, or play a fun typing game — everything is designed for a smooth, responsive, and modern experience.
        </p>

        <h2>⚡ Key Features</h2>
        <ul>
          <li>💬 Real-time chat with instant message delivery</li>
          <li>🟢 Online status indicator & ✍️ typing notifications</li>
          <li>🔒 Private and secure chat rooms with custom links</li>
          <li>🤖 AI-powered personal assistant for instant help</li>
          <li>🎮 Typing race game for fun and speed challenge</li>
          <li>💡 Daily motivational quotes & jokes</li>
          <li>📹 (Coming Soon) Real-time video meetings, screen sharing & recordings</li>
        </ul>

        <h2>🔐 Privacy Policy</h2>
        <p>
          ChatterLink respects your privacy and is built to ensure user safety.  
          <ul>
            <li>We only store chat messages necessary for smooth communication.</li>
            <li>No personal data such as passwords or contact details are collected.</li>
            <li>Messages are transmitted securely over encrypted connections.</li>
            <li>We never sell, share, or misuse your information.</li>
          </ul>
        </p>

        <h2>📜 User Responsibility</h2>
        <p>
          To keep ChatterLink safe and enjoyable for everyone:
          <ul>
            <li>Be respectful — avoid offensive or spam content.</li>
            <li>Do not share illegal, harmful, or misleading information.</li>
            <li>Protect your privacy — do not share sensitive data publicly.</li>
            <li>Use features fairly and follow community guidelines.</li>
          </ul>
        </p>

        <h2>📄 Terms & Conditions</h2>
        <p>
          By using ChatterLink, you agree to our platform policies and community rules.  
          The service is provided on an “as-is” basis, and while we ensure security and reliability, we are not liable for misuse or external interruptions.  
          All new experimental features (like live video, AI chat, and games) are provided for user testing and improvement.
        </p>

        <h2>🚀 Vision</h2>
        <p>
          Our vision is to make ChatterLink a unified digital communication hub — connecting people globally with secure messaging, real-time collaboration, and intelligent assistance.
        </p>

        <h2>📆 Update History</h2>
        <ul>
          <li>🗓️ <strong>June 5, 2025:</strong> Initial version of ChatterLink released with real-time chat & assistant features.</li>
          <li>🗓️ <strong>October 17, 2025:</strong> Added typing race, daily quotes, private rooms, typing indicators, and upcoming meeting integration.</li>
        </ul>

        <button className="home-btn" onClick={() => window.location.href = "/"}>
          ⬅️ Back to Home
        </button>
      </div>
    </div>
  );
};

export default About;
