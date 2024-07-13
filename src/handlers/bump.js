const cron = require('node-cron');
const { Model: Guild } = require('@schemas/Guild');

let bumpTasks = {};

async function sendBumpCommand(client, guildId, channelId) {
  try {
    const APPLICATION_ID = '1211197831927308288';
    const COMMAND_NAME = 'ping';

    const channel = client.channels.cache.get(channelId);
    if (!channel) {
      throw new Error('No channel');
    }

    await channel.sendSlash(APPLICATION_ID, COMMAND_NAME);
    // client.logger.success(`Successfully sent /bump command for guild ${guildId}`);

    const randomDelay = Math.floor(Math.random() * 5 * 60 * 1000); // Random delay within 5 minutes
    const nextExecution = new Date(Date.now() + 2 * 60 * 60 * 1000 + randomDelay); // Next execution in 2 hours + random delay

    await Guild.findByIdAndUpdate(guildId, {
      'bump.lastExecution': new Date(),
      'bump.nextExecution': nextExecution,
    });

    // client.logger.info(`Next execution scheduled for: ${nextExecution}`);
  } catch (error) {
    client.logger.error(`Error sending /bump command for guild ${guildId}:`, error);

    const channel = client.channels.cache.get(channelId);
    if (channel) {
      channel.send('Failed to send /bump command. Please check bot permissions.');
    }
  }
}

async function scheduleBump(client, guildId, channelId) {
  if (bumpTasks[guildId]) {
    bumpTasks[guildId].stop();
    delete bumpTasks[guildId];
  }

  const task = cron.schedule('* * * * *', async () => {
    const guildData = await Guild.findById(guildId);
    const now = new Date();
    const nextExecution = new Date(guildData.bump.nextExecution);

    if (now >= nextExecution) {
      await sendBumpCommand(client, guildId, channelId);
    }
  });

  bumpTasks[guildId] = task;
}

async function enableBump(client, guildId, channelId) {
  const randomDelay = Math.floor(Math.random() * 5 * 60 * 1000);
  const nextExecution = new Date(Date.now() + 2 * 60 * 60 * 1000 + randomDelay);

  await Guild.findByIdAndUpdate(guildId, {
    'bump.scheduled': true,
    'bump.channelId': channelId,
    'bump.lastExecution': new Date(),
    'bump.nextExecution': nextExecution,
  });

  await scheduleBump(client, guildId, channelId);

  client.logger.success(`Enabled autobump for guild ${guildId}`);

  // Send the bump command immediately
  await sendBumpCommand(client, guildId, channelId);

  return 'The /bump command has been scheduled every 2 hours with up to 5 minutes variance.';
}

async function disableBump(client, guildId) {
  const task = bumpTasks[guildId];
  if (task) {
    task.stop();
    delete bumpTasks[guildId];

    await Guild.findByIdAndUpdate(guildId, {
      'bump.scheduled': false,
      'bump.channelId': null,
      'bump.lastExecution': null,
      'bump.nextExecution': null,
    });

    client.logger.success(`Disabled autobump for guild ${guildId}`);
    return 'The /bump command has been unscheduled.';
  } else {
    return 'The /bump command is not currently scheduled.';
  }
}

async function checkBumpStatus(client, guildId) {
  const guildData = await Guild.findById(guildId);
  if (!guildData.bump.scheduled) {
    return 'The /bump command is not currently scheduled.';
  }

  const lastRun = new Date(guildData.bump.lastExecution).toLocaleString();
  const nextRun = new Date(guildData.bump.nextExecution).toLocaleString();
  return `The /bump command is currently scheduled. Last execution: ${lastRun}, Next execution (including random delay): ${nextRun}`;
}

async function initializeBumpTasks(client) {
  const guilds = await Guild.find({ 'bump.scheduled': true });
  for (const guild of guilds) {
    const { _id: guildId, bump } = guild;
    const { channelId } = bump;

    await scheduleBump(client, guildId, channelId);

    client.logger.success(`Initialized autobump for guild ${guildId}`);
  }
}

module.exports = {
  enableBump,
  disableBump,
  checkBumpStatus,
  initializeBumpTasks,
};
