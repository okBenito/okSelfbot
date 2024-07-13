module.exports = {
  name: 'ping',
  description: 'shows the current ping from the bot to the discord servers',
  category: 'INFORMATION',
  command: {
    enabled: true,
  },

  async messageRun(message) {
    await message.channel.send(
      `🏓 Pong : \`${Math.floor(message.client.ws.ping)}ms\``,
    );
  },
};
