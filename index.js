require('dotenv').config();
require('module-alias/register');

const process = require('process');

const { initializeMongoose } = require('@src/database/mongoose');
const { BotClient } = require('@src/structures');
const { validateConfiguration } = require('@helpers/Validator');

validateConfiguration();

// initialize client
const client = new BotClient();
client.loadCommands('src/commands');
client.loadEvents('src/events');

// find unhandled promise rejections
process.on('unhandledRejection', (err) =>
  client.logger.error(`Unhandled exception`, err),
);

(async () => {
  // initialize the database
  await initializeMongoose();

  // start the client
  await client.login(process.env.USER_TOKEN);
})();
