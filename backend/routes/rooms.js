const express = require('express');
const router  = express.Router();
const Room    = require('../models/Room');
const { v4: uuidv4 } = require('uuid');
const { optionalAuth, auth } = require('../middleware/auth');

const PLAN_LIMITS = {
  free: 3,
  plus: 10,
  premium: 20,
};

// GET /api/rooms — list user's rooms (or empty if guest)
router.get('/', optionalAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.json([]);
    }
    const rooms = await Room.find({ owner: req.user._id }).sort({ updatedAt: -1 }).limit(100);
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/rooms — create a new room with plan limit checking
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, template, username, avatar, color } = req.body;

    let ownerId = req.user._id;
    const userPlan = req.user.plan || 'free';
    const limit = PLAN_LIMITS[userPlan] || 3;
    const currentCount = await Room.countDocuments({ owner: ownerId });

    if (currentCount >= limit) {
      return res.status(403).json({
        error: `Board limit reached (${currentCount}/${limit}) for your ${userPlan.toUpperCase()} plan. Upgrade your plan to create more boards.`,
        limitReached: true,
        plan: userPlan,
        limit,
        currentCount,
      });
    }

    const roomId = uuidv4().slice(0, 8).toUpperCase();

    const room = await Room.create({
      roomId,
      owner: ownerId,
      name: name || 'Untitled Room',
      description: description || '',
      template: template || 'grid',
      users: username ? [{ username, avatar: avatar || '🐱', color: color || '#1971c2' }] : [],
      updatedAt: new Date(),
    });

    res.status(201).json({
      roomId: room.roomId,
      owner: room.owner,
      name: room.name,
      description: room.description,
      template: room.template,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/rooms/:roomId — validate room exists & get details
router.get('/:roomId', async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId.toUpperCase() });
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json({
      roomId: room.roomId,
      owner: room.owner,
      name: room.name,
      description: room.description,
      template: room.template,
      isFavorite: room.isFavorite,
      userCount: room.users ? room.users.length : 0,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/rooms/:roomId — update room title, template, or metadata
router.patch('/:roomId', optionalAuth, async (req, res) => {
  try {
    const { name, template, strokeCount, isFavorite } = req.body;
    const updateData = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (template !== undefined) updateData.template = template;
    if (strokeCount !== undefined) updateData.strokeCount = strokeCount;
    if (isFavorite !== undefined) updateData.isFavorite = isFavorite;

    const room = await Room.findOneAndUpdate(
      { roomId: req.params.roomId.toUpperCase() },
      updateData,
      { new: true }
    );
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json(room);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/rooms/:roomId — delete room
router.delete('/:roomId', optionalAuth, async (req, res) => {
  try {
    const room = await Room.findOneAndDelete({ roomId: req.params.roomId.toUpperCase() });
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json({ message: 'Room deleted successfully', roomId: req.params.roomId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;