const { EmbedBuilder } = require('discord.js');
const { getConfig } = require('../config/configManager');

function baseEmbed() {
  const config = getConfig();
  const embed = new EmbedBuilder()
    .setColor(config.branding.embedColor)
    .setFooter({ text: config.branding.footer });

  if (config.branding.logoUrl) embed.setThumbnail(config.branding.logoUrl);
  return embed;
}

function successEmbed(title, description) {
  const config = getConfig();
  return baseEmbed()
    .setColor(config.branding.successColor)
    .setTitle(`✅ ${title}`)
    .setDescription(description);
}

function errorEmbed(title, description) {
  const config = getConfig();
  return baseEmbed()
    .setColor(config.branding.errorColor)
    .setTitle(`❌ ${title}`)
    .setDescription(description);
}

function infoEmbed(title, description) {
  return baseEmbed()
    .setTitle(title)
    .setDescription(description);
}

module.exports = {
  baseEmbed,
  successEmbed,
  errorEmbed,
  infoEmbed
};
