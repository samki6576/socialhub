const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  console.log('📝 Register request received:', req.body);
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      console.error('❌ Missing fields:', { username, email, password });
      return res.status(400).json({ message: 'All fields are required' });
    }
    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) {
      console.warn('⚠️ User already exists:', username, email);
      return res.status(400).json({ message: 'User already exists' });
    }
    const user = await User.create({ username, email, password });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    console.log('✅ User registered:', username);
    res.status(201).json({ token, user: { id: user._id, username, email } });
  } catch (err) {
    console.error('❌ Registration error:', err.message);
    console.error(err.stack);
    res.status(500).json({ message: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  console.log('🔐 Login request:', req.body.email);
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      console.warn('⚠️ Invalid login attempt:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user._id, username: user.username, email: user.email, bio: user.bio, profilePic: user.profilePic } });
  } catch (err) {
    console.error('❌ Login error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// Get current user
router.get('/me', protect, async (req, res) => {
  res.json(req.user);
});

module.exports = router;
