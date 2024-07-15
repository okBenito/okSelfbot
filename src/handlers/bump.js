const cron = require('node-cron');
const { Model: Guild } = require('@schemas/Guild');

let bumpTasks = {};

async function sendBumpCommand(client, guildId, channelId) {
  try {
    const APPLICATION_ID = '302050872383242240';
    const COMMAND_NAME = 'bump';

    const channel = client.channels.cache.get(channelId);
    if (!channel) {
      throw new Error('No channel');
    }

    const initialMessage = await channel.sendSlash(
      APPLICATION_ID,
      COMMAND_NAME,
    );
    client.logger.success(`Sent bump command for guild ${guildId}`);

    const response = await handleEphemeralResponse(initialMessage);

    if (response) {
      const description = response.embeds[0]?.description || '';

      if (description.includes('Please wait another')) {
        const minutes = parseInt(description.match(/(\d+) minutes/)[1]);
        const lastExecution = new Date(
          Date.now() - (120 - minutes) * 60 * 1000,
        );
        const randomDelay = Math.floor(Math.random() * 5 * 60 * 1000);
        const nextExecution = new Date(
          lastExecution.getTime() + 2 * 60 * 60 * 1000 + randomDelay,
        );

        await Guild.findByIdAndUpdate(guildId, {
          'bump.lastExecution': lastExecution,
          'bump.nextExecution': nextExecution,
        });

        client.logger.success(`Next execution scheduled for: ${nextExecution}`);
        channel.send(
          `⏱️ Next bump scheduled for: **${nextExecution.toLocaleString()}**`,
        );
        return;
      }

      if (description.includes('Bump done!')) {
        client.logger.success(
          `Successfully sent bump command for guild ${guildId}`,
        );

        const lastExecution = new Date();
        const randomDelay = Math.floor(Math.random() * 5 * 60 * 1000);
        const nextExecution = new Date(
          lastExecution.getTime() + 2 * 60 * 60 * 1000 + randomDelay,
        );

        await Guild.findByIdAndUpdate(guildId, {
          'bump.lastExecution': lastExecution,
          'bump.nextExecution': nextExecution,
        });

        client.logger.success(`Next execution scheduled for: ${nextExecution}`);
        channel.send(
          `✅ Bump successful! Next bump scheduled for: **${nextExecution.toLocaleString()}**`,
        );
        return;
      }

      throw new Error('Unexpected response from the bump command');
    } else {
      throw new Error('No response received');
    }
  } catch (error) {
    client.logger.error(
      `Error handling bump response for guild ${guildId}:`,
      JSON.stringify(error, Object.getOwnPropertyNames(error)),
    );
    const channel = client.channels.cache.get(channelId);
    if (channel) {
      channel.send(
        '❌ Failed to send bump command. Please check bot permissions.',
      );
    }
  }
}

async function handleEphemeralResponse(initialMessage) {
  try {
    if (initialMessage.flags.has('LOADING')) {
      return await waitForMessageUpdate(initialMessage, 20000);
    }
    return initialMessage;
  } catch (error) {
    throw new Error('Error handling ephemeral response:', error);
  }
}

function waitForMessageUpdate(initialMessage, timeout) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject('timeout'), timeout); // 20 seconds

    initialMessage.client.on('messageUpdate', (_, updatedMessage) => {
      if (_.id === initialMessage.id) {
        clearTimeout(timer);
        resolve(updatedMessage);
      }
    });
  });
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
  const guildData = await Guild.findById(guildId);
  if (guildData.bump.scheduled) {
    return 'ℹ️ The bump command is already enabled.';
  }

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

  return '✅ The bump command has been scheduled to run every 2 hours with a random variance of up to 5 minutes.';
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
    return '🛑 The bump command has been unscheduled.';
  } else {
    return 'ℹ️ The bump command is not currently scheduled.';
  }
}

async function checkBumpStatus(client, guildId) {
  const guildData = await Guild.findById(guildId);
  if (!guildData.bump.scheduled) {
    return 'ℹ️ The bump command is not currently scheduled.';
  }

  const lastRun = new Date(guildData.bump.lastExecution).toLocaleString();
  const nextRun = new Date(guildData.bump.nextExecution).toLocaleString();
  return `📅 The bump command is currently scheduled.\n**Last execution:** ${lastRun}\n**Next execution:** ${nextRun}`;
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
