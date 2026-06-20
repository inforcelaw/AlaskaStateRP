const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const LOARequest = require('../../database/models/LOARequest');
const { getConfig } = require('../../config/configManager');
const { hasAnyConfiguredRole } = require('../../utils/permissions');
const { successPanel, errorPanel, infoPanel, panelPayload } = require('../../utils/ui');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('loa')
    .setDescription('Leave of absence commands.')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('request')
        .setDescription('Request LOA.')
        .addStringOption((option) => option.setName('start').setDescription('Start date, e.g. 2026-07-01.').setRequired(true))
        .addStringOption((option) => option.setName('end').setDescription('End date, e.g. 2026-07-05.').setRequired(true))
        .addStringOption((option) => option.setName('reason').setDescription('Reason for LOA.').setRequired(true))
    )
    .addSubcommand((subcommand) => subcommand.setName('active').setDescription('View your active/pending LOAs.')),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    if (subcommand === 'request') return requestLoa(interaction);
    if (subcommand === 'active') return activeLoas(interaction);
  }
};

function reviewRow(requestId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`loa:approve:${requestId}`).setLabel('Approve').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`loa:deny:${requestId}`).setLabel('Deny').setStyle(ButtonStyle.Danger)
  );
}

async function requestLoa(interaction) {
  if (!hasAnyConfiguredRole(interaction.member, ['staff', 'moderator', 'admin', 'management'])) {
    return interaction.reply(errorPanel('No Permission', 'You need a configured staff role to request LOA.', { ephemeral: true }));
  }

  const startDate = new Date(interaction.options.getString('start', true));
  const endDate = new Date(interaction.options.getString('end', true));
  const reason = interaction.options.getString('reason', true);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate < startDate) {
    return interaction.reply(errorPanel('Invalid Dates', 'Use valid dates like `2026-07-01`, and make sure the end date is after the start date.', { ephemeral: true }));
  }

  const request = await LOARequest.create({
    guildId: interaction.guildId,
    userId: interaction.user.id,
    startDate,
    endDate,
    reason
  });

  const config = getConfig();
  const reviewChannel = config.channels.loaRequests ? await interaction.guild.channels.fetch(config.channels.loaRequests).catch(() => null) : null;

  if (reviewChannel?.isTextBased()) {
    await reviewChannel.send(panelPayload({
      title: 'LOA Request',
      description: `${interaction.user} has requested leave of absence.`,
      status: 'staff',
      fields: [
        { name: 'Start', value: `<t:${Math.floor(startDate.getTime() / 1000)}:D>`, inline: true },
        { name: 'End', value: `<t:${Math.floor(endDate.getTime() / 1000)}:D>`, inline: true },
        { name: 'Reason', value: reason }
      ],
      components: [reviewRow(request.id)]
    }));
  }

  return interaction.reply(successPanel('LOA Requested', 'Your LOA request has been submitted for review.', { ephemeral: true }));
}

async function activeLoas(interaction) {
  const requests = await LOARequest.find({ guildId: interaction.guildId, userId: interaction.user.id, status: { $in: ['pending', 'approved'] } }).sort({ createdAt: -1 }).limit(5);
  const description = requests.length
    ? requests.map((request) => `**${request.status.toUpperCase()}** • <t:${Math.floor(request.startDate.getTime() / 1000)}:D> to <t:${Math.floor(request.endDate.getTime() / 1000)}:D>\n${request.reason}`).join('\n\n')
    : 'You have no active or pending LOA requests.';

  return interaction.reply(infoPanel('Your LOA Requests', description, { ephemeral: true }));
}
