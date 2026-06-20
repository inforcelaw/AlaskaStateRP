const discord = require('discord.js');
const { getConfig } = require('../config/configManager');

function colourToNumber(hex) {
  return Number.parseInt(String(hex).replace('#', ''), 16);
}

function getStatusColour(status = 'info') {
  const config = getConfig();

  if (status === 'success') return config.branding.successColor;
  if (status === 'error') return config.branding.errorColor;
  if (status === 'secondary') return config.branding.secondaryColor;
  return config.branding.embedColor;
}

function getStatusIcon(status = 'info') {
  if (status === 'success') return '✅';
  if (status === 'error') return '❌';
  if (status === 'warning') return '⚠️';
  if (status === 'ticket') return '🎫';
  if (status === 'session') return '🚔';
  if (status === 'staff') return '🛡️';
  return '🧊';
}

function supportsContainers() {
  return Boolean(
    discord.ContainerBuilder &&
    discord.TextDisplayBuilder &&
    discord.MessageFlags?.IsComponentsV2
  );
}

function formatFields(fields = []) {
  if (!fields.length) return '';

  return fields
    .filter((field) => field && field.name)
    .map((field) => `**${field.name}**\n${field.value ?? 'None'}`)
    .join('\n\n');
}

function buildFlags(ephemeral = false) {
  let flags = discord.MessageFlags.IsComponentsV2;
  if (ephemeral && discord.MessageFlags.Ephemeral) flags |= discord.MessageFlags.Ephemeral;
  return flags;
}

function panelPayload(options = {}) {
  const {
    title = 'Alaska State RP',
    description = '',
    fields = [],
    status = 'info',
    components = [],
    ephemeral = false
  } = options;

  const config = getConfig();
  const icon = getStatusIcon(status);
  const colour = getStatusColour(status);
  const body = [
    `### ${icon} ${title}`,
    description,
    formatFields(fields),
    `-# ${config.branding.footer}`
  ].filter(Boolean).join('\n\n');

  if (supportsContainers()) {
    const container = new discord.ContainerBuilder()
      .setAccentColor(colourToNumber(colour))
      .addTextDisplayComponents(
        new discord.TextDisplayBuilder().setContent(body)
      );

    for (const row of components) {
      if (row) container.addActionRowComponents(row);
    }

    return {
      components: [container],
      flags: buildFlags(ephemeral)
    };
  }

  const embed = new discord.EmbedBuilder()
    .setColor(colour)
    .setTitle(`${icon} ${title}`)
    .setDescription(description || null)
    .setFooter({ text: config.branding.footer });

  if (config.branding.logoUrl) embed.setThumbnail(config.branding.logoUrl);

  for (const field of fields) {
    if (!field?.name) continue;
    embed.addFields({
      name: field.name,
      value: String(field.value ?? 'None'),
      inline: Boolean(field.inline)
    });
  }

  return {
    embeds: [embed],
    components,
    ephemeral
  };
}

function successPanel(title, description, options = {}) {
  return panelPayload({ ...options, title, description, status: 'success' });
}

function errorPanel(title, description, options = {}) {
  return panelPayload({ ...options, title, description, status: 'error' });
}

function infoPanel(title, description, options = {}) {
  return panelPayload({ ...options, title, description, status: 'info' });
}

module.exports = {
  panelPayload,
  successPanel,
  errorPanel,
  infoPanel,
  supportsContainers
};
