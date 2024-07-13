const { initializeBumpTasks } = require('@handlers/bump');

/**
 * @param {import('@src/structures').BotClient} client
 */
module.exports = async (client) => {
  client.logger.success(`Logged in as ${client.user.tag}! (${client.user.id})`);

  // Initialize bump tasks
  try {
    await initializeBumpTasks(client);
  } catch (error) {
    client.logger.error('Failed to initialize bump tasks:', error);
  }
};
