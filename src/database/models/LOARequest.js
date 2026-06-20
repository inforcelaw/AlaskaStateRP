const mongoose = require('mongoose');

const LOARequestSchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'denied'], default: 'pending' },
    reviewedBy: { type: String, default: null },
    reviewedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.models.LOARequest || mongoose.model('LOARequest', LOARequestSchema);
