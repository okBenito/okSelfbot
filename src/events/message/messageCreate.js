const { commandHandler } = require('@src/handlers');
const { PREFIX_COMMANDS, OWNER_IDS } = require('@root/config');
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

  // Only proceed if the user is the server owner or a bot owner
  if (!isBotOwner && !isServerOwner) return;

  // command handler
  let isCommand = false;
  if (PREFIX_COMMANDS.ENABLED) {
    // check for bot mentions
    if (message.content.includes(`${client.user.id}`)) {
      message.channel.send(`> My prefix is \`${settings.prefix}\``);
    }

    if (message.content && message.content.startsWith(settings.prefix)) {
      const escapedPrefix = escapeSpecialCharacters(settings.prefix);
      const invoke = message.content
        .slice(settings.prefix.length)
        .trim()
        .split(/\s+/)[0];
      const cmd = client.getCommand(invoke);
      if (cmd) {
        isCommand = true;
        commandHandler.handlePrefixCommand(message, cmd, settings);
      }
    }
  }
};

function escapeSpecialCharacters(prefix) {
  return prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
