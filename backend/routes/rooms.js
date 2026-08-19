const express = require('express');
const router  = express.Router();
const Room    = require('../models/Room');
const { v4: uuidv4 } = require('uuid');

// GET /api/rooms — list recent rooms
router.get('/', async (req, res) => {
  try {
    const rooms = await Room.find().sort({ updatedAt: -1 }).limit(50);
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/rooms — create a new room
router.post('/', async (req, res) => {
  try {
    const { name, description, template, username, avatar, color } = req.body;
    const roomId = uuidv4().slice(0, 8).toUpperCase();

    const room = await Room.create({
      roomId,
      name: name || 'Untitled Room',
      description: description || '',
      template: template || 'grid',
      users: username ? [{ username, avatar: avatar || '🐱', color: color || '#1971c2' }] : [],
      updatedAt: new Date()
    });

    res.status(201).json({
      roomId: room.roomId,
      name: room.name,
      description: room.description,
      template: room.template,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt
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
      name: room.name,
      description: room.description,
      template: room.template,
      userCount: room.users ? room.users.length : 0,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/rooms/:roomId — update room title, template, or metadata
router.patch('/:roomId', async (req, res) => {
  try {
    const { name, template, strokeCount } = req.body;
    const updateData = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (template !== undefined) updateData.template = template;
    if (strokeCount !== undefined) updateData.strokeCount = strokeCount;

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
router.delete('/:roomId', async (req, res) => {
  try {
    const room = await Room.findOneAndDelete({ roomId: req.params.roomId.toUpperCase() });
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json({ message: 'Room deleted successfully', roomId: req.params.roomId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;