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

// ----- FIXED CORS -----
const corsOptions = {
  origin: [
    'https://paypin.onrender.com', // your frontend Render URL
    'http://localhost:3000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));
// ----------------------

const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*' } });

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

app.use(express.json());

// ---------- Public Route for Initiating Payment ----------
app.post('/api/initiate-payment', async (req, res) => {
  try {
    const { email, amount, description } = req.body;

    const payment = await Payment.create({ email, amount, description });

    const payload = { paymentId: payment._id };
    const qr = await generate(payload);

    res.json({
      qr,
      url: `${process.env.BASE_URL}/checkout/${payment._id}`
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to initiate payment' });
  }
});
// ---------------------------------------------------------

// Auth routes
app.use('/api/auth', authRouter);

// Protected payment routes
app.use('/api', authMiddleware, paymentRouter);

io.on('connection', (socket) => {
  console.log('Admin dashboard connected:', socket.id);
});

app.set('io', io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server listening on ${PORT}`));
