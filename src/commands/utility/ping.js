const { SlashCommandBuilder } = require('discord.js');
const { successEmbed } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check the bot latency.'),

  async execute(interaction, client) {
    const sent = await interaction.reply({
      embeds: [successEmbed('Pinging...', 'Checking bot latency.')],
      fetchReply: true,
      ephemeral: true
    });

    const roundtrip = sent.createdTimestamp - interaction.createdTimestamp;
    const websocket = Math.round(client.ws.ping);

    return interaction.editReply({
      embeds: [successEmbed('Pong', `Roundtrip: **${roundtrip}ms**\nWebSocket: **${websocket}ms**`)]
    });
  }
};
