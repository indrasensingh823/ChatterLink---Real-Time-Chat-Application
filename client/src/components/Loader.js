import React from "react";
import "./Loader.css";

const Loader = () => {
  return (
    <div className="loader-container">
      {/* 🌌 Background particles */}
      <div className="particles"></div>

      <div className="loader-content">
        <img src="/logo.png" alt="ChatterLink Logo" className="loader-logo" />

        <h1 className="loader-text">
          {"ChatterLink".split("").map((char, i) => (
            <span key={i}>{char}</span>
          ))}
        </h1>

        <p className="loader-tagline">
          🚀 Welcome to the future of communication
        </p>

        <p className="loader-subtext">
          Connecting you with the world in real-time...
        </p>

        {/* 🔄 Loading Bar */}
        <div className="loader-bar">
          <div className="loader-progress"></div>
        </div>
      </div>
    </div>
  );
};

export default Loader;