const mongoose = require('mongoose');

// MongoDB stores room metadata only.
// The actual canvas strokes live in Yjs (in-memory Y.Doc).
const roomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  name:   { type: String, default: 'Untitled Room' },
  users: [{
    username: String,
    avatar:   String,
    color:    String,
    joinedAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Room', roomSchema);