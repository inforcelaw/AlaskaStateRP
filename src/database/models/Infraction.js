const mongoose = require('mongoose');

const InfractionSchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true, index: true },
    infractionId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    issuedBy: { type: String, required: true },
    punishment: { type: String, required: true },
    reason: { type: String, required: true },
    notes: { type: String, default: '' },
    points: { type: Number, default: 0 },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

InfractionSchema.index({ guildId: 1, infractionId: 1 }, { unique: true });

module.exports = mongoose.models.Infraction || mongoose.model('Infraction', InfractionSchema);
