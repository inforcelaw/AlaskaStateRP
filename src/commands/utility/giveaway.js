const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Giveaway = require('../../database/models/Giveaway');
const { hasAnyConfiguredRole } = require('../../utils/permissions');
const { successPanel, errorPanel, panelPayload } = require('../../utils/ui');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Giveaway commands.')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('create')
        .setDescription('Create a giveaway.')
        .addStringOption((option) => option.setName('prize').setDescription('Prize.').setRequired(true))
        .addIntegerOption((option) => option.setName('minutes').setDescription('Length in minutes.').setRequired(true).setMinValue(1))
        .addIntegerOption((option) => option.setName('winners').setDescription('Number of winners.').setMinValue(1).setMaxValue(10))
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('end')
        .setDescription('End a giveaway by message ID.')
        .addStringOption((option) => option.setName('message_id').setDescription('Giveaway message ID.').setRequired(true))
    ),

  async execute(interaction) {
    if (!hasAnyConfiguredRole(interaction.member, ['giveawayManager', 'admin', 'management'])) {
      return interaction.reply(errorPanel('No Permission', 'You need a configured giveaway manager/admin/management role.', { ephemeral: true }));
    }

    const subcommand = interaction.options.getSubcommand();
    if (subcommand === 'create') return createGiveaway(interaction);
    if (subcommand === 'end') return endGiveaway(interaction);
  }
};

function enterRow(giveawayId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`giveaway:enter:${giveawayId}`).setLabel('Enter Giveaway').setStyle(ButtonStyle.Primary)
  );
}

async function createGiveaway(interaction) {
  const prize = interaction.options.getString('prize', true);
  const minutes = interaction.options.getInteger('minutes', true);
  const winnerCount = interaction.options.getInteger('winners') ?? 1;
  const endsAt = new Date(Date.now() + minutes * 60 * 1000);

  const giveaway = await Giveaway.create({
    guildId: interaction.guildId,
    channelId: interaction.channelId,
    hostId: interaction.user.id,
    prize,
    winnerCount,
    endsAt
  });

  const message = await interaction.channel.send(panelPayload({
    title: 'Giveaway Started',
    description: prize,
    status: 'success',
    fields: [
      { name: 'Hosted By', value: `${interaction.user}`, inline: true },
      { name: 'Winners', value: String(winnerCount), inline: true },
      { name: 'Ends', value: `<t:${Math.floor(endsAt.getTime() / 1000)}:R>`, inline: true }
    ],
    components: [enterRow(giveaway.id)]
  }));

  giveaway.messageId = message.id;
  await giveaway.save();

  return interaction.reply(successPanel('Giveaway Created', 'Giveaway message sent.', { ephemeral: true }));
}

async function endGiveaway(interaction) {
  const messageId = interaction.options.getString('message_id', true);
  const giveaway = await Giveaway.findOne({ guildId: interaction.guildId, messageId, ended: false });
  if (!giveaway) return interaction.reply(errorPanel('Giveaway Not Found', 'No active giveaway was found with that message ID.', { ephemeral: true }));

  giveaway.ended = true;
  await giveaway.save();

  const winners = pickWinners(giveaway.entrants, giveaway.winnerCount);
  const winnerText = winners.length ? winners.map((id) => `<@${id}>`).join(', ') : 'No valid entrants.';

  await interaction.channel.send(successPanel('Giveaway Ended', `**Prize:** ${giveaway.prize}\n**Winner(s):** ${winnerText}`));
  return interaction.reply(successPanel('Giveaway Ended', 'The giveaway has been ended.', { ephemeral: true }));
}

function pickWinners(entrants, amount) {
  const unique = [...new Set(entrants)];
  const selected = [];

  while (unique.length && selected.length < amount) {
    const index = Math.floor(Math.random() * unique.length);
    selected.push(unique.splice(index, 1)[0]);
  }

  return selected;
}
