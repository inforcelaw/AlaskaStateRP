const { SlashCommandBuilder } = require('discord.js');
const { successPanel } = require('../../utils/ui');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check the bot latency.'),

  async execute(interaction, client) {
    const sent = await interaction.reply({
      ...successPanel('Pinging...', 'Checking bot latency.', { ephemeral: true }),
      fetchReply: true
    });

    const roundtrip = sent.createdTimestamp - interaction.createdTimestamp;
    const websocket = Math.round(client.ws.ping);

    return interaction.editReply(successPanel('Pong', `Roundtrip: **${roundtrip}ms**\nWebSocket: **${websocket}ms**`));
  }
};
