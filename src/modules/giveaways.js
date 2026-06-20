const Giveaway = require('../database/models/Giveaway');
const { successPanel, errorPanel } = require('../utils/ui');

async function handleGiveawayButton(interaction) {
  const [, action, giveawayId] = interaction.customId.split(':');

  if (action !== 'enter') return;

  const giveaway = await Giveaway.findById(giveawayId).catch(() => null);
  if (!giveaway || giveaway.ended || giveaway.endsAt < new Date()) {
    return interaction.reply(errorPanel('Giveaway Closed', 'This giveaway is no longer accepting entries.', { ephemeral: true }));
  }

  if (giveaway.entrants.includes(interaction.user.id)) {
    giveaway.entrants = giveaway.entrants.filter((id) => id !== interaction.user.id);
    await giveaway.save();
    return interaction.reply(successPanel('Entry Removed', 'You have left this giveaway.', { ephemeral: true }));
  }

  giveaway.entrants.push(interaction.user.id);
  await giveaway.save();
  return interaction.reply(successPanel('Entered Giveaway', 'You have entered this giveaway.', { ephemeral: true }));
}

module.exports = { handleGiveawayButton };
