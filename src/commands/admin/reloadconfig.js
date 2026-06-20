const { SlashCommandBuilder } = require('discord.js');
const { reloadConfig, buildWarnings } = require('../../config/configManager');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { requireAdmin } = require('../../utils/permissions');
const AuditLog = require('../../database/models/AuditLog');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reloadconfig')
    .setDescription('Reload config.json without restarting the bot.'),

  async execute(interaction) {
    if (!requireAdmin(interaction)) {
      return interaction.reply({
        embeds: [errorEmbed('No Permission', 'You need Administrator or a configured admin/management role to use this command.')],
        ephemeral: true
      });
    }

    try {
      const { config, loadedAt } = reloadConfig();
      const warnings = buildWarnings(config);

      const warningText = warnings.length
        ? warnings.slice(0, 10).map((warning) => `• ${warning}`).join('\n')
        : 'No warnings found.';

      await AuditLog.create({
        guildId: interaction.guildId,
        action: 'CONFIG_RELOADED',
        actorId: interaction.user.id,
        metadata: { warningCount: warnings.length }
      }).catch(() => null);

      return interaction.reply({
        embeds: [
          successEmbed(
            'Config Reloaded',
            `config.json was reloaded successfully.\n\n**Server:** ${config.branding.serverName}\n**Loaded At:** <t:${Math.floor(loadedAt.getTime() / 1000)}:F>\n\n**Warnings**\n${warningText}`
          )
        ],
        ephemeral: true
      });
    } catch (error) {
      return interaction.reply({
        embeds: [
          errorEmbed(
            'Config Reload Failed',
            `The new config was not applied, so the previous working config is still active.\n\n\`\`\`${error.message.slice(0, 1500)}\`\`\``
          )
        ],
        ephemeral: true
      });
    }
  }
};
