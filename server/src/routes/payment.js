const express = require('express');
const Payment = require('../models/Payment');
const { generate } = require('../utils/qrGenerator');
const router = express.Router();

router.post('/initiate-payment', async (req, res) => {
  try {
    const { email, amount, description } = req.body;

    // 1. Create payment
    const payment = await Payment.create({ email, amount, description });

    // 2. Build checkout URL
    const baseUrl = process.env.BASE_URL;
    const checkoutUrl = `${baseUrl}/checkout/${payment._id}`;

    // 3. Generate QR code for the URL (so scanning opens the page)
    const qr = await generate(checkoutUrl);

    // 4. Send response
    res.json({ qr, url: checkoutUrl });
  } catch (error) {
    console.error("Error in initiate-payment:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post('/complete-payment', async (req, res) => {
  const { paymentId, pin } = req.body;
  const payment = await Payment.findById(paymentId);
  if (!payment) return res.status(404).json({ message: 'Not found' });

  if (!(await req.user.verifyPin(pin))) {
    return res.status(401).json({ message: 'Wrong PIN' });
  }

  payment.status = 'completed';
  await payment.save();

  req.app.get('io').emit('payment', payment);
  res.json({ success: true, payment });
});

router.get('/payments', async (_req, res) => {
  const list = await Payment.find().sort('-createdAt');
  res.json(list);
});

module.exports = router;
