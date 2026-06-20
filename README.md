# Alaska State RP Bot

Custom Discord roleplay management bot for **Alaska State Roleplay**.

This build now includes the first major command pass after `v0.1-base`: moderation, tickets, sessions, ER:LC utilities, staff shifts, LOA, infractions, requests, suggestions, and giveaways.

## Current features

- Discord.js v14 bot client
- Slash command loader
- Slash command deploy script
- Event loader
- `config.json` driven settings
- Safe config reload with `/admin reloadconfig`
- MongoDB Atlas support through Mongoose
- Blue and white Alaska branding
- Components v2 container-style UI with embed fallback
- Admin health/bot info commands
- Moderation cases and modlogs
- Ticket panel, ticket channels, ticket controls, transcripts
- Session start/vote/shutdown/low/full/stats
- Staff shift tracking
- LOA requests and review buttons
- Staff infractions
- ER:LC API command group
- Staff request command group
- Suggestions with voting
- Giveaways with enter button

## Commands

```txt
/admin reloadconfig
/admin health
/admin botinfo
/ping

/mod warn
/mod timeout
/mod kick
/mod ban
/mod unban
/mod logs
/mod case

/ticket panel
/ticket claim
/ticket close
/ticket add
/ticket remove

/session start
/session vote
/session shutdown
/session low
/session full
/session stats

/erlc statistics
/erlc players
/erlc vehicles
/erlc joinlogs
/erlc killlogs
/erlc command

/shift start
/shift break
/shift resume
/shift end
/shift leaderboard

/loa request
/loa active

/infraction issue
/infraction list
/infraction remove

/request staff
/request moderator
/request administrator
/request custom

/suggest
/giveaway create
/giveaway end
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

## Updating after new code

```bash
git pull
npm install
npm run deploy
npm start
```

## Project structure

```txt
src/
├─ commands/
│  ├─ admin/
│  ├─ erlc/
│  ├─ moderation/
│  ├─ sessions/
│  ├─ staff/
│  ├─ tickets/
│  └─ utility/
├─ components/
│  ├─ buttons/
│  ├─ menus/
│  └─ modals/
├─ config/
├─ database/
│  └─ models/
├─ events/
├─ modules/
└─ utils/
```

## Next version

Next pass should focus on polish: application forms, better transcripts, scheduled giveaways/sessions, ER:LC log auto-posting, and stricter permission checks per command.
