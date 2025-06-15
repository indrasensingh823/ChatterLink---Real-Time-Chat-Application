// src/About.js
import React from 'react';
import './About.css';

const About = () => {
  return (
    <div className="about-container">
      <div className="about-box">
        <h1 className="title">📱 About Our Chat App</h1>
        
        <p className="desc">
          Welcome to our Real-Time Chat App – a secure, fast, and modern messaging platform designed and developed by <strong>Indrasen Singh</strong>. This app enables seamless communication in real-time across devices.
        </p>

        <h2>🎯 Purpose</h2>
        <p>
          This app was created with the aim of improving digital communication by making chatting intuitive, responsive, and fun for everyone – be it friends, teams, or communities.
        </p>
      

        <h2>📜 User Responsibility</h2>
        <p>
        <ul>
          <li>Use respectful language and avoid spamming.</li>
          <li>Don't share harmful, illegal, or offensive content.</li>
          <li>Maintain your privacy and don't share personal info carelessly.</li>
        </ul>
        </p>
        <h2>🔐 Privacy Policy</h2>
        <p>
          We do not store your personal data beyond what is required for message delivery. All chats are stored securely and handled with care.
        </p>

        <h2>📄 Terms and Conditions</h2>
        <p>
          By using this app, you agree to be responsible for your shared content. The app is provided "as-is" and the developer is not liable for misuse.
        </p>

        <h2>📆 Last Updated</h2>
        <p>June 5, 2025</p>
       
        <button className="home-btn" onClick={() => window.location.href = "/"}>
          ⬅️ Back to Home
        </button>
      </div>
    </div>
  );
};

export default About;
