const { CommandCategory } = require('@src/structures');
const { timeformat } = require('@helpers/Utils');

const CMDS_PER_PAGE = 5;
const IDLE_TIMEOUT = 30;
const HOME_EMOJI = '🏠';

module.exports = {
  name: 'help',
  description: 'Command help menu',
  category: 'UTILITY',
  command: {
    enabled: true,
    usage: '[command]',
  },

  async messageRun(message, args, data) {
    const trigger = args[0];

    if (!trigger) {
      const response = getHelpMenu(message.client);
      const sentMsg = await message.channel.send(response.content);
      await addReactions(sentMsg, response.reactions);
      return startNavigation(
        sentMsg,
        message.author.id,
        data.prefix,
        message.client,
        response.categories,
      );
    }

    const cmd = message.client.getCommand(trigger);
    if (cmd) {
      const usageMessage = getCommandUsage(cmd, data.prefix, trigger);
      return message.channel.send(usageMessage);
    }

    await message.channel.send('No matching command found');
  },
};

function getHelpMenu(client) {
  let menuMessage =
    `\n**Instructions:**\n` +
    `- React with the corresponding emoji to view commands in that category.\n` +
    `- Unreact then react with the same emoji to return to that page.\n` +
    `- React with ${HOME_EMOJI} to return to this help menu.\n` +
    `- This session will end after ${IDLE_TIMEOUT} seconds of inactivity.\n\n`;

  menuMessage += `**Help Menu:**\nChoose the command category by reacting with the corresponding emoji:\n\n`;

  for (const [key, value] of Object.entries(CommandCategory)) {
    // eslint-disable-line no-unused-vars
    menuMessage += `${value.emoji} ${value.name}\n`;
  }

  menuMessage +=
    `\n\n**About Me:**\n` +
    `Hello, I am ${client.user.username}, a Discord self-bot! \n\n`;

  return {
    content: menuMessage,
    reactions: [
      ...Object.values(CommandCategory).map((v) => v.emoji),
      HOME_EMOJI,
    ],
  };
}

async function addReactions(message, reactions) {
  for (const reaction of reactions) {
    await message.react(reaction);
  }
}

async function startNavigation(msg, userId, prefix, client) {
  const reactions = Object.values(CommandCategory).map((v) => v.emoji);
  reactions.push(HOME_EMOJI);

  const filter = (reaction, user) =>
    reactions.includes(reaction.emoji.name) && user.id === userId;
  const collector = msg.createReactionCollector({
    filter,
    idle: IDLE_TIMEOUT * 1000,
  });

  let currentCategory = null;
  let arrMessages = [];

  collector.on('collect', async (reaction, user) => {
    const selectedEmoji = reaction.emoji.name;

    if (selectedEmoji === HOME_EMOJI) {
      const response = getHelpMenu(client);
      await msg.edit(response.content);
      currentCategory = null;
      arrMessages = [];
    } else {
      currentCategory = Object.keys(CommandCategory).find(
        (key) => CommandCategory[key].emoji === selectedEmoji,
      );
      if (currentCategory) {
        arrMessages = prefix
          ? getMsgCategoryMessages(client, currentCategory, prefix)
          : getSlashCategoryMessages(client, currentCategory);
        await msg.edit(arrMessages.join('\n'));
      }
    }

    await msg
      .react(selectedEmoji)
      .catch((error) =>
        message.client.logger.error('Failed to react with emoji:', error),
      );
  });

  collector.on('remove', async (reaction, user) => {
    if (user.id !== userId) return;

    const selectedEmoji = reaction.emoji.name;
    if (
      currentCategory &&
      selectedEmoji !== HOME_EMOJI &&
      selectedEmoji === CommandCategory[currentCategory].emoji
    ) {
      const previousCategory = currentCategory;
      const response = getHelpMenu(client);
      await msg.edit(response.content);
      await msg
        .react(CommandCategory[previousCategory].emoji)
        .catch((error) =>
          message.client.logger.error('Failed to react with emoji:', error),
        );
      currentCategory = previousCategory;
      arrMessages = prefix
        ? getMsgCategoryMessages(client, currentCategory, prefix)
        : getSlashCategoryMessages(client, currentCategory);
      await msg.edit(arrMessages.join('\n'));
    }
  });

  collector.on('end', async () => {
    if (msg.guild && msg.channel) {
      await msg.edit(
        'The help session has ended. If you need further assistance, please re-run the help command.',
      );
      await clearReactions(msg, reactions);
    }
  });
}

async function clearReactions(message, reactions) {
  for (const reaction of reactions) {
    const userReactions = message.reactions.cache.get(reaction);
    if (userReactions) {
      for (const user of userReactions.users.cache.values()) {
        if (user.id === message.client.user.id) {
          await userReactions.users
            .remove(user.id)
            .catch((error) =>
              message.client.logger.error('Failed to remove reaction:', error),
            );
        }
      }
    }
  }
}

function getCommandUsage(cmd, prefix, invoke) {
  let desc = `**Usage:** \`${prefix}${invoke || cmd.name} ${cmd.command.usage}\`\n`;
  if (cmd.description) desc += `**Description:** ${cmd.description}\n`;
  if (cmd.cooldown) desc += `**Cooldown:** ${timeformat(cmd.cooldown)}`;

  return desc;
}

function getMsgCategoryMessages(client, category, prefix) {
  const commands = client.commands.filter((cmd) => cmd.category === category);
  if (!commands.length) return ['No commands in this category'];

  return commands
    .splice(0, CMDS_PER_PAGE)
    .map((cmd) => `\`${prefix}${cmd.name}\`\n ❯ ${cmd.description}\n`);
}

function getSlashCategoryMessages(client, category) {
  const commands = Array.from(client.slashCommands.values()).filter(
    (cmd) => cmd.category === category,
  );
  if (!commands.length) return ['No commands in this category'];

  return commands
    .splice(0, CMDS_PER_PAGE)
    .map((cmd) => `\`/${cmd.name}\`\n ❯ ${cmd.description}\n`);
}
