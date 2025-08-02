import React, { useState, useEffect } from 'react';
import axios from 'axios';
import QRCodeDisplay from '../components/QRCodeDisplay';

const API_BASE =
  process.env.REACT_APP_API_URL || "https://local-payment-gateway-server.onrender.com";

export default function Checkout() {
  const [pin, setPin] = useState('');
  const [qr, setQr] = useState('');
  const [amount, setAmount] = useState('');
  const [email, setEmail] = useState('');
  const [paymentId, setPaymentId] = useState('');

  useEffect(() => {
    const id = localStorage.getItem('currentPaymentId');

    if (!id) {
      alert("No payment found");
      return;
    }

    setPaymentId(id);

    axios.get(`${API_BASE}/api/payment/${id}`)
      .then((res) => {
        setQr(res.data.qr);
        setAmount(res.data.amount);
        setEmail(res.data.email);
      })
      .catch((err) => {
        console.error("Failed to fetch payment:", err);
        alert("Payment not found!");
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE}/api/complete-payment`,
        { paymentId, pin },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      alert('Payment Completed');
    } catch (err) {
      console.error("Error completing payment:", err);
      alert("Failed to complete payment");
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-2">Checkout</h1>
      <p>Email: {email}</p>
      <p>Amount: ₹{amount}</p>

      <div className="my-4">
        <QRCodeDisplay dataUrl={qr} />
      </div>

      <form onSubmit={handleSubmit}>
        <input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="Enter PIN"
          className="border p-2 mr-2"
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
