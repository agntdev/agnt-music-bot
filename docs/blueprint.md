# MusicBot with Admin Panel — Bot specification

**Archetype:** custom

**Voice:** friendly and helpful — write every user-facing message, button label, error, and empty state in this voice.

A Telegram bot that plays music in group chats and provides group administration features like security event detection, welcome messages, and a password-protected admin panel. Users can control playback with commands, and admins receive alerts in a dedicated group chat.

> This is the complete contract for the bot. Implement EVERY entry point, flow, feature, integration, and edge case below. The completeness review checks the bot against this document after each build pass.

## Primary audience

- Telegram group owners
- admins
- users who want music playback in chats

## Success criteria

- Users can play music in group chats with /play command
- Admins receive security alerts in dedicated group chat
- Admin panel is accessible with password and approved account

## Entry points

Every feature must be reachable from the bot's command/button surface (button-first; only /start and /help are slash commands).

- **/start** (command, actor: user, command: /start) — Open the main menu
- **/play** (command, actor: user, command: /play) — Start music playback in the current chat
- **/pause** (command, actor: user, command: /pause) — Pause music playback
- **/resume** (command, actor: user, command: /resume) — Resume paused music playback
- **/skip** (command, actor: user, command: /skip) — Skip to the next track in the queue
- **/queue** (command, actor: user, command: /queue) — View the current music queue
- **/nowplaying** (command, actor: user, command: /nowplaying) — See what track is currently playing
- **/leave** (command, actor: user, command: /leave) — Make the bot leave the voice chat
- **/adminpanel** (command, actor: admin, command: /adminpanel) — Access the admin panel (requires password and approved account)

## Flows

### Music Playback
_Trigger:_ /play

1. User sends /play command with link or search terms
2. Bot auto-joins voice chat
3. Bot starts playing requested track

_Data touched:_ Playback session

### Admin Panel Access
_Trigger:_ /adminpanel

1. Admin sends /adminpanel command
2. Bot prompts for password
3. Admin enters password @bhaskarsinha10112010
4. Bot verifies admin account is approved
5. Admin gains access to panel

_Data touched:_ Admins

### Security Alert
_Trigger:_ Security event detected

1. Bot detects suspicious activity (ban, join/leave anomaly)
2. Bot generates alert message
3. Bot sends alert to admin group chat

_Data touched:_ Admin alerts

## Data entities

Durable data (must survive a restart) uses the toolkit's persistent store, never in-memory maps.

- **User** _(retention: persistent)_ — Telegram account with basic information
  - fields: Telegram ID, Username
- **Group / Chat** _(retention: persistent)_ — Telegram group or private chat where the bot is active
  - fields: Chat ID, Title
- **Playback session** _(retention: persistent)_ — Music playback state for a specific chat
  - fields: Current track, Queue, Source, Chat ID
- **Admins** _(retention: persistent)_ — Approved Telegram accounts with admin privileges
  - fields: Telegram ID, Username, Approved status
- **Admin panel** _(retention: persistent)_ — Password-protected admin interface
  - fields: Password, Access permissions
- **Admin alerts** _(retention: persistent)_ — Security event notifications for admins
  - fields: Event type, Timestamp, Chat ID, Details

## Integrations

- **Telegram** (required) — Bot API messaging and voice chat functionality
- **YouTube** (required) — Music playback from YouTube links and search
- **Spotify** (required) — Metadata extraction from Spotify links
Call external APIs against their real contract (correct endpoints, ids, params); credentials from env. Do not fake responses.

## Owner controls

- Set default owner account
- Configure welcome messages
- Adjust security sensitivity settings
- Approve admin accounts
- Change admin password

## Notifications

- Security event alerts in admin group chat
- Welcome messages for new users
- Playback status updates in chat

## Permissions & privacy

- Only admins can access the admin panel
- User data is stored securely
- Admin alerts are sent only to approved group chat

## Edge cases

- Multiple users trying to play music in the same chat simultaneously
- Admin panel access attempts with wrong password
- Security events during bot maintenance or downtime

## Required tests

- Verify music playback works in group chats
- Test admin panel access with correct password and approved account
- Validate security alerts are sent to admin group chat

## Assumptions

- Owner will set up the default owner account
- Admin password will be kept secure
- Admins will be properly approved
