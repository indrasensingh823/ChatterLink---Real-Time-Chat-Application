// src/components/Login.js
import React, { useState } from "react";
import { useMyContext } from "../MyContext";

const Login = () => {
  const [name, setName] = useState("");
  const { setUser } = useMyContext();

  const handleLogin = () => {
    if (name.trim()) {
      setUser(name.trim());
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <input
        type="text"
        value={name}
        placeholder="Enter your name"
        onChange={(e) => setName(e.target.value)}
      />
      <button onClick={handleLogin}>Join Chat</button>
    </div>
  );
};

export default Login;
