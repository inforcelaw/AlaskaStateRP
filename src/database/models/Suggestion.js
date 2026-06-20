const mongoose = require('mongoose');

const SuggestionSchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true, index: true },
    messageId: { type: String, default: null },
    channelId: { type: String, default: null },
    userId: { type: String, required: true, index: true },
    text: { type: String, required: true },
    upvotes: { type: [String], default: [] },
    downvotes: { type: [String], default: [] },
    status: { type: String, enum: ['open', 'accepted', 'closed'], default: 'open' }
  },
  { timestamps: true }
);

module.exports = mongoose.models.Suggestion || mongoose.model('Suggestion', SuggestionSchema);
