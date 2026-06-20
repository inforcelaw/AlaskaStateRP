const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Ticket = require('../../database/models/Ticket');
const { getConfig } = require('../../config/configManager');
const { isModerator } = require('../../utils/permissions');
const { successPanel, errorPanel, panelPayload } = require('../../utils/ui');
const { ticketSelectRow, closeTicket } = require('../../modules/tickets');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Ticket commands.')
    .addSubcommand((subcommand) => subcommand.setName('panel').setDescription('Send the ticket panel.'))
    .addSubcommand((subcommand) => subcommand.setName('claim').setDescription('Claim the current ticket.'))
    .addSubcommand((subcommand) => subcommand.setName('close').setDescription('Close the current ticket.'))
    .addSubcommand((subcommand) =>
      subcommand
        .setName('add')
        .setDescription('Add a user to the current ticket.')
        .addUserOption((option) => option.setName('user').setDescription('User to add.').setRequired(true))
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('remove')
        .setDescription('Remove a user from the current ticket.')
        .addUserOption((option) => option.setName('user').setDescription('User to remove.').setRequired(true))
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'panel') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator) && !isModerator(interaction.member)) {
        return interaction.reply(errorPanel('No Permission', 'You need staff permissions to send the ticket panel.', { ephemeral: true }));
      }

      const config = getConfig();
      await interaction.channel.send(panelPayload({
        title: `${config.branding.serverName} Support`,
        description: 'Select the type of ticket you need below. A staff member will help you as soon as possible.',
        status: 'ticket',
        components: [ticketSelectRow()]
      }));

      return interaction.reply(successPanel('Ticket Panel Sent', 'The ticket panel has been sent.', { ephemeral: true }));
    }

    const ticket = await Ticket.findOne({ guildId: interaction.guildId, channelId: interaction.channelId, status: 'open' });
    if (!ticket) return interaction.reply(errorPanel('Ticket Not Found', 'This channel is not linked to an open ticket.', { ephemeral: true }));

    if (!isModerator(interaction.member)) {
      return interaction.reply(errorPanel('No Permission', 'Only staff can manage tickets.', { ephemeral: true }));
    }

    if (subcommand === 'claim') {
      ticket.claimedBy = interaction.user.id;
      await ticket.save();
      return interaction.reply(successPanel('Ticket Claimed', `${interaction.user} has claimed this ticket.`));
    }

    if (subcommand === 'close') {
      return closeTicket(interaction, ticket);
    }

    const user = interaction.options.getUser('user', true);

    if (subcommand === 'add') {
      await interaction.channel.permissionOverwrites.edit(user.id, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true
      });
      return interaction.reply(successPanel('User Added', `${user} has been added to this ticket.`));
    }

    if (subcommand === 'remove') {
      await interaction.channel.permissionOverwrites.delete(user.id).catch(() => null);
      return interaction.reply(successPanel('User Removed', `${user} has been removed from this ticket.`));
    }
  }
};
