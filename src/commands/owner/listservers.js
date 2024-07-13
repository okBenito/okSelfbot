/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: 'listservers',
  description: 'lists all/matching servers',
  category: 'OWNER',
  command: {
    enabled: true,
    aliases: ['listserver', 'findserver', 'findservers'],
    usage: '[match]',
  },

  async messageRun(message, args) {
    const { client, channel } = message;

    const matched = [];
    const match = args.join(' ') || null;
    if (match) {
      // match by id
      if (client.guilds.cache.has(match)) {
        matched.push(client.guilds.cache.get(match));
      }

      // match by name
      client.guilds.cache
        .filter((g) => g.name.toLowerCase().includes(match.toLowerCase()))
        .forEach((g) => matched.push(g));
    }

    const servers = match ? matched : Array.from(client.guilds.cache.values());
    const total = servers.length;

    if (total === 0) return message.channel.send('No servers found');

    let content = `**${match ? 'Matched' : 'Total'} Servers: ${total}**\n`;
    for (const server of servers) {
      content += `\`${server.name}\` - \`${server.id}\`\n`;
    }

    if (content.length > 2000) {
      // Split the message into chunks if it exceeds Discord's message length limit
      const chunks = splitMessage(content, { maxLength: 2000 });
      for (const chunk of chunks) {
        await message.channel.send(chunk);
      }
    } else {
      await message.channel.send(content);
    }
  },
};

function splitMessage(text, { maxLength = 2000 }) {
  const regex = new RegExp(`.{1,${maxLength}}`, 'g');
  return text.match(regex) || [];
}
