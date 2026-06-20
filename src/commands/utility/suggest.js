const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Suggestion = require('../../database/models/Suggestion');
const { getConfig } = require('../../config/configManager');
const { successPanel, errorPanel, panelPayload } = require('../../utils/ui');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('suggest')
    .setDescription('Submit a server suggestion.')
    .addStringOption((option) => option.setName('idea').setDescription('Your suggestion.').setRequired(true).setMaxLength(1000)),

  async execute(interaction) {
    const config = getConfig();
    const channel = config.channels.suggestions ? await interaction.guild.channels.fetch(config.channels.suggestions).catch(() => null) : interaction.channel;

    if (!channel?.isTextBased()) {
      return interaction.reply(errorPanel('Suggestion Channel Missing', 'The suggestions channel is not configured or cannot be found.', { ephemeral: true }));
    }

    const idea = interaction.options.getString('idea', true);
    const suggestion = await Suggestion.create({ guildId: interaction.guildId, userId: interaction.user.id, text: idea, channelId: channel.id });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`suggest:up:${suggestion.id}`).setLabel('Upvote').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`suggest:down:${suggestion.id}`).setLabel('Downvote').setStyle(ButtonStyle.Danger)
    );

    const message = await channel.send(panelPayload({
      title: 'New Suggestion',
      description: idea,
      status: 'info',
      fields: [
        { name: 'Suggested By', value: `${interaction.user}`, inline: true },
        { name: 'Votes', value: '0 up / 0 down', inline: true }
      ],
      components: [row]
    }));

    suggestion.messageId = message.id;
    await suggestion.save();

    return interaction.reply(successPanel('Suggestion Sent', `Your suggestion was sent to ${channel}.`, { ephemeral: true }));
  }
};
