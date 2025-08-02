const express = require('express');
const Payment = require('../models/Payment');
const { generate } = require('../utils/qrGenerator');

const router = express.Router();

/**
 * POST /api/initiate-payment
 * Creates a new payment and returns checkout URL, QR code, and paymentId.
 */
router.post('/initiate-payment', async (req, res) => {
  try {
    const { email, amount, description } = req.body;
    console.log("Initiating payment for:", { email, amount, description });

    // 1. Create a new payment document in MongoDB
    const payment = await Payment.create({ email, amount, description });

    // 2. Use a clean /checkout URL (no ID in the URL)
    const checkoutUrl = `${process.env.BASE_URL}/checkout`;

    // 3. Generate a QR code for this checkout URL
    const qr = await generate(checkoutUrl);

    // 4. Return all required fields to frontend
    return res.json({
      qr,
      url: checkoutUrl,
      paymentId: payment._id.toString()
    });

  } catch (error) {
    console.error("Error in initiate-payment:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET /api/payment/:id
 * Returns payment details for the checkout page (using the paymentId stored in localStorage).
 */
router.get('/payment/:id', async (req, res) => {
  try {
    console.log("Fetching payment details for:", req.params.id);

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      console.warn("Payment not found:", req.params.id);
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Same checkout URL without exposing ID
    const checkoutUrl = `${process.env.BASE_URL}/checkout`;
    const qr = await generate(checkoutUrl);

    return res.json({
      ...payment.toObject(),
      qr,
      url: checkoutUrl
    });

  } catch (err) {
    console.error('Failed to fetch payment:', err);
    return res.status(500).json({ message: 'Failed to fetch payment' });
  }
});

/**
 * POST /api/complete-payment
 * Completes a payment after verifying the user's PIN.
 */
router.post('/complete-payment', async (req, res) => {
  try {
    const { paymentId, pin } = req.body;
    console.log("Completing payment for:", paymentId);

    const payment = await Payment.findById(paymentId);
    if (!payment) return res.status(404).json({ message: 'Not found' });

    // Verify user PIN
    if (!(await req.user.verifyPin(pin))) {
      return res.status(401).json({ message: 'Wrong PIN' });
    }

    payment.status = 'completed';
    await payment.save();

    // Notify all connected clients (via Socket.IO)
    req.app.get('io').emit('payment', payment);

    return res.json({ success: true, payment });

  } catch (err) {
    console.error('Error in complete-payment:', err);
    retu
