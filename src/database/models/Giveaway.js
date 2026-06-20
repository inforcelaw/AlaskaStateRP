const mongoose = require('mongoose');

const GiveawaySchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true, index: true },
    messageId: { type: String, default: null },
    channelId: { type: String, required: true },
    hostId: { type: String, required: true },
    prize: { type: String, required: true },
    winnerCount: { type: Number, default: 1 },
    endsAt: { type: Date, required: true },
    ended: { type: Boolean, default: false },
    entrants: { type: [String], default: [] }
  },
  { timestamps: true }
);

module.exports = mongoose.models.Giveaway || mongoose.model('Giveaway', GiveawaySchema);
