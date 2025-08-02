  import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import QRCodeDisplay from '../components/QRCodeDisplay';

const API_BASE = process.env.REACT_APP_API_URL || "https://local-payment-gateway-server.onrender.com";

export default function Checkout() {
  const { paymentId } = useParams();
  const [pin, setPin] = useState('');
  const [qr, setQr] = useState('');
  const [payment, setPayment] = useState(null);

  // Fetch payment details when page loads
  useEffect(() => {
    axios
      .get(`${API_BASE}/api/payment/${paymentId}`)
      .then((res) => {
        setPayment(res.data);
        setQr(res.data.qr);
      })
      .catch((err) => {
        console.error('Failed to fetch payment:', err.response?.data || err.message);
      });
  }, [paymentId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      await axios.post(
        `${API_BASE}/api/complete-payment`,
        { paymentId, pin },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      alert('Payment Completed');
    } catch (err) {
      alert('Failed to complete payment');
      console.error(err);
    }
  };

  if (!payment) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Checkout</h1>
      <p><strong>Email:</strong> {payment.email}</p>
      <p><strong>Amount:</strong> ₹{payment.amount}</p>
      <p><strong>Description:</strong> {payment.description}</p>

      <QRCodeDisplay dataUrl={qr} />

      <form onSubmit={handleSubmit} className="mt-4">
        <input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="Enter PIN"
          className="border p-2 block mb-2"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2"
        >
          Pay
        </button>
      </form>
    </div>
  );
}
