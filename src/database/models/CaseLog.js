const mongoose = require('mongoose');

const CaseLogSchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true, index: true },
    caseId: { type: String, required: true, index: true },
    actionType: { type: String, required: true },
    targetUserId: { type: String, required: true, index: true },
    staffUserId: { type: String, required: true },
    reason: { type: String, required: true },
    notes: { type: String, default: '' },
    durationMs: { type: Number, default: null },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

CaseLogSchema.index({ guildId: 1, caseId: 1 }, { unique: true });

module.exports = mongoose.models.CaseLog || mongoose.model('CaseLog', CaseLogSchema);
