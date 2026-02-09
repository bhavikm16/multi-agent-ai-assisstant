import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./user-authentication/login";
import Signup from "./user-authentication/signup";
import Chat from "./chat";
import Header from "./header";
import History from "./history";
import Admin from "./admin";
import Settings from "./settings";
import { useState, useEffect } from "react";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);


  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("userId"));
  }, []);

  return (
    <div className="min-h-screen bg-base-200">
      <Header isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />

      <div className="app-content">
        <Routes>
          <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/history" element={<History />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/settings" element={<Settings />} />
          {/* Protected route */}
          <Route path="/chat" element={isLoggedIn ? <Chat /> : <Navigate to="/login" />} />

          {/* Default route */}
          <Route path="/" element={<Navigate to={isLoggedIn ? "/chat" : "/login"} />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
