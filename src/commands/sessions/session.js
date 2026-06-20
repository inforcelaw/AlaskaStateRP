const { SlashCommandBuilder } = require('discord.js');
const Session = require('../../database/models/Session');
const { getConfig } = require('../../config/configManager');
const { hasAnyConfiguredRole } = require('../../utils/permissions');
const { successPanel, errorPanel, infoPanel, panelPayload } = require('../../utils/ui');
const { buildVotePanel } = require('../../modules/sessions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('session')
    .setDescription('Session management commands.')
    .addSubcommand((subcommand) => subcommand.setName('start').setDescription('Start a server session.'))
    .addSubcommand((subcommand) => subcommand.setName('vote').setDescription('Start a session vote.'))
    .addSubcommand((subcommand) => subcommand.setName('shutdown').setDescription('End the active session.'))
    .addSubcommand((subcommand) => subcommand.setName('low').setDescription('Post a low-player boost message.'))
    .addSubcommand((subcommand) => subcommand.setName('full').setDescription('Post a full-server message.'))
    .addSubcommand((subcommand) => subcommand.setName('stats').setDescription('Show session stats.')),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'stats') return sessionStats(interaction);

    if (!hasAnyConfiguredRole(interaction.member, ['sessionHost', 'admin', 'management'])) {
      return interaction.reply(errorPanel('No Permission', 'You need a configured session host/admin/management role to use session commands.', { ephemeral: true }));
    }

    if (subcommand === 'start') return startSession(interaction);
    if (subcommand === 'vote') return voteSession(interaction);
    if (subcommand === 'shutdown') return shutdownSession(interaction);
    if (subcommand === 'low') return simpleSessionPost(interaction, 'Low Player Boost', getConfig().sessions.messages.low, 'warning');
    if (subcommand === 'full') return simpleSessionPost(interaction, 'Server Full', getConfig().sessions.messages.full, 'success');
  }
};

async function startSession(interaction) {
  const config = getConfig();
  const channel = await getSessionChannel(interaction);

  const session = await Session.create({
    guildId: interaction.guildId,
    hostId: interaction.user.id,
    channelId: channel.id
  });

  const ping = config.sessions.startupPingRole ? `<@&${config.sessions.startupPingRole}>\n\n` : '';
  const message = await channel.send(panelPayload({
    title: 'Server Startup',
    description: `${ping}${config.sessions.messages.startup}`,
    status: 'session',
    fields: [
      { name: 'Host', value: `${interaction.user}`, inline: true },
      { name: 'Session ID', value: session.id, inline: true }
    ]
  }));

  session.messageId = message.id;
  await session.save();

  return interaction.reply(successPanel('Session Started', `Session announcement sent to ${channel}.`, { ephemeral: true }));
}

async function voteSession(interaction) {
  const config = getConfig();
  const channel = await getSessionChannel(interaction);
  const session = await Session.create({ guildId: interaction.guildId, hostId: interaction.user.id, channelId: channel.id });

  if (config.sessions.votePingRole) {
    await channel.send({
      content: `<@&${config.sessions.votePingRole}>`,
      allowedMentions: { roles: [config.sessions.votePingRole] }
    }).catch(() => null);
  }

  const message = await channel.send(buildVotePanel(session));

  session.messageId = message.id;
  await session.save();

  return interaction.reply(successPanel('Session Vote Started', `Vote posted in ${channel}.`, { ephemeral: true }));
}

async function shutdownSession(interaction) {
  const session = await Session.findOne({ guildId: interaction.guildId, status: 'active' }).sort({ createdAt: -1 });
  if (session) {
    session.status = 'ended';
    session.endedAt = new Date();
    await session.save();
  }

  await simpleSessionPost(interaction, 'Session Shutdown', getConfig().sessions.messages.shutdown, 'error');
}

async function simpleSessionPost(interaction, title, description, status = 'session') {
  const channel = await getSessionChannel(interaction);
  await channel.send(panelPayload({ title, description, status }));
  return interaction.reply(successPanel('Session Message Sent', `Message sent to ${channel}.`, { ephemeral: true }));
}

async function sessionStats(interaction) {
  const total = await Session.countDocuments({ guildId: interaction.guildId });
  const active = await Session.countDocuments({ guildId: interaction.guildId, status: 'active' });
  const latest = await Session.findOne({ guildId: interaction.guildId }).sort({ createdAt: -1 });

  return interaction.reply(infoPanel('Session Stats', '', {
    ephemeral: true,
    fields: [
      { name: 'Total Sessions', value: String(total), inline: true },
      { name: 'Active Sessions', value: String(active), inline: true },
      { name: 'Latest Host', value: latest ? `<@${latest.hostId}>` : 'None', inline: true }
    ]
  }));
}

async function getSessionChannel(interaction) {
  const config = getConfig();
  const channelId = config.channels.sessionAnnouncements;
  const channel = channelId ? await interaction.guild.channels.fetch(channelId).catch(() => null) : null;
  return channel?.isTextBased() ? channel : interaction.channel;
}
