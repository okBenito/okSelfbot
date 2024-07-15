const { OWNER_IDS, PREFIX_COMMANDS } = require('@root/config');
const { timeformat } = require('@helpers/Utils');

const cooldownCache = new Map();

module.exports = {
  handlePrefixCommand: async function (message, cmd, settings) {
    const prefix = settings.prefix;
    const args = message.content.slice(prefix.length).trim().split(/\s+/);
    const invoke = args.shift().toLowerCase();

    const data = {};
    data.settings = settings;
    data.prefix = prefix;
    data.invoke = invoke;

    // Check for basic send messages permission
    if (
      !message.channel
        .permissionsFor(message.guild.members.me)
        .has('SEND_MESSAGES')
    ) {
      return;
    }

    // Callback validations
    if (cmd.validations) {
      for (const validation of cmd.validations) {
        if (!validation.callback(message)) {
          return message.channel.send(validation.message);
        }
      }
    }

    // Owner commands
    if (cmd.category === 'OWNER' && !OWNER_IDS.includes(message.author.id)) {
      return message.channel.send(
        'This command is only accessible to bot owners',
      );
    }

    // User permissions check (simple version)
    if (cmd.userPermissions && cmd.userPermissions.length > 0) {
      if (
        !message.channel.permissionsFor(message.member).has(cmd.userPermissions)
      ) {
        return message.channel.send(
          `You lack the necessary permissions for this command`,
        );
      }
    }

    // Bot permissions check (simple version)
    if (cmd.botPermissions && cmd.botPermissions.length > 0) {
      if (
        !message.channel
          .permissionsFor(message.guild.members.me)
          .has(cmd.botPermissions)
      ) {
        return message.channel.send(
          `I lack the necessary permissions for this command`,
        );
      }
    }

    // Min args count
    if (cmd.command.minArgsCount > args.length) {
      const usageMessage = this.getCommandUsage(cmd, prefix, invoke);
      return message.channel.send(usageMessage);
    }

    // Cooldown check
    if (cmd.cooldown > 0) {
      const remaining = getRemainingCooldown(message.author.id, cmd);
      if (remaining > 0) {
        return message.channel.send(
          `You are on cooldown. You can use the command again in \`${timeformat(
            remaining,
          )}\``,
        );
      }
    }

    try {
      await cmd.messageRun(message, args, data);
    } catch (ex) {
      message.client.logger.error('messageRun', ex);
      message.channel.send('An error occurred while running this command');
    } finally {
      if (cmd.cooldown > 0) applyCooldown(message.author.id, cmd);
    }
  },

  getCommandUsage(
    cmd,
    prefix = PREFIX_COMMANDS.DEFAULT_PREFIX,
    invoke,
    title = 'Usage',
  ) {
    let desc = `${title}:\n`;
    if (cmd.command.subcommands && cmd.command.subcommands.length > 0) {
      cmd.command.subcommands.forEach((sub) => {
        desc += `\`${prefix}${invoke || cmd.name} ${sub.trigger}\` - ${
          sub.description
        }\n`;
      });
      if (cmd.command.cooldown) {
        desc += `**Cooldown:** ${timeformat(cmd.command.cooldown)}`;
      }
    } else {
      desc += `\`${prefix}${invoke || cmd.name} ${cmd.command.usage}\`\n`;
      if (cmd.description !== '') desc += `\n**Help:** ${cmd.description}`;
      if (cmd.command.cooldown)
        desc += `\n**Cooldown:** ${timeformat(cmd.command.cooldown)}`;
    }

    return desc;
  },
};

function applyCooldown(memberId, cmd) {
  const key = `${cmd.name}|${memberId}`;
  const cooldownExpiration = Date.now() + cmd.cooldown * 1000;
  cooldownCache.set(key, cooldownExpiration);
}

function getRemainingCooldown(memberId, cmd) {
  const key = `${cmd.name}|${memberId}`;
  const cooldownExpiration = cooldownCache.get(key);
  if (!cooldownExpiration) return 0;

  const remainingTime = cooldownExpiration - Date.now();
  return remainingTime > 0 ? remainingTime / 1000 : 0;
}
