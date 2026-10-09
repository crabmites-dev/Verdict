import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./LandingPage.jsx";
import Login from './Login.jsx';
import Register from "./Register.jsx";
import AdminDashboard from "./AdminDashboard.jsx";
import JuryDashboard from "./JuryDashboard.jsx";
import VoterScreen from "./VoterScreen.jsx";
import ResultsScreen from "./ResultsScreen.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/vote" element={<VoterScreen />} />
        <Route path="/results/:categoryId?" element={<ResultsScreen />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/jury" element={<JuryDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;