const { Events } = require('discord.js');
const logger = require('../utils/logger');
const { errorPanel } = require('../utils/ui');
const { handleTicketSelect, handleTicketButton } = require('../modules/tickets');
const { handleLoaButton } = require('../modules/loa');
const { handleSessionButton } = require('../modules/sessions');
const { handleSuggestionButton } = require('../modules/suggestions');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction, client) {
    try {
      if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        await command.execute(interaction, client);
        return;
      }

      if (interaction.isStringSelectMenu()) {
        if (interaction.customId === 'ticket:create') return handleTicketSelect(interaction);
        return;
      }

      if (interaction.isButton()) {
        if (interaction.customId.startsWith('ticket:')) return handleTicketButton(interaction);
        if (interaction.customId.startsWith('loa:')) return handleLoaButton(interaction);
        if (interaction.customId.startsWith('session:')) return handleSessionButton(interaction);
        if (interaction.customId.startsWith('suggest:')) return handleSuggestionButton(interaction);
        if (interaction.customId.startsWith('giveaway:')) return require('../modules/giveaways').handleGiveawayButton(interaction);
      }
    } catch (error) {
      const name = interaction.isChatInputCommand() ? `/${interaction.commandName}` : interaction.customId || 'interaction';
      logger.error(`Interaction failed: ${name}`, error);

      const payload = errorPanel('Interaction Failed', 'Something went wrong while handling this interaction.', { ephemeral: true });

      if (interaction.deferred || interaction.replied) {
        await interaction.followUp(payload).catch(() => null);
      } else {
        await interaction.reply(payload).catch(() => null);
      }
    }
  }
};
