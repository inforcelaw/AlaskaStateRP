const { SlashCommandBuilder } = require('discord.js');
const { getConfig } = require('../../config/configManager');
const { successPanel, errorPanel, panelPayload } = require('../../utils/ui');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('request')
    .setDescription('Request staff assistance.')
    .addSubcommand((subcommand) => subcommand.setName('staff').setDescription('Request available staff.'))
    .addSubcommand((subcommand) => subcommand.setName('moderator').setDescription('Request a moderator.'))
    .addSubcommand((subcommand) => subcommand.setName('administrator').setDescription('Request an administrator.'))
    .addSubcommand((subcommand) =>
      subcommand
        .setName('custom')
        .setDescription('Request a custom role by role ID.')
        .addStringOption((option) => option.setName('role_id').setDescription('Role ID to request.').setRequired(true))
        .addStringOption((option) => option.setName('reason').setDescription('Reason for the request.'))
    ),

  async execute(interaction) {
    const config = getConfig();
    const subcommand = interaction.options.getSubcommand();
    const channel = config.channels.staffRequests ? await interaction.guild.channels.fetch(config.channels.staffRequests).catch(() => null) : interaction.channel;

    if (!channel?.isTextBased()) {
      return interaction.reply(errorPanel('Request Channel Missing', 'The staff request channel is not configured or cannot be found.', { ephemeral: true }));
    }

    const roleId = resolveRoleId(subcommand, interaction, config);
    const reason = interaction.options.getString('reason') || 'No reason provided.';
    const ping = roleId ? `<@&${roleId}>` : '@here';

    await channel.send(panelPayload({
      title: 'Staff Request',
      description: `${ping}\n\n${interaction.user} has requested **${subcommand}** assistance.`,
      status: 'staff',
      fields: [
        { name: 'Requested By', value: `${interaction.user}`, inline: true },
        { name: 'Reason', value: reason }
      ]
    }));

    return interaction.reply(successPanel('Request Sent', `Your request was sent to ${channel}.`, { ephemeral: true }));
  }
};

function resolveRoleId(subcommand, interaction, config) {
  if (subcommand === 'staff') return config.roles.staff?.[0] || '';
  if (subcommand === 'moderator') return config.roles.moderator?.[0] || '';
  if (subcommand === 'administrator') return config.roles.admin?.[0] || '';
  if (subcommand === 'custom') return interaction.options.getString('role_id', true);
  return '';
}
