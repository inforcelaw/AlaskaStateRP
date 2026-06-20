const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true, index: true },
    hostId: { type: String, required: true, index: true },
    status: { type: String, enum: ['active', 'ended'], default: 'active' },
    messageId: { type: String, default: null },
    channelId: { type: String, default: null },
    votes: { type: [String], default: [] },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.models.Session || mongoose.model('Session', SessionSchema);
