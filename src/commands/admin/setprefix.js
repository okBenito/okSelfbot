const { getSettings } = require('@schemas/Guild');
const { OWNER_IDS } = require('@root/config');

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: 'setprefix',
  description: 'sets a new prefix for this server',
  category: 'ADMIN',
  userPermissions: ['ManageGuild'],
  command: {
    enabled: true,
    usage: '<new-prefix>',
    minArgsCount: 1,
  },

  async messageRun(message, args, data) {
    const guildSettings = await getSettings(message.guild);
    const serverOwner = guildSettings.data.owner;

    if (
      message.author.id !== serverOwner &&
      !OWNER_IDS.includes(message.author.id)
    ) {
      return message.channel.send(
        'You do not have permission to use this command. Only the server owner or bot owner can set a new prefix.',
      );
    }

    const newPrefix = args[0];
    const response = await setNewPrefix(newPrefix, guildSettings);
    await message.channel.send(response);
  },
};

async function setNewPrefix(newPrefix, settings) {
  if (newPrefix.length > 2) return 'Prefix length cannot exceed `2` characters';

  // Save the new prefix directly
  settings.prefix = newPrefix;

  try {
    await settings.save();
  } catch (error) {
    message.client.logger.error('Error saving new prefix:', error);
    return 'There was an error setting the new prefix.';
  }

  return `New prefix is set to \`${newPrefix}\``;
}
