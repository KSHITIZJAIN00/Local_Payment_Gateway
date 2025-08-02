require('dotenv').config();
const express = require('express');
const cors = require("cors");
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const authRouter = require('./routes/auth');
const paymentRouter = require('./routes/payment');
const authMiddleware = require('./middleware/auth');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*' } });

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api', authMiddleware, paymentRouter);

io.on('connection', (socket) => {
  console.log('Admin dashboard connected:', socket.id);
});

app.set('io', io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server listening on ${PORT}`));