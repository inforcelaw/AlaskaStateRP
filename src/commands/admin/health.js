const { SlashCommandBuilder } = require('discord.js');
const mongoose = require('mongoose');
const { infoEmbed } = require('../../utils/embeds');
const { requireAdmin } = require('../../utils/permissions');
const { getConfig, getLastLoadedAt, buildWarnings } = require('../../config/configManager');
const { errorEmbed } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('health')
    .setDescription('Check bot, database, and config health.'),

  async execute(interaction, client) {
    if (!requireAdmin(interaction)) {
      return interaction.reply({
        embeds: [errorEmbed('No Permission', 'You need Administrator or a configured admin/management role to use this command.')],
        ephemeral: true
      });
    }

    const config = getConfig();
    const warnings = buildWarnings(config);
    const loadedAt = getLastLoadedAt();

    const databaseState = mongoose.connection.readyState === 1 ? 'Connected' : 'Not connected';
    const uptimeSeconds = Math.floor(process.uptime());

    return interaction.reply({
      embeds: [
        infoEmbed('🧊 Alaska Bot Health', 'Current v0.1-base status.')
          .addFields(
            { name: 'Bot', value: client.user?.tag ?? 'Unknown', inline: true },
            { name: 'Database', value: databaseState, inline: true },
            { name: 'Uptime', value: `${uptimeSeconds}s`, inline: true },
            { name: 'Config Loaded', value: loadedAt ? `<t:${Math.floor(loadedAt.getTime() / 1000)}:R>` : 'Unknown', inline: true },
            { name: 'Warnings', value: warnings.length ? `${warnings.length}` : '0', inline: true },
            { name: 'Guild', value: interaction.guild?.name ?? 'Unknown', inline: true }
          )
      ],
      ephemeral: true
    });
  }
};
