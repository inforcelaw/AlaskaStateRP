const Session = require('../database/models/Session');
const { getConfig } = require('../config/configManager');
const { successPanel, errorPanel } = require('../utils/ui');

async function handleSessionButton(interaction) {
  const [, action, sessionId] = interaction.customId.split(':');

  if (action !== 'vote') return;

  const session = await Session.findById(sessionId).catch(() => null);
  if (!session || session.status !== 'active') {
    return interaction.reply(errorPanel('Vote Closed', 'This session vote is no longer active.', { ephemeral: true }));
  }

  const alreadyVoted = session.votes.includes(interaction.user.id);

  if (alreadyVoted) {
    session.votes = session.votes.filter((id) => id !== interaction.user.id);
    await session.save();
    return interaction.reply(successPanel('Vote Removed', `You removed your vote. Current votes: **${session.votes.length}**`, { ephemeral: true }));
  }

  session.votes.push(interaction.user.id);
  await session.save();

  const minimumVotes = getConfig().sessions.minimumVotes;
  const readyText = session.votes.length >= minimumVotes ? '\n\n✅ Minimum votes reached.' : '';

  return interaction.reply(successPanel('Vote Added', `You voted for the session. Current votes: **${session.votes.length}/${minimumVotes}**${readyText}`, { ephemeral: true }));
}

module.exports = { handleSessionButton };
