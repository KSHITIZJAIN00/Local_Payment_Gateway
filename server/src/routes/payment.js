const express = require('express');
const Payment = require('../models/Payment');
const { generate } = require('../utils/qrGenerator');

const router = express.Router();

// Base checkout URL
const CHECKOUT_BASE_URL = "https://paypin.onrender.com/checkout";

/**
 * POST /api/initiate-payment
 * Creates a new payment and returns checkout URL, QR code, and paymentId.
 */
router.post('/initiate-payment', async (req, res) => {
  try {
    console.log("=== /api/initiate-payment called ===");
    console.log("Request body:", req.body);

    const { email, amount, description } = req.body;
    if (!email || !amount) {
      console.error("Missing email or amount");
      return res.status(400).json({ message: "Email and amount required" });
    }

    // Step 1: Save payment to DB
    console.log("Step 1: Creating payment in MongoDB...");
    const payment = await Payment.create({ email, amount, description });
    console.log("Payment saved with ID:", payment._id);

    // Step 2: Build a full URL that includes the payment ID
    const fullCheckoutUrl = `${CHECKOUT_BASE_URL}/${payment._id.toString()}`;

    // Step 3: Generate QR code for this specific checkout URL
    console.log("Generating QR for:", fullCheckoutUrl);
    const qr = await generate(fullCheckoutUrl);

    // Step 4: Send the response back
    const responsePayload = {
      qr,
      url: fullCheckoutUrl,
      paymentId: payment._id.toString(),
    };

    console.log("Final response payload about to send:", responsePayload);
    return res.status(200).json(responsePayload);

  } catch (error) {
    console.error("Error in initiate-payment:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET /api/payment/:id
 * Returns payment details for the checkout page.
 */
router.get('/payment/:id', async (req, res) => {
  try {
    console.log("=== /api/payment/:id called ===");
    console.log("Fetching payment details for ID:", req.params.id);

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      console.warn("Payment not found:", req.params.id);
      return res.status(404).json({ message: 'Payment not found' });
    }

    console.log("Payment found:", payment);

    const fullCheckoutUrl = `${CHECKOUT_BASE_URL}/${payment._id.toString()}`;
    const qr = await generate(fullCheckoutUrl);

    const responsePayload = {
      ...payment.toObject(),
      qr,
      url: fullCheckoutUrl,
    };

    console.log("Sending response:", responsePayload);
    return res.json(responsePayload);

  } catch (err) {
    console.error('Failed to fetch payment:', err);
    return res.status(500).json({ message: 'Failed to fetch payment' });
  }
});

/**
 * POST /api/complete-payment
 * Completes a payment after verifying PIN.
 */
router.post('/complete-payment', async (req, res) => {
  try {
    console.log("=== /api/complete-payment called ===");
    console.log("Request body:", req.body);

    const { paymentId, pin } = req.body;
    console.log("Completing payment for ID:", paymentId);

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      console.warn("Payment not found:", paymentId);
      return res.status(404).json({ message: 'Not found' });
    }

    console.log("Verifying user PIN...");
    if (!(await req.user.verifyPin(pin))) {
      console.warn("Wrong PIN for payment:", paymentId);
      return res.status(401).json({ message: 'Wrong PIN' });
    }

    payment.status = 'completed';
    await payment.save();
    console.log("Payment marked as completed:", payment._id);

    req.app.get('io').emit('payment', payment);

    return res.json({ success: true, payment });

  } catch (err) {
    console.error('Error in complete-payment:', err);
    return res.status(500).json({ message: 'Failed to complete payment' });
  }
});

/**
 * GET /api/payments
 * Lists all payments (for admin).
 */
router.get('/payments', async (_req, res) => {
  console.log("=== /api/payments called ===");
  const list = await Payment.find().sort('-createdAt');
  console.log("Total payments found:", list.length);
  return res.json(list);
});

module.exports = router;
