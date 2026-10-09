import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from './Login.jsx';
import Register from "./Register.jsx";
import AdminDashboard from "./AdminDashboard.jsx";
import JuryDashboard from "./JuryDashboard.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to='/login'/>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/jury" element={<JuryDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;