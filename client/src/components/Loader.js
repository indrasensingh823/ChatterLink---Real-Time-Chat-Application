import React from "react";
import "./Loader.css";

const Loader = () => {
  return (
    <div className="loader-container">
      <div className="loader-content">
        <img src="/logo.png" alt="ChatterLink Logo" className="loader-logo" />

        <h1 className="loader-text">
          <span>C</span><span>h</span><span>a</span><span>t</span>
          <span>t</span><span>e</span><span>r</span>
          <span>L</span><span>i</span><span>n</span><span>k</span>
        </h1>

        <p className="loader-tagline">Connect • Chat • Collaborate</p>
      </div>
    </div>
  );
};

export default Loader;