const { PermissionFlagsBits } = require('discord.js');
const { getConfig } = require('../config/configManager');

function normalizeRoleList(value) {
  if (!value) return [];
  return Array.isArray(value) ? value.filter(Boolean) : [value].filter(Boolean);
}

function hasAnyConfiguredRole(member, roleKeys = []) {
  const config = getConfig();

  if (!member || !member.roles?.cache) return false;

  const allowedRoleIds = roleKeys.flatMap((key) => normalizeRoleList(config.roles[key]));
  return allowedRoleIds.some((roleId) => member.roles.cache.has(roleId));
}

function isManagement(member) {
  return hasAnyConfiguredRole(member, ['management']);
}

function isAdmin(member) {
  if (member.permissions?.has(PermissionFlagsBits.Administrator)) return true;
  return hasAnyConfiguredRole(member, ['management', 'admin']);
}

function isModerator(member) {
  return isAdmin(member) || hasAnyConfiguredRole(member, ['moderator']);
}

function requireAdmin(interaction) {
  return isAdmin(interaction.member);
}

module.exports = {
  hasAnyConfiguredRole,
  isManagement,
  isAdmin,
  isModerator,
  requireAdmin
};
