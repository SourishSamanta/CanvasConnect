const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Room = require('../models/Room');
const { auth, JWT_SECRET } = require('../middleware/auth');

const PLAN_LIMITS = {
  free: 3,
  plus: 10,
  premium: 20,
};

// Helper: Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
};

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, plan, avatar } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const validPlan = ['free', 'plus', 'premium'].includes(plan) ? plan : 'free';

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      plan: validPlan,
      avatar: avatar || '🎨',
    });

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
      boardLimit: {
        limit: PLAN_LIMITS[user.plan],
        current: 0,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user._id);
    const currentCount = await Room.countDocuments({ owner: user._id });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
      boardLimit: {
        limit: PLAN_LIMITS[user.plan],
        current: currentCount,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  try {
    const user = req.user;
    const currentCount = await Room.countDocuments({ owner: user._id });

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
      boardLimit: {
        limit: PLAN_LIMITS[user.plan] || 3,
        current: currentCount,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/auth/plan — Update User Subscription Plan
router.patch('/plan', auth, async (req, res) => {
  try {
    const { plan } = req.body;
    if (!['free', 'plus', 'premium'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan. Allowed plans: free, plus, premium' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { plan, updatedAt: new Date() },
      { new: true }
    ).select('-password');

    const currentCount = await Room.countDocuments({ owner: user._id });

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        avatar: user.avatar,
      },
      boardLimit: {
        limit: PLAN_LIMITS[user.plan],
        current: currentCount,
      },
      message: `Successfully upgraded to ${plan.toUpperCase()} plan!`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
