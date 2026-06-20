const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const CaseLog = require('../../database/models/CaseLog');
const { getConfig } = require('../../config/configManager');
const { isModerator } = require('../../utils/permissions');
const { successPanel, errorPanel, infoPanel } = require('../../utils/ui');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mod')
    .setDescription('Moderation commands.')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('warn')
        .setDescription('Warn a user.')
        .addUserOption((option) => option.setName('user').setDescription('User to warn.').setRequired(true))
        .addStringOption((option) => option.setName('reason').setDescription('Reason.').setRequired(true))
        .addStringOption((option) => option.setName('notes').setDescription('Private staff notes.'))
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('timeout')
        .setDescription('Timeout a user.')
        .addUserOption((option) => option.setName('user').setDescription('User to timeout.').setRequired(true))
        .addIntegerOption((option) => option.setName('minutes').setDescription('Timeout length in minutes.').setRequired(true).setMinValue(1).setMaxValue(40320))
        .addStringOption((option) => option.setName('reason').setDescription('Reason.').setRequired(true))
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('kick')
        .setDescription('Kick a user.')
        .addUserOption((option) => option.setName('user').setDescription('User to kick.').setRequired(true))
        .addStringOption((option) => option.setName('reason').setDescription('Reason.').setRequired(true))
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('ban')
        .setDescription('Ban a user.')
        .addUserOption((option) => option.setName('user').setDescription('User to ban.').setRequired(true))
        .addStringOption((option) => option.setName('reason').setDescription('Reason.').setRequired(true))
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('unban')
        .setDescription('Unban a user by ID.')
        .addStringOption((option) => option.setName('user_id').setDescription('Discord user ID.').setRequired(true))
        .addStringOption((option) => option.setName('reason').setDescription('Reason.').setRequired(true))
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('logs')
        .setDescription('View moderation logs for a user.')
        .addUserOption((option) => option.setName('user').setDescription('User to check.').setRequired(true))
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('case')
        .setDescription('View a moderation case.')
        .addStringOption((option) => option.setName('case_id').setDescription('Case ID.').setRequired(true))
    ),

  async execute(interaction) {
    if (!isModerator(interaction.member)) {
      return interaction.reply(errorPanel('No Permission', 'You need a configured moderator/admin/management role to use moderation commands.', { ephemeral: true }));
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'logs') return viewLogs(interaction);
    if (subcommand === 'case') return viewCase(interaction);
    if (subcommand === 'unban') return runUnban(interaction);

    const user = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason', true);
    const notes = interaction.options.getString('notes') ?? '';
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (subcommand === 'warn') {
      const caseLog = await createCase(interaction, 'warn', user.id, reason, notes);
      await user.send({ ...infoPanel('Moderation Notice', `You were warned in **${interaction.guild.name}**.\n\n**Reason:** ${reason}`) }).catch(() => null);
      await sendModLog(interaction, caseLog);
      return interaction.reply(successPanel('User Warned', `${user} has been warned.\n\n**Case:** ${caseLog.caseId}`, { ephemeral: true }));
    }

    if (!member && subcommand !== 'ban') {
      return interaction.reply(errorPanel('Member Not Found', 'That user is not currently in the server.', { ephemeral: true }));
    }

    if (subcommand === 'timeout') {
      const minutes = interaction.options.getInteger('minutes', true);
      const durationMs = minutes * 60 * 1000;
      await member.timeout(durationMs, reason);
      const caseLog = await createCase(interaction, 'timeout', user.id, reason, notes, durationMs);
      await sendModLog(interaction, caseLog);
      return interaction.reply(successPanel('User Timed Out', `${user} was timed out for **${minutes} minutes**.\n\n**Case:** ${caseLog.caseId}`, { ephemeral: true }));
    }

    if (subcommand === 'kick') {
      await member.kick(reason);
      const caseLog = await createCase(interaction, 'kick', user.id, reason, notes);
      await sendModLog(interaction, caseLog);
      return interaction.reply(successPanel('User Kicked', `${user} was kicked.\n\n**Case:** ${caseLog.caseId}`, { ephemeral: true }));
    }

    if (subcommand === 'ban') {
      await interaction.guild.members.ban(user.id, { reason });
      const caseLog = await createCase(interaction, 'ban', user.id, reason, notes);
      await sendModLog(interaction, caseLog);
      return interaction.reply(successPanel('User Banned', `${user} was banned.\n\n**Case:** ${caseLog.caseId}`, { ephemeral: true }));
    }
  }
};

async function nextCaseId(guildId) {
  const count = await CaseLog.countDocuments({ guildId });
  return `ASRP-${String(count + 1).padStart(4, '0')}`;
}

async function createCase(interaction, actionType, targetUserId, reason, notes = '', durationMs = null) {
  return CaseLog.create({
    guildId: interaction.guildId,
    caseId: await nextCaseId(interaction.guildId),
    actionType,
    targetUserId,
    staffUserId: interaction.user.id,
    reason,
    notes,
    durationMs
  });
}

async function runUnban(interaction) {
  const userId = interaction.options.getString('user_id', true);
  const reason = interaction.options.getString('reason', true);

  await interaction.guild.members.unban(userId, reason);
  const caseLog = await createCase(interaction, 'unban', userId, reason);
  await sendModLog(interaction, caseLog);

  return interaction.reply(successPanel('User Unbanned', `User ID **${userId}** was unbanned.\n\n**Case:** ${caseLog.caseId}`, { ephemeral: true }));
}

async function viewLogs(interaction) {
  const user = interaction.options.getUser('user', true);
  const logs = await CaseLog.find({ guildId: interaction.guildId, targetUserId: user.id }).sort({ createdAt: -1 }).limit(10);

  const description = logs.length
    ? logs.map((log) => `**${log.caseId}** • ${log.actionType} • <t:${Math.floor(log.createdAt.getTime() / 1000)}:R>\n${log.reason}`).join('\n\n')
    : 'No moderation logs found for that user.';

  return interaction.reply(infoPanel('Moderation Logs', description, { ephemeral: true }));
}

async function viewCase(interaction) {
  const caseId = interaction.options.getString('case_id', true).toUpperCase();
  const log = await CaseLog.findOne({ guildId: interaction.guildId, caseId });

  if (!log) return interaction.reply(errorPanel('Case Not Found', 'No case was found with that ID.', { ephemeral: true }));

  return interaction.reply(infoPanel(`Case ${log.caseId}`, '', {
    ephemeral: true,
    fields: [
      { name: 'Action', value: log.actionType, inline: true },
      { name: 'Target', value: `<@${log.targetUserId}>`, inline: true },
      { name: 'Staff', value: `<@${log.staffUserId}>`, inline: true },
      { name: 'Reason', value: log.reason },
      { name: 'Notes', value: log.notes || 'None' }
    ]
  }));
}

async function sendModLog(interaction, caseLog) {
  const config = getConfig();
  const channelId = config.channels.modLogs;
  if (!channelId) return;

  const channel = await interaction.guild.channels.fetch(channelId).catch(() => null);
  if (!channel?.isTextBased()) return;

  await channel.send(infoPanel(`Moderation Case ${caseLog.caseId}`, '', {
    fields: [
      { name: 'Action', value: caseLog.actionType, inline: true },
      { name: 'Target', value: `<@${caseLog.targetUserId}>`, inline: true },
      { name: 'Staff', value: `<@${caseLog.staffUserId}>`, inline: true },
      { name: 'Reason', value: caseLog.reason }
    ]
  })).catch(() => null);
}
