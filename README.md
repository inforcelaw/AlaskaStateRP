# Alaska State RP Bot

Custom Discord roleplay management bot for **Alaska State Roleplay**.

`v0.1-base` is the foundation build. It sets up the bot properly before we add moderation, tickets, sessions, ER:LC API tools, staff management, LOA, infractions, and applications.

## Features in v0.1-base

- Discord.js v14 bot client
- Slash command loader
- Slash command deploy script
- Event loader
- `config.json` driven settings
- Safe config reload with `/reloadconfig`
- MongoDB Atlas support through Mongoose
- Blue and white Alaska branding
- Admin health check command
- Bot info command
- Ping command
- Audit log model

## Commands

```txt
/reloadconfig
/health
/botinfo
/ping
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create your `.env` file

Copy `.env.example` to `.env` and fill it out.

```env
DISCORD_TOKEN=your_discord_bot_token
CLIENT_ID=your_discord_application_client_id
GUILD_ID=your_discord_server_id
MONGODB_URI=your_mongodb_atlas_connection_string
ERLC_API_KEY=your_erlc_api_key
```

### 3. Edit `config.json`

Fill in your role IDs, channel IDs, category IDs, branding, and module settings.

### 4. Deploy slash commands

```bash
npm run deploy
```

### 5. Start the bot

```bash
npm start
```

## Project structure

```txt
src/
├─ commands/
│  ├─ admin/
│  └─ utility/
├─ config/
├─ database/
│  └─ models/
├─ events/
└─ utils/
```

## Next version

`v0.2-moderation` should add moderation cases, modlogs, punishment commands, and user DM notices.
