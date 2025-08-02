const express = require('express');
const Payment = require('../models/Payment');
const { generate } = require('../utils/qrGenerator');

const router = express.Router();

/**
 * POST /api/initiate-payment
 * Creates a new payment and returns a checkout URL, QR code, and paymentId.
 */
router.post('/initiate-payment', async (req, res) => {
  try {
    const { email, amount, description } = req.body;
    console.log("Initiating payment for:", { email, amount, description });

    // 1. Create a new payment record
    const payment = await Payment.create({ email, amount, description });

    // 2. Checkout URL (no ID in the URL)
    const checkoutUrl = `${process.env.BASE_URL}/checkout`;

    // 3. Generate QR code that points to /checkout
    const qr = await generate(checkoutUrl);

    // 4. Return response with paymentId included
    res.json({
      qr,
      url: checkoutUrl,
      paymentId: payment._id
    });

  } catch (error) {
    console.error("Error in initiate-payment:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET /api/payment/:id
 * Fetch payment details for checkout page.
 */
router.get('/payment/:id', async (req, res) => {
  try {
    console.log("Fetching payment details for:", req.params.id);

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      console.warn("Payment not found:", req.params.id);
      return res.status(404).json({ message: 'Payment not found' });
    }

    const checkoutUrl = `${process.env.BASE_URL}/checkout`;
    const qr = await generate(checkoutUrl);

    res.json({
      ...payment.toObject(),
      qr,
      url: checkoutUrl
    });

  } catch (err) {
    console.error('Failed to fetch payment:', err);
    res.status(500).json({ message: 'Failed to fetch payment' });
  }
});

/**
 * POST /api/complete-payment
 * Completes a payment after verifying PIN.
 */
router.post('/complete-payment', async (req, res) => {
  try {
    const { paymentId, pin } = req.body;
    console.log("Completing payment:", paymentId);

    const payment = await Payment.findById(paymentId);
    if (!payment) return res.status(404).json({ message: 'Not found' });

    if (!(await req.user.verifyPin(pin))) {
      return res.status(401).json({ message: 'Wrong PIN' });
    }

    payment.status = 'completed';
    await payment.save();

    req.app.get('io').emit('payment', payment);
    res.json({ success: true, payment });

  } catch (err) {
    console.error('Error in complete-payment:', err);
    res.status(500).json({ message: 'Failed to complete payment' });
  }
});

/**
 * GET /api/payments
 * List all payments (admin use).
 */
router.get('/payments', async (_req, res) => {
  const list = await Payment.find().sort('-createdAt');
  res.json(list);
});

module.exports = router;
