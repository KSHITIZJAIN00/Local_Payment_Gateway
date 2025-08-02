import React, { useEffect, useState } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

export default function AdminDashboard() {
  const [list, setList] = useState([]);
  useEffect(() => {
    const fetch = async () => {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/payments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setList(res.data);
    };
    fetch();
    const socket = io();
    socket.on('payment', (p) => setList(prev => [p, ...prev]));
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl">Admin Dashboard</h1>
      <table className="w-full mt-4">
        <thead><tr><th>Email</th><th>Amount</th><th>Description</th><th>Status</th></tr></thead>
        <tbody>
          {list.map(p => (
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