const { SlashCommandBuilder } = require('discord.js');
const mongoose = require('mongoose');
const { reloadConfig, getConfig, getLastLoadedAt, buildWarnings } = require('../../config/configManager');
const { successPanel, errorPanel, infoPanel } = require('../../utils/ui');
const { requireAdmin } = require('../../utils/permissions');
const AuditLog = require('../../database/models/AuditLog');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('admin')
    .setDescription('Admin utilities for the Alaska State RP bot.')
    .addSubcommand((subcommand) =>
      subcommand.setName('reloadconfig').setDescription('Reload config.json without restarting the bot.')
    )
    .addSubcommand((subcommand) =>
      subcommand.setName('health').setDescription('Check bot, database, and config health.')
    )
    .addSubcommand((subcommand) =>
      subcommand.setName('botinfo').setDescription('Show information about the bot.')
    ),

  async execute(interaction, client) {
    if (!requireAdmin(interaction)) {
      return interaction.reply(errorPanel('No Permission', 'You need Administrator or a configured admin/management role to use this command.', { ephemeral: true }));
    }

    const subcommand = interaction.options.getSubcommand();
    if (subcommand === 'reloadconfig') return handleReloadConfig(interaction);
    if (subcommand === 'health') return handleHealth(interaction, client);
    if (subcommand === 'botinfo') return handleBotInfo(interaction, client);

    return interaction.reply(errorPanel('Unknown Subcommand', 'That admin subcommand does not exist.', { ephemeral: true }));
  }
};

async function handleReloadConfig(interaction) {
  try {
    const { config, loadedAt } = reloadConfig();
    const warnings = buildWarnings(config);
    const warningText = warnings.length ? warnings.slice(0, 10).map((warning) => `• ${warning}`).join('\n') : 'No warnings found.';

    await AuditLog.create({
      guildId: interaction.guildId,
      action: 'CONFIG_RELOADED',
      actorId: interaction.user.id,
      metadata: { warningCount: warnings.length }
    }).catch(() => null);

    return interaction.reply(successPanel('Config Reloaded', `config.json was reloaded successfully.\n\n**Server:** ${config.branding.serverName}\n**Loaded At:** <t:${Math.floor(loadedAt.getTime() / 1000)}:F>\n\n**Warnings**\n${warningText}`, { ephemeral: true }));
  } catch (error) {
    return interaction.reply(errorPanel('Config Reload Failed', `The new config was not applied, so the previous working config is still active.\n\n\`\`\`${error.message.slice(0, 1500)}\`\`\``, { ephemeral: true }));
  }
}

async function handleHealth(interaction, client) {
  const config = getConfig();
  const warnings = buildWarnings(config);
  const loadedAt = getLastLoadedAt();
  const databaseState = mongoose.connection.readyState === 1 ? 'Connected' : 'Not connected';
  const uptimeSeconds = Math.floor(process.uptime());

  return interaction.reply(infoPanel('Alaska Bot Health', 'Current bot status.', {
    ephemeral: true,
    fields: [
      { name: 'Bot', value: client.user?.tag ?? 'Unknown', inline: true },
      { name: 'Database', value: databaseState, inline: true },
      { name: 'Uptime', value: `${uptimeSeconds}s`, inline: true },
      { name: 'Config Loaded', value: loadedAt ? `<t:${Math.floor(loadedAt.getTime() / 1000)}:R>` : 'Unknown', inline: true },
      { name: 'Warnings', value: warnings.length ? `${warnings.length}` : '0', inline: true },
      { name: 'Guild', value: interaction.guild?.name ?? 'Unknown', inline: true }
    ]
  }));
}

async function handleBotInfo(interaction, client) {
  const config = getConfig();

  return interaction.reply(infoPanel('Alaska State RP Bot', 'Custom roleplay management bot using slash commands, MongoDB, config.json, and container UI.', {
    ephemeral: true,
    fields: [
      { name: 'Server Name', value: config.branding.serverName, inline: true },
      { name: 'Short Name', value: config.branding.shortName, inline: true },
      { name: 'Bot User', value: client.user?.tag ?? 'Unknown', inline: true },
      { name: 'Database', value: 'MongoDB / Mongoose', inline: true },
      { name: 'Commands', value: 'Slash commands', inline: true },
      { name: 'Theme', value: 'Blue / white Alaska style', inline: true }
    ]
  }));
}
