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

// ===== DYNAMIC CORS FIX =====
const allowedOrigins = [
  /\.onrender\.com$/,  // allow any frontend on Render
  /\.vercel\.app$/,    // allow any frontend on Vercel
  "http://localhost:3000"
];

app.use(
  cors({
    origin: (origin, callback) => {
      console.log(`[CORS] Incoming request origin:`, origin);
      if (!origin) {
        console.log("[CORS] No origin (Postman/server request) -> allowed");
        return callback(null, true);
      }

      const isAllowed = allowedOrigins.some((pattern) =>
        typeof pattern === "string" ? pattern === origin : pattern.test(origin)
      );

      if (isAllowed) {
        console.log(`[CORS] Allowed origin: ${origin}`);
        callback(null, true);
      } else {
        console.error(`[CORS] Blocked origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false
  })
);

app.options('*', cors());
// ==============================

// ===== BASIC MIDDLEWARE =====
app.use(express.json());
// ============================

// ===== MONGODB CONNECT =====
console.log("[MongoDB] Connecting to:", process.env.MONGODB_URI);

mongoose.set('strictQuery', true);
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('[MongoDB] Connected successfully'))
  .catch(err => console.error('[MongoDB] Connection error:', err));
// ============================

// ===== PUBLIC ROUTE: Initiate Payment =====
app.post('/api/initiate-payment', async (req, res) => {
  console.log("=== /api/initiate-payment called ===");
  console.log("Request body:", req.body);

  try {
    const { email, amount, description } = req.body;
    console.log("Step 1: Validating fields");
    if (!email || !amount || !description) {
      console.warn("Validation failed: Missing required fields");
      return res.status(400).json({ message: 'Missing required fields' });
    }

    console.log("Step 2: Creating payment in MongoDB...");
    let payment;
    try {
      payment = await Payment.create({ email, amount, description });
      console.log("Step 2 OK: Payment saved:", payment);
    } catch (dbErr) {
      console.error("Database error while creating payment:", dbErr);
      return res.status(500).json({ message: 'DB error while saving payment' });
    }

    console.log("Step 3: Generating QR...");
    let qr;
    try {
      qr = await generate({ paymentId: payment._id });
      console.log("Step 3 OK: QR generated");
    } catch (qrErr) {
      console.error("QR generation error:", qrErr);
      return res.status(500).json({ message: 'QR generation failed' });
    }

    console.log("Step 4: Returning success response");
    return res.json({
      qr,
      url: `${process.env.BASE_URL}/checkout/${payment._id}`
    });

  } catch (err) {
    console.error('General error in /api/initiate-payment:', err);
    return res.status(500).json({ message: 'Failed to initiate payment' });
  }
});
// ==========================================

// ===== PUBLIC ROUTES: AUTH =====
app.use('/api/auth', authRouter);

// ===== PROTECTED ROUTES =====
app.use('/api', authMiddleware, paymentRouter);

// ===== SOCKET.IO =====
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*' } });

io.on('connection', (socket) => {
  console.log('Admin dashboard connected:', socket.id);
});
app.set('io', io);

// ===== START SERVER =====
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
