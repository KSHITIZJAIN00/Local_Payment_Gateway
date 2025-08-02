const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

router.post('/register', async (req, res) => {
  const { email, pin } = req.body;
  let user = await User.findOne({ email });
  if (!user) {
    user = new User({ email });
  }
  await user.setPin(pin);
  await user.save();
  const token = jwt.sign({ id: user._id, email }, process.env.JWT_SECRET);
  res.json({ token });
});

router.post('/login', async (req, res) => {
  const { email, pin } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await user.verifyPin(pin))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: user._id, email }, process.env.JWT_SECRET);
  res.json({ token });
});

module.exports = router;