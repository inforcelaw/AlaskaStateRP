const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Session = require('../database/models/Session');
const { getConfig } = require('../config/configManager');
const { successPanel, errorPanel, panelPayload } = require('../utils/ui');

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
  } else {
    session.votes.push(interaction.user.id);
  }

  await session.save();
  await updateSessionVoteMessage(interaction, session).catch(() => null);

  const config = getConfig();
  const readyText = session.votes.length >= config.sessions.minimumVotes ? '\n\n✅ Minimum votes reached.' : '';
  const title = alreadyVoted ? 'Vote Removed' : 'Vote Added';
  const description = alreadyVoted
    ? `You removed your vote. Current votes: **${session.votes.length}/${config.sessions.minimumVotes}**${readyText}`
    : `You voted for the session. Current votes: **${session.votes.length}/${config.sessions.minimumVotes}**${readyText}`;

  return interaction.reply(successPanel(title, description, { ephemeral: true }));
}

function voteButtonRow(sessionId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`session:vote:${sessionId}`).setLabel('Vote / Unvote').setStyle(ButtonStyle.Primary)
  );
}

function startupButtonRows() {
  const config = getConfig();
  const rows = [];
  const quickJoinUrl = config.sessions.quickJoinUrl || '';

  if (quickJoinUrl) {
    rows.push(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel(config.sessions.quickJoinLabel || 'Quick Join')
          .setStyle(ButtonStyle.Link)
          .setURL(quickJoinUrl)
      )
    );
  }

  return rows;
}

function progressBar(current, required) {
  const totalBlocks = 10;
  const percentage = Math.min(current / Math.max(required, 1), 1);
  const filled = Math.round(percentage * totalBlocks);
  return '█'.repeat(filled) + '░'.repeat(totalBlocks - filled);
}

function voterList(session) {
  if (!session.votes.length) return 'No votes yet.';

  const visible = session.votes.slice(0, 15).map((id) => `<@${id}>`).join(', ');
  const remaining = session.votes.length > 15 ? `\n+${session.votes.length - 15} more voter(s)` : '';
  return `${visible}${remaining}`;
}

function buildStartupPanel(session, hostUser) {
  const config = getConfig();
  const host = hostUser ? `${hostUser}` : `<@${session.hostId}>`;

  return panelPayload({
    title: 'Session Started',
    description: config.sessions.messages.startup,
    status: 'session',
    fields: [
      { name: 'Session Host', value: host, inline: true },
      { name: 'Status', value: 'Officially In Progress', inline: true },
      { name: 'Server', value: config.branding.serverName, inline: true },
      { name: 'Reminder', value: 'Roleplay realistically, follow server rules, and keep the session professional and enjoyable for everyone.' }
    ],
    components: startupButtonRows()
  });
}

function buildVotePanel(session) {
  const config = getConfig();
  const current = session.votes.length;
  const required = config.sessions.minimumVotes;
  const reached = current >= required;

  return panelPayload({
    title: reached ? 'Session Vote Ready' : 'Session Vote',
    description: reached
      ? 'The vote target has been reached. A session host can now start the server.'
      : 'A session vote is active. Press the button below to vote or remove your vote.',
    status: reached ? 'success' : 'session',
    fields: [
      { name: 'Host', value: `<@${session.hostId}>`, inline: true },
      { name: 'Votes', value: `**${current}/${required}**`, inline: true },
      { name: 'Progress', value: `${progressBar(current, required)} ${Math.min(current, required)}/${required}` },
      { name: 'Voters', value: voterList(session) }
    ],
    components: [voteButtonRow(session.id)]
  });
}

async function updateSessionVoteMessage(interaction, session) {
  if (!session.channelId || !session.messageId) return;

  const channel = await interaction.client.channels.fetch(session.channelId).catch(() => null);
  if (!channel?.isTextBased()) return;

  const message = await channel.messages.fetch(session.messageId).catch(() => null);
  if (!message) return;

  await message.edit(buildVotePanel(session));
}

module.exports = {
  handleSessionButton,
  buildStartupPanel,
  buildVotePanel,
  voteButtonRow,
  updateSessionVoteMessage
};
