const { enableBump, disableBump, checkBumpStatus } = require('@handlers/bump');
const { getSettings } = require('@schemas/Guild');
const { OWNER_IDS } = require('@root/config');

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: 'autobump',
  description:
    'Enables, disables, or checks the status of sending the bump command every 2 hours with a 5 minute random variance',
  category: 'ADMIN',
  command: {
    enabled: true,
    aliases: ['bump'],
    usage: '<enable|disable|status>',
    minArgsCount: 1,
  },

  async messageRun(message, args) {
    const settings = await getSettings(message.guild);
    const isServerOwner = message.author.id === settings.data.owner;
    const isBotOwner = OWNER_IDS.includes(message.author.id);

    if (!isServerOwner && !isBotOwner) {
      return message.channel.send(
        'Only the server owner or a bot owner can use this command.',
      );
    }

    const action = args[0].toLowerCase();
    const channelId = message.channel.id;
    const guildId = message.guild.id;

    let response;
    if (action === 'enable') {
      response = await enableBump(message.client, guildId, channelId);
    } else if (action === 'disable') {
      response = await disableBump(message.client, guildId);
    } else if (action === 'status') {
      response = await checkBumpStatus(message.client, guildId);
    } else {
      response = "Invalid action. Please use 'enable', 'disable', or 'status'.";
    }

    await message.channel.send(response);
  },
};
