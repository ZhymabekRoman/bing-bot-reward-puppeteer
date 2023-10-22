## Bing reward collector bot in Puppeteer

### Capabilities:
- Make search results
- Collect rewards

### Usage:
0. Install all NodeJS dependencies
1. Open a browser with a enabled remote devtool protocol:
```
chromium --remote-debugging-port=9222  --remote-allow-origins="*"
```
2. Open in a browser `http://localhost:9222/json/version` page and find `webSocketDebuggerUrl` property value
3. Execute `crawl.js` script with `node crawl.js` and paste `webSocketDebuggerUrl` value into the script
4. Done!

To use this bot with Chromium based browser in Android please execute `adb -s forward tcp:9222 localabstract:chrome_devtools_remote` instead of first step. That command will forward Chromium devtool protocol connection from your Android device to PC.

To use Puppeteer in Android inside Termux, execute `export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1` command before installing

Bot tested in:
- Chromium, Arch Linux
- Kiwi, Android
