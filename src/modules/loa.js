const LOARequest = require('../database/models/LOARequest');
const { getConfig } = require('../config/configManager');
const { successPanel, errorPanel } = require('../utils/ui');
const { hasAnyConfiguredRole } = require('../utils/permissions');

async function handleLoaButton(interaction) {
  const [, action, requestId] = interaction.customId.split(':');

  if (!hasAnyConfiguredRole(interaction.member, ['loaReviewer', 'admin', 'management'])) {
    return interaction.reply(errorPanel('No Permission', 'You need a configured LOA reviewer role.', { ephemeral: true }));
  }

  const request = await LOARequest.findById(requestId).catch(() => null);
  if (!request || request.status !== 'pending') {
    return interaction.reply(errorPanel('LOA Not Found', 'That LOA request is missing or already reviewed.', { ephemeral: true }));
  }

  request.status = action === 'approve' ? 'approved' : 'denied';
  request.reviewedBy = interaction.user.id;
  request.reviewedAt = new Date();
  await request.save();

  const member = await interaction.guild.members.fetch(request.userId).catch(() => null);
  const loaRoleId = getConfig().roles.loa;
  if (member && loaRoleId && request.status === 'approved') await member.roles.add(loaRoleId).catch(() => null);

  await interaction.update(successPanel(`LOA ${request.status === 'approved' ? 'Approved' : 'Denied'}`, `<@${request.userId}> was ${request.status} by ${interaction.user}.`));
  await member?.send(successPanel(`LOA ${request.status === 'approved' ? 'Approved' : 'Denied'}`, `Your LOA request in **${interaction.guild.name}** was ${request.status}.`)).catch(() => null);
}

module.exports = { handleLoaButton };
