const express = require('express');
const router  = express.Router();
const Room    = require('../models/Room');
const { v4: uuidv4 } = require('uuid'); // npm install uuid

// POST /api/rooms — create a new room (called from lobby)
router.post('/', async (req, res) => {
  try {
    const { name, username, avatar, color } = req.body;
    const roomId = uuidv4().slice(0, 8).toUpperCase(); // e.g. "A3F8B2C1"

    const room = await Room.create({
      roomId,
      name: name || 'Untitled Room',
      users: [{ username, avatar, color }]
    });

    res.status(201).json({ roomId: room.roomId, name: room.name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/rooms/:roomId — validate room exists before joining
router.get('/:roomId', async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json({ roomId: room.roomId, name: room.name, userCount: room.users.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/rooms/:roomId — optional: cleanup
router.delete('/:roomId', async (req, res) => {
  try {
    await Room.findOneAndDelete({ roomId: req.params.roomId });
    res.json({ message: 'Room deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;