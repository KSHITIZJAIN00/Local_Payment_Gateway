import React, { useEffect, useState } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

const API_BASE = process.env.REACT_APP_API_URL || "";

export default function AdminDashboard() {
  const [list, setList] = useState([]);

  useEffect(() => {
    const fetchPayments = async () => {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE}/api/payments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setList(res.data);
    };
    fetchPayments();

    const socket = io(API_BASE, { transports: ['websocket'] });
    socket.on('payment', (p) => setList((prev) => [p, ...prev]));

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl">Admin Dashboard</h1>
      <table className="w-full mt-4">
        <thead>
          <tr>
            <th>Email</th>
            <th>Amount</th>
            <th>Description</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {list.map((p) => (
            <tr key={p._id}>
              <td>{p.email}</td>
              <td>{p.amount}</td>
              <td>{p.description}</td>
              <td>{p.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
