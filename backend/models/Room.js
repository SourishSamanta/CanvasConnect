const mongoose = require('mongoose');

// MongoDB stores room metadata only.
// The actual canvas strokes live in Yjs (in-memory Y.Doc).
const roomSchema = new mongoose.Schema({
  roomId:      { type: String, required: true, unique: true },
  owner:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  name:        { type: String, default: 'Untitled Room' },
  description: { type: String, default: '' },
  template:    { type: String, default: 'grid' },
  strokeCount: { type: Number, default: 0 },
  isFavorite:  { type: Boolean, default: false },
  users: [{
    username: String,
    avatar:   String,
    color:    String,
    joinedAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Room', roomSchema);