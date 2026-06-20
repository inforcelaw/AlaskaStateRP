const { SlashCommandBuilder } = require('discord.js');
const Infraction = require('../../database/models/Infraction');
const { hasAnyConfiguredRole } = require('../../utils/permissions');
const { successPanel, errorPanel, infoPanel } = require('../../utils/ui');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('infraction')
    .setDescription('Staff infraction commands.')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('issue')
        .setDescription('Issue a staff infraction.')
        .addUserOption((option) => option.setName('user').setDescription('Staff member.').setRequired(true))
        .addStringOption((option) => option.setName('action').setDescription('Action taken.').setRequired(true))
        .addStringOption((option) => option.setName('reason').setDescription('Reason.').setRequired(true))
        .addIntegerOption((option) => option.setName('points').setDescription('Points.').setMinValue(0).setMaxValue(100))
        .addStringOption((option) => option.setName('notes').setDescription('Private notes.'))
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('list')
        .setDescription('List infractions for a staff member.')
        .addUserOption((option) => option.setName('user').setDescription('Staff member.').setRequired(true))
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('remove')
        .setDescription('Mark an infraction inactive.')
        .addStringOption((option) => option.setName('id').setDescription('Infraction ID.').setRequired(true))
    ),

  async execute(interaction) {
    if (!hasAnyConfiguredRole(interaction.member, ['infractionManager', 'admin', 'management'])) {
      return interaction.reply(errorPanel('No Permission', 'You need a configured infraction manager/admin/management role.', { ephemeral: true }));
    }

    const subcommand = interaction.options.getSubcommand();
    if (subcommand === 'issue') return issueInfraction(interaction);
    if (subcommand === 'list') return listInfractions(interaction);
    if (subcommand === 'remove') return removeInfraction(interaction);
  }
};

async function nextInfractionId(guildId) {
  const count = await Infraction.countDocuments({ guildId });
  return `INF-${String(count + 1).padStart(4, '0')}`;
}

async function issueInfraction(interaction) {
  const user = interaction.options.getUser('user', true);
  const action = interaction.options.getString('action', true);
  const reason = interaction.options.getString('reason', true);
  const points = interaction.options.getInteger('points') ?? 0;
  const notes = interaction.options.getString('notes') ?? '';

  const infraction = await Infraction.create({
    guildId: interaction.guildId,
    infractionId: await nextInfractionId(interaction.guildId),
    userId: user.id,
    issuedBy: interaction.user.id,
    punishment: action,
    reason,
    points,
    notes
  });

  await user.send(infoPanel('Staff Infraction Issued', `You received a staff infraction in **${interaction.guild.name}**.\n\n**Action:** ${action}\n**Reason:** ${reason}`)).catch(() => null);

  return interaction.reply(successPanel('Infraction Issued', `${user} received **${action}**.\n\n**ID:** ${infraction.infractionId}`, { ephemeral: true }));
}

async function listInfractions(interaction) {
  const user = interaction.options.getUser('user', true);
  const infractions = await Infraction.find({ guildId: interaction.guildId, userId: user.id, active: true }).sort({ createdAt: -1 }).limit(10);

  const description = infractions.length
    ? infractions.map((item) => `**${item.infractionId}** • ${item.punishment} • ${item.points} point(s)\n${item.reason}`).join('\n\n')
    : 'No active infractions found.';

  return interaction.reply(infoPanel(`Infractions for ${user.username}`, description, { ephemeral: true }));
}

async function removeInfraction(interaction) {
  const id = interaction.options.getString('id', true).toUpperCase();
  const infraction = await Infraction.findOne({ guildId: interaction.guildId, infractionId: id, active: true });
  if (!infraction) return interaction.reply(errorPanel('Infraction Not Found', 'No active infraction was found with that ID.', { ephemeral: true }));

  infraction.active = false;
  await infraction.save();

  return interaction.reply(successPanel('Infraction Removed', `Infraction **${id}** has been marked inactive.`, { ephemeral: true }));
}
