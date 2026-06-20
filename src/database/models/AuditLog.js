const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true, index: true },
    action: { type: String, required: true },
    actorId: { type: String, required: true },
    targetId: { type: String, default: null },
    metadata: { type: Object, default: {} }
  },
  { timestamps: true }
);

module.exports = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
