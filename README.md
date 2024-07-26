# okSelfbot

okSelfbot is a Discord self-bot. This project allows users to automate certain tasks within Discord. Please note that using self-bots is against Discord's Terms of Service (TOS) and can result in account termination. Use this bot at your own risk.

## Getting Started

Fill out the .env file
```env
# User Token [Required]
USER_TOKEN=

# MongoDB Connection String [Required]
MONGO_CONNECTION=

# Webhooks [Optional]
ERROR_LOGS=
```

## Get Token ?

<strong>Run code (Discord Console - [Ctrl + Shift + I])</strong>

```js
window.webpackChunkdiscord_app.push([
  [Math.random()],
  {},
  req => {
    if (!req.c) return;
    for (const m of Object.keys(req.c)
      .map(x => req.c[x].exports)
      .filter(x => x)) {
      if (m.default && m.default.getToken !== undefined) {
        return copy(m.default.getToken());
      }
      if (m.getToken !== undefined) {
        return copy(m.getToken());
      }
    }
  },
]);
console.log('%cWorked!', 'font-size: 50px');
console.log(`%cYou now have your token in the clipboard!`, 'font-size: 16px');
```
