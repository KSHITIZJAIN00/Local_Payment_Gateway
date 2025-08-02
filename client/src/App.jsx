import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import Checkout from './pages/Checkout';
import UserPortal from './pages/UserPortal';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/portal" />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/portal" element={<UserPortal />} />
      </Routes>
    </Router>
  );
}

export default App;
