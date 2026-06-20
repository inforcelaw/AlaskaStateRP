const Suggestion = require('../database/models/Suggestion');
const { successPanel, errorPanel } = require('../utils/ui');

async function handleSuggestionButton(interaction) {
  const [, direction, suggestionId] = interaction.customId.split(':');
  const suggestion = await Suggestion.findById(suggestionId).catch(() => null);

  if (!suggestion || suggestion.status !== 'open') {
    return interaction.reply(errorPanel('Suggestion Closed', 'This suggestion can no longer be voted on.', { ephemeral: true }));
  }

  suggestion.upvotes = suggestion.upvotes.filter((id) => id !== interaction.user.id);
  suggestion.downvotes = suggestion.downvotes.filter((id) => id !== interaction.user.id);

  if (direction === 'up') suggestion.upvotes.push(interaction.user.id);
  if (direction === 'down') suggestion.downvotes.push(interaction.user.id);

  await suggestion.save();

  return interaction.reply(successPanel('Vote Saved', `Votes: **${suggestion.upvotes.length} up / ${suggestion.downvotes.length} down**`, { ephemeral: true }));
}

module.exports = { handleSuggestionButton };
