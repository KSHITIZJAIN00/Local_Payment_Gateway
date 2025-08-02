import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import QRCodeDisplay from '../components/QRCodeDisplay';

const API_BASE = process.env.REACT_APP_API_URL || "";

export default function Checkout() {
  const { paymentId } = useParams();
  const [pin, setPin] = useState('');
  const [url, setUrl] = useState('');
  const [qr, setQr] = useState('');

  useEffect(() => {
    axios
      .post(`${API_BASE}/api/initiate-payment`, {
        email: 'user@example.com',
        amount: 100,
        description: 'Test'
      })
      .then((res) => {
        setQr(res.data.qr);
        setUrl(res.data.url);
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    await axios.post(
      `${API_BASE}/api/complete-payment`,
      { paymentId, pin },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    alert('Payment Completed');
  };

  return (
    <div className="p-4">
      <h1 className="text-xl">Checkout</h1>
      <QRCodeDisplay dataUrl={qr} />
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="Enter PIN"
          className="border p-2"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 mt-2"
        >
          Pay
        </button>
      </form>
    </div>
  );
}
