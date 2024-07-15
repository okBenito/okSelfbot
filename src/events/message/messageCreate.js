const { commandHandler } = require('@src/handlers');
const { PREFIX_COMMANDS, OWNER_IDS, WHITELIST_IDS } = require('@root/config');
const { getSettings } = require('@schemas/Guild');

/**
 * @param {import('@src/structures').BotClient} client
 * @param {import('discord.js').Message} message
 */
module.exports = async (client, message) => {
  if (!message.guild || message.author.bot) return;

  const settings = await getSettings(message.guild);
  const isBotOwner = OWNER_IDS.includes(message.author.id);
  const isServerOwner = message.author.id === settings.data.owner;
  const isWhitelisted = WHITELIST_IDS.includes(message.author.id);

  // Only proceed if the user is the server owner, a bot owner, or whitelisted
  if (!isBotOwner && !isServerOwner && !isWhitelisted) return;

  // command handler
  if (PREFIX_COMMANDS.ENABLED) {
    // check for bot mentions
    if (message.content.includes(`${client.user.id}`)) {
      message.channel.send(`> My prefix is \`${settings.prefix}\``);
    }

    if (message.content && message.content.startsWith(settings.prefix)) {
      const invoke = message.content
        .slice(settings.prefix.length)
        .trim()
        .split(/\s+/)[0];
      const cmd = client.getCommand(invoke);
      if (cmd) {
        commandHandler.handlePrefixCommand(message, cmd, settings);
      }
    }
  }
};
