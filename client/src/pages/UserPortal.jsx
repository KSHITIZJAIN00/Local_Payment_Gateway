import React, { useState } from 'react';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || "";

export default function UserPortal() {
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('');

  const register = async () => {
    try {
      const res = await axios.post(`${API_BASE}/api/auth/register`, { email, pin });
      setToken(res.data.token);
      localStorage.setItem('token', res.data.token);
      setMessage('User registered successfully!');
    } catch (err) {
      console.error(err);
      setMessage('Registration failed. Please try again.');
    }
  };

  const login = async () => {
    try {
      const res = await axios.post(`${API_BASE}/api/auth/login`, { email, pin });
      setToken(res.data.token);
      localStorage.setItem('token', res.data.token);
      setMessage('Login successful!');
    } catch (err) {
      console.error(err);
      setMessage('Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl">User Portal</h1>
      <input
        type="text"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        className="border p-2"
      />
      <input
        type="password"
        placeholder="PIN"
        value={pin}
        onChange={e => setPin(e.target.value)}
        className="border p-2 mt-2"
      />
      <div className="mt-2">
        <button
          onClick={register}
          className="bg-green-500 text-white px-4 py-2 mr-2"
        >
          Register / Set PIN
        </button>
        <button
          onClick={login}
          className="bg-blue-500 text-white px-4 py-2"
        >
          Login
        </button>
      </div>
      {message && (
        <div className="mt-4 p-2 bg-gray-100 border rounded text-center">
          {message}
        </div>
      )}
    </div>
  );
}
