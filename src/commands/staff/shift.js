const { SlashCommandBuilder } = require('discord.js');
const Shift = require('../../database/models/Shift');
const { hasAnyConfiguredRole } = require('../../utils/permissions');
const { successPanel, errorPanel, infoPanel } = require('../../utils/ui');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shift')
    .setDescription('Staff shift tracking commands.')
    .addSubcommand((subcommand) => subcommand.setName('start').setDescription('Start your staff shift.'))
    .addSubcommand((subcommand) => subcommand.setName('break').setDescription('Start a break.'))
    .addSubcommand((subcommand) => subcommand.setName('resume').setDescription('Resume your shift from break.'))
    .addSubcommand((subcommand) => subcommand.setName('end').setDescription('End your staff shift.'))
    .addSubcommand((subcommand) => subcommand.setName('leaderboard').setDescription('Show the shift leaderboard.')),

  async execute(interaction) {
    if (!hasAnyConfiguredRole(interaction.member, ['staff', 'moderator', 'admin', 'management'])) {
      return interaction.reply(errorPanel('No Permission', 'You need a configured staff role to use shift commands.', { ephemeral: true }));
    }

    const subcommand = interaction.options.getSubcommand();
    if (subcommand === 'start') return startShift(interaction);
    if (subcommand === 'break') return breakShift(interaction);
    if (subcommand === 'resume') return resumeShift(interaction);
    if (subcommand === 'end') return endShift(interaction);
    if (subcommand === 'leaderboard') return leaderboard(interaction);
  }
};

async function getActiveShift(interaction) {
  return Shift.findOne({ guildId: interaction.guildId, userId: interaction.user.id, status: { $in: ['active', 'break'] } }).sort({ createdAt: -1 });
}

async function startShift(interaction) {
  const existing = await getActiveShift(interaction);
  if (existing) return interaction.reply(errorPanel('Shift Already Active', 'You already have an active shift.', { ephemeral: true }));

  await Shift.create({ guildId: interaction.guildId, userId: interaction.user.id });
  return interaction.reply(successPanel('Shift Started', 'Your staff shift has started.', { ephemeral: true }));
}

async function breakShift(interaction) {
  const shift = await getActiveShift(interaction);
  if (!shift) return interaction.reply(errorPanel('No Active Shift', 'You do not have an active shift.', { ephemeral: true }));
  if (shift.status === 'break') return interaction.reply(errorPanel('Already On Break', 'You are already on break.', { ephemeral: true }));

  shift.status = 'break';
  shift.breakStartedAt = new Date();
  await shift.save();
  return interaction.reply(successPanel('Break Started', 'Your break has started.', { ephemeral: true }));
}

async function resumeShift(interaction) {
  const shift = await getActiveShift(interaction);
  if (!shift || shift.status !== 'break') return interaction.reply(errorPanel('Not On Break', 'You are not currently on break.', { ephemeral: true }));

  shift.totalBreakMs += Date.now() - shift.breakStartedAt.getTime();
  shift.breakStartedAt = null;
  shift.status = 'active';
  await shift.save();
  return interaction.reply(successPanel('Shift Resumed', 'Your shift has resumed.', { ephemeral: true }));
}

async function endShift(interaction) {
  const shift = await getActiveShift(interaction);
  if (!shift) return interaction.reply(errorPanel('No Active Shift', 'You do not have an active shift.', { ephemeral: true }));

  if (shift.status === 'break' && shift.breakStartedAt) {
    shift.totalBreakMs += Date.now() - shift.breakStartedAt.getTime();
  }

  shift.status = 'ended';
  shift.endedAt = new Date();
  await shift.save();

  const totalMs = shift.endedAt.getTime() - shift.startedAt.getTime() - shift.totalBreakMs;
  const totalMinutes = Math.max(0, Math.round(totalMs / 60000));

  return interaction.reply(successPanel('Shift Ended', `Your shift has ended.\n\n**Total time:** ${totalMinutes} minute(s)`, { ephemeral: true }));
}

async function leaderboard(interaction) {
  const shifts = await Shift.find({ guildId: interaction.guildId, status: 'ended', endedAt: { $ne: null } }).limit(200);
  const totals = new Map();

  for (const shift of shifts) {
    const totalMs = shift.endedAt.getTime() - shift.startedAt.getTime() - shift.totalBreakMs;
    totals.set(shift.userId, (totals.get(shift.userId) || 0) + Math.max(0, totalMs));
  }

  const top = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  const description = top.length
    ? top.map(([userId, totalMs], index) => `**${index + 1}.** <@${userId}> — ${Math.round(totalMs / 60000)} mins`).join('\n')
    : 'No completed shifts yet.';

  return interaction.reply(infoPanel('Shift Leaderboard', description, { ephemeral: true }));
}
