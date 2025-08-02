const Payment = require('./models/Payment');
const { generate } = require('./utils/qrGenerator');

app.get('/api/payment/:id', async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    const qr = await generate({ paymentId: payment._id });

    res.json({
      ...payment.toObject(),
      qr
    });
  } catch (err) {
    console.error('Failed to fetch payment:', err);
    res.status(500).json({ message: 'Failed to fetch payment' });
  }
});
