const fs = require('node:fs');
const path = require('node:path');
const { z } = require('zod');
const logger = require('../utils/logger');

const HexColourSchema = z.string().regex(/^#([0-9A-Fa-f]{6})$/, 'Must be a hex colour like #0B3D91');

const ConfigSchema = z.object({
  branding: z.object({
    serverName: z.string().min(1),
    shortName: z.string().min(1),
    embedColor: HexColourSchema,
    secondaryColor: HexColourSchema,
    successColor: HexColourSchema,
    errorColor: HexColourSchema,
    footer: z.string().min(1),
    logoUrl: z.string().optional().default(''),
    bannerUrl: z.string().optional().default('')
  }),
  roles: z.record(z.union([z.string(), z.array(z.string())])),
  channels: z.record(z.string()),
  categories: z.record(z.string()),
  modules: z.record(z.boolean()),
  tickets: z.object({
    maxOpenTicketsPerUser: z.number().int().min(1).default(1),
    transcripts: z.boolean().default(true),
    types: z.array(z.object({
      id: z.string().min(1),
      label: z.string().min(1),
      description: z.string().min(1),
      emoji: z.string().optional().default('🎫'),
      categoryId: z.string().optional().default(''),
      supportRoles: z.array(z.string()).optional().default([])
    }))
  }),
  sessions: z.object({
    minimumVotes: z.number().int().min(1).default(5),
    allowScheduledSessions: z.boolean().default(true),
    startupPingRole: z.string().optional().default(''),
    votePingRole: z.string().optional().default(''),
    quickJoinUrl: z.string().optional().default(''),
    quickJoinLabel: z.string().optional().default('Quick Join'),
    messages: z.object({
      startup: z.string().min(1),
      shutdown: z.string().min(1),
      low: z.string().min(1),
      full: z.string().min(1)
    })
  }),
  erlc: z.object({
    apiBaseUrl: z.string().url(),
    serverKeyInEnv: z.boolean().default(true),
    logs: z.record(z.boolean()),
    commandSettings: z.object({
      allowCustomCommands: z.boolean().default(false),
      requireConfirmation: z.boolean().default(true),
      cooldownSeconds: z.number().int().min(1).default(5),
      blockedCommands: z.array(z.string()).default([])
    })
  })
});

let activeConfig = null;
let lastLoadedAt = null;

function getConfigPath() {
  return path.join(process.cwd(), 'config.json');
}

function readConfigFile() {
  const configPath = getConfigPath();

  if (!fs.existsSync(configPath)) {
    throw new Error('Missing config.json in the project root.');
  }

  const raw = fs.readFileSync(configPath, 'utf8');
  return JSON.parse(raw);
}

function validateConfig(config) {
  const parsed = ConfigSchema.safeParse(config);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    throw new Error(`Invalid config.json:\n${issues}`);
  }

  return parsed.data;
}

function buildWarnings(config) {
  const warnings = [];

  for (const [channelName, channelId] of Object.entries(config.channels)) {
    if (!channelId) warnings.push(`channels.${channelName} is empty`);
  }

  for (const [categoryName, categoryId] of Object.entries(config.categories)) {
    if (!categoryId) warnings.push(`categories.${categoryName} is empty`);
  }

  for (const [moduleName, enabled] of Object.entries(config.modules)) {
    if (!enabled) warnings.push(`Module disabled: ${moduleName}`);
  }

  return warnings;
}

function loadConfig() {
  const config = validateConfig(readConfigFile());
  const warnings = buildWarnings(config);

  activeConfig = config;
  lastLoadedAt = new Date();

  logger.success(`Loaded config.json for ${config.branding.serverName}`);
  if (warnings.length) logger.warn(`Config loaded with ${warnings.length} warning(s).`);

  return { config: activeConfig, warnings, loadedAt: lastLoadedAt };
}

function reloadConfig() {
  const previousConfig = activeConfig;
  const previousLoadedAt = lastLoadedAt;

  try {
    return loadConfig();
  } catch (error) {
    activeConfig = previousConfig;
    lastLoadedAt = previousLoadedAt;
    throw error;
  }
}

function getConfig() {
  if (!activeConfig) return loadConfig().config;
  return activeConfig;
}

function getLastLoadedAt() {
  return lastLoadedAt;
}

module.exports = {
  loadConfig,
  reloadConfig,
  getConfig,
  getLastLoadedAt,
  buildWarnings
};
