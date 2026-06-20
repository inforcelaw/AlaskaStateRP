const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
  StringSelectMenuBuilder,
  AttachmentBuilder
} = require('discord.js');
const Ticket = require('../database/models/Ticket');
const { getConfig } = require('../config/configManager');
const { successPanel, errorPanel, infoPanel, panelPayload } = require('../utils/ui');
const { isModerator } = require('../utils/permissions');

function ticketSelectRow() {
  const config = getConfig();
  const menu = new StringSelectMenuBuilder()
    .setCustomId('ticket:create')
    .setPlaceholder('Select a ticket type');

  for (const type of config.tickets.types) {
    menu.addOptions({
      label: type.label,
      description: type.description.slice(0, 100),
      value: type.id,
      emoji: type.emoji || '🎫'
    });
  }

  return new ActionRowBuilder().addComponents(menu);
}

function ticketControlRows(ticketId = 'current') {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`ticket:claim:${ticketId}`).setLabel('Claim').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`ticket:close:${ticketId}`).setLabel('Close').setStyle(ButtonStyle.Danger)
    )
  ];
}

async function handleTicketSelect(interaction) {
  const config = getConfig();
  const typeId = interaction.values[0];
  const ticketType = config.tickets.types.find((type) => type.id === typeId);

  if (!ticketType) {
    return interaction.reply(errorPanel('Ticket Type Missing', 'That ticket type no longer exists in config.json.', { ephemeral: true }));
  }

  const openCount = await Ticket.countDocuments({ guildId: interaction.guildId, userId: interaction.user.id, status: 'open' });
  if (openCount >= config.tickets.maxOpenTicketsPerUser) {
    return interaction.reply(errorPanel('Ticket Limit Reached', `You can only have **${config.tickets.maxOpenTicketsPerUser}** open ticket(s).`, { ephemeral: true }));
  }

  const categoryId = ticketType.categoryId || config.categories.tickets;
  const supportRoles = ticketType.supportRoles?.length ? ticketType.supportRoles : config.roles.ticketSupport;

  const channel = await interaction.guild.channels.create({
    name: `ticket-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, ''),
    type: ChannelType.GuildText,
    parent: categoryId || undefined,
    topic: `Ticket opened by ${interaction.user.tag} (${interaction.user.id})`,
    permissionOverwrites: [
      { id: interaction.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
      { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
      ...supportRoles.filter(Boolean).map((roleId) => ({ id: roleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }))
    ]
  });

  const ticket = await Ticket.create({
    guildId: interaction.guildId,
    channelId: channel.id,
    userId: interaction.user.id,
    type: ticketType.id
  });

  await channel.send(panelPayload({
    title: ticketType.label,
    description: `${interaction.user}, thank you for opening a ticket. Staff will be with you soon.`,
    status: 'ticket',
    fields: [
      { name: 'Ticket ID', value: ticket.id, inline: true },
      { name: 'Opened By', value: `<@${interaction.user.id}>`, inline: true },
      { name: 'Type', value: ticketType.label, inline: true }
    ],
    components: ticketControlRows(ticket.id)
  }));

  return interaction.reply(successPanel('Ticket Created', `Your ticket has been created: ${channel}`, { ephemeral: true }));
}

async function handleTicketButton(interaction) {
  const [, action] = interaction.customId.split(':');
  const ticket = await Ticket.findOne({ guildId: interaction.guildId, channelId: interaction.channelId, status: 'open' });

  if (!ticket) {
    return interaction.reply(errorPanel('Ticket Not Found', 'This channel is not linked to an open ticket.', { ephemeral: true }));
  }

  if (!isModerator(interaction.member)) {
    return interaction.reply(errorPanel('No Permission', 'Only staff can use ticket controls.', { ephemeral: true }));
  }

  if (action === 'claim') {
    ticket.claimedBy = interaction.user.id;
    await ticket.save();
    return interaction.reply(successPanel('Ticket Claimed', `${interaction.user} has claimed this ticket.`));
  }

  if (action === 'close') {
    return closeTicket(interaction, ticket);
  }
}

async function closeTicket(interaction, ticket) {
  ticket.status = 'closed';
  ticket.closedBy = interaction.user.id;
  ticket.closedAt = new Date();
  await ticket.save();

  const transcript = await buildTranscript(interaction.channel).catch(() => 'Transcript unavailable.');
  const attachment = new AttachmentBuilder(Buffer.from(transcript, 'utf8'), { name: `ticket-${ticket.id}.txt` });

  const config = getConfig();
  const logChannel = config.channels.ticketLogs ? await interaction.guild.channels.fetch(config.channels.ticketLogs).catch(() => null) : null;

  if (logChannel?.isTextBased()) {
    await logChannel.send({
      ...infoPanel('Ticket Closed', '', {
        fields: [
          { name: 'Ticket', value: ticket.id, inline: true },
          { name: 'Opened By', value: `<@${ticket.userId}>`, inline: true },
          { name: 'Closed By', value: `<@${interaction.user.id}>`, inline: true },
          { name: 'Type', value: ticket.type, inline: true }
        ]
      }),
      files: [attachment]
    }).catch(() => null);
  }

  await interaction.reply(successPanel('Ticket Closed', 'This ticket has been closed. The channel will be deleted shortly.'));
  setTimeout(() => interaction.channel.delete('Ticket closed').catch(() => null), 5000);
}

async function buildTranscript(channel) {
  const messages = await channel.messages.fetch({ limit: 100 });
  return messages
    .sort((a, b) => a.createdTimestamp - b.createdTimestamp)
    .map((message) => `[${new Date(message.createdTimestamp).toISOString()}] ${message.author.tag}: ${message.content || '[no text content]'}`)
    .join('\n');
}

module.exports = {
  ticketSelectRow,
  ticketControlRows,
  handleTicketSelect,
  handleTicketButton,
  closeTicket
};
