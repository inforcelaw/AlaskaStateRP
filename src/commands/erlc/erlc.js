const { SlashCommandBuilder } = require('discord.js');
const { erlcRequest } = require('../../modules/erlc');
const { hasAnyConfiguredRole } = require('../../utils/permissions');
const { successPanel, errorPanel, infoPanel } = require('../../utils/ui');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('erlc')
    .setDescription('ER:LC API commands.')
    .addSubcommand((subcommand) => subcommand.setName('statistics').setDescription('Show ER:LC server statistics.'))
    .addSubcommand((subcommand) => subcommand.setName('players').setDescription('Show online players.'))
    .addSubcommand((subcommand) => subcommand.setName('vehicles').setDescription('Show active vehicles.'))
    .addSubcommand((subcommand) => subcommand.setName('joinlogs').setDescription('Show recent join logs.'))
    .addSubcommand((subcommand) => subcommand.setName('killlogs').setDescription('Show recent kill logs.'))
    .addSubcommand((subcommand) =>
      subcommand
        .setName('command')
        .setDescription('Run an ER:LC server command.')
        .addStringOption((option) => option.setName('command').setDescription('Command to run.').setRequired(true))
    ),

  async execute(interaction) {
    if (!hasAnyConfiguredRole(interaction.member, ['admin', 'management'])) {
      return interaction.reply(errorPanel('No Permission', 'You need a configured admin/management role to use ER:LC commands.', { ephemeral: true }));
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const subcommand = interaction.options.getSubcommand();
      if (subcommand === 'statistics') return showStats(interaction);
      if (subcommand === 'players') return showList(interaction, '/server/players', 'Online Players', formatPlayer);
      if (subcommand === 'vehicles') return showList(interaction, '/server/vehicles', 'Active Vehicles', formatVehicle);
      if (subcommand === 'joinlogs') return showList(interaction, '/server/joinlogs', 'Join Logs', formatGeneric);
      if (subcommand === 'killlogs') return showList(interaction, '/server/killlogs', 'Kill Logs', formatGeneric);
      if (subcommand === 'command') return runCommand(interaction);
    } catch (error) {
      return interaction.editReply(errorPanel('ER:LC Request Failed', error.message));
    }
  }
};

async function showStats(interaction) {
  const data = await erlcRequest('/server');
  return interaction.editReply(infoPanel('ER:LC Statistics', '', {
    fields: [
      { name: 'Name', value: data.Name || 'Unknown', inline: true },
      { name: 'Current Players', value: String(data.CurrentPlayers ?? 'Unknown'), inline: true },
      { name: 'Max Players', value: String(data.MaxPlayers ?? 'Unknown'), inline: true },
      { name: 'Join Key', value: data.JoinKey || 'Unknown', inline: true }
    ]
  }));
}

async function showList(interaction, path, title, formatter) {
  const data = await erlcRequest(path);
  const items = Array.isArray(data) ? data : Object.values(data || {});
  const description = items.length ? items.slice(0, 10).map(formatter).join('\n') : 'No results found.';
  return interaction.editReply(infoPanel(title, description));
}

async function runCommand(interaction) {
  const command = interaction.options.getString('command', true);
  await erlcRequest('/server/command', {
    method: 'POST',
    body: JSON.stringify({ command })
  });
  return interaction.editReply(successPanel('ER:LC Command Sent', `Command sent: \`${command}\``));
}

function formatPlayer(player) {
  return `• **${player.Player || player.username || 'Unknown'}** ${player.Permission ? `— ${player.Permission}` : ''}`;
}

function formatVehicle(vehicle) {
  return `• **${vehicle.Name || vehicle.Vehicle || 'Unknown'}** ${vehicle.Owner ? `— ${vehicle.Owner}` : ''}`;
}

function formatGeneric(item) {
  if (typeof item === 'string') return `• ${item}`;
  return `• ${Object.values(item).slice(0, 3).join(' — ')}`;
}
