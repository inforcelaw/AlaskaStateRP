const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true, index: true },
    channelId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    type: { type: String, required: true },
    claimedBy: { type: String, default: null },
    status: { type: String, enum: ['open', 'closed'], default: 'open' },
    closedBy: { type: String, default: null },
    closedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.models.Ticket || mongoose.model('Ticket', TicketSchema);
