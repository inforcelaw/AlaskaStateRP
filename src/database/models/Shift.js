const mongoose = require('mongoose');

const ShiftSchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    status: { type: String, enum: ['active', 'break', 'ended'], default: 'active' },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date, default: null },
    breakStartedAt: { type: Date, default: null },
    totalBreakMs: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.models.Shift || mongoose.model('Shift', ShiftSchema);
