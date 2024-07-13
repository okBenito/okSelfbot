const { SUPPORT_SERVER } = require('@root/config.js');
module.exports = {
  name: 'about',
  description: 'provides information about the project',
  category: 'INFORMATION',
  command: {
    enabled: true,
  },

  async messageRun(message) {
    const aboutMessage = `
**About This Project:**
This project is a Discord selfbot created to automate tasks and enhance the user experience within Discord. 

**Disclaimer:**
Using a selfbot is against Discord's Terms of Service. This can result in your account being suspended or permanently banned. Use at your own risk.

**Support:**
For support and more information, visit our Support Server at \`${SUPPORT_SERVER}\`.

**Note:**
Please keep your token and personal information secure and never share them publicly.
      `;

    await message.channel.send(aboutMessage);
  },
};
