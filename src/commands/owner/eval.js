const { inspect } = require('util');

// This dummy token will be replaced by the actual token
const DUMMY_TOKEN = 'MY_TOKEN_IS_SECRET';

module.exports = {
  name: 'eval',
  description: 'evaluates something',
  category: 'OWNER',
  command: {
    enabled: true,
    usage: '<script>',
    minArgsCount: 1,
  },

  async messageRun(message, args) {
    const input = args.join(' ');

    if (!input) return message.channel.send('Please provide code to eval');

    let response;
    try {
      const output = eval(input);
      response = buildSuccessResponse(output, message.client);
    } catch (ex) {
      response = buildErrorResponse(ex);
    }
    await message.channel.send(response);
  },
};

const buildSuccessResponse = (output, client) => {
  // Token protection
  output = inspect(output, { depth: 0 }).replaceAll(client.token, DUMMY_TOKEN);

  const response =
    '📤 **Output**\n```js\n' +
    (output.length > 4096 ? `${output.substr(0, 4000)}...` : output) +
    '\n```';
  return response;
};

const buildErrorResponse = (err) => {
  const response =
    '📤 **Error**\n```js\n' +
    (err.length > 4096 ? `${err.toString().substr(0, 4000)}...` : err) +
    '\n```';
  return response;
};
