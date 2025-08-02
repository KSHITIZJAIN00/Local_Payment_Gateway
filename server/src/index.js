require('dotenv').config();
const express = require('express');
const cors = require("cors");
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');

const authRouter = require('./routes/auth');
const paymentRouter = require('./routes/payment');
const authMiddleware = require('./middleware/auth');
const Payment = require('./models/Payment');
const { generate } = require('./utils/qrGenerator');

const app = express();

// ===== UNIVERSAL CORS FIX =====
app.use(cors({
  origin: '*', // allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.options('*', cors());
// ==============================

// ===== BASIC MIDDLEWARE =====
app.use(express.json());
// ============================

// ===== MONGODB CONNECT =====
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB Error:', err));
// ============================

// ===== PUBLIC ROUTE: Initiate Payment =====
app.post('/api/initiate-payment', async (req, res) => {
  try {
    console.log("Initiating payment:", req.body);

    const { email, amount, description } = req.body;
    if (!email || !amount || !description) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const payment = await Payment.create({ email, amount, description });
    const payload = { paymentId: payment._id };
    const qr = await generate(payload);

    return res.json({
      qr,
      url: `${process.env.BASE_URL}/checkout/${payment._id}`
    });
  } catch (err) {
    console.error('Payment initiation error:', err);
    return res.status(500).json({ message: 'Failed to initiate payment' });
  }
});
// ==========================================

// ===== PUBLIC ROUTES: AUTH =====
app.use('/api/auth', authRouter);
// =================================

// ===== PROTECTED ROUTES =====
app.use('/api', authMiddleware, paymentRouter);
// =================================

// ===== SOCKET.IO =====
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*' } });
io.on('connection', (socket) => {
  console.log('Admin dashboard connected:', socket.id);
});
app.set('io', io);

// ===== START SERVER =====
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server listening on ${PORT}`));
