const puppeteer = require("puppeteer");
const prompt = require("prompt-sync")({ sigint: true });
const fs = require("fs");

function getRandomLineFromFile(filename) {
  // Read the file into memory.
  const fileContents = fs.readFileSync(filename, "utf8");

  // Split the file contents into lines.
  const lines = fileContents.split("\n");

  // Generate a random number between 0 and the number of lines in the file.
  const randomIndex = Math.floor(Math.random() * lines.length);

  // Get the line at the random index.
  const randomLine = lines[randomIndex];

  // Delete the line from the file.
  lines.splice(randomIndex, 1);

  // Write the remaining lines back to the file.
  fs.writeFileSync(filename, lines.join("\n"), "utf8");

  return randomLine;
}

main(process.argv[2])
  .then(() => console.log("finished, exiting") && process.exit(0))
  .catch((err) => console.error(err) && process.exit(1));

async function createBrowser() {
  let browserWSEndpoint = prompt(
    "Enter your browser DevTool protocol WS endpoint (press enter to use 8222 port): "
  );

  if (!browserWSEndpoint) {
    browserWSEndpoint = "ws://localhost:8222/devtools/browser";
    // throw Error("You must enter a browser DevTool protocol WS endpoint");
  }

  console.log(
    "Using browser DevTool protocol WS endpoint: ",
    browserWSEndpoint
  );

  return puppeteer
    .connect({ browserWSEndpoint: browserWSEndpoint })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

async function main() {
  console.log("Creating browser...");
  const browser = await createBrowser();

  console.log("Prompting for number of searches...");
  let resultSearchIntValue = prompt(
    "Enter the number of how many searching should be done: "
  );

  if (!resultSearchIntValue) {
    resultSearchIntValue = 4;
  }

  console.log("Starting crawl...");
  await crawlBing(browser, resultSearchIntValue);
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function crawlBing(browser, randomSearchResultMax) {
  let clickedTaskElement = 1;
  console.log("Opening new page...");
  let page = await browser.newPage();

  console.log("Setting viewport...");
  await page.setViewport({ width: 1920, height: 1080 });
  await page.setBypassCSP(true);

  for (let i = 0; i < randomSearchResultMax; i++) {
    console.log("Getting random line from file...");
    const randomLine = getRandomLineFromFile("russian_requests_list.txt");

    console.log("Navigating to search page...");
    await page
      .goto(`https://www.bing.com/search?q=${randomLine}`, {
        waitUntil: "networkidle2",
        timeout: 10000,
      })
      .catch((_) => {});
    await page
      .waitForNavigation({ waitUntil: "networkidle2", timeout: 10000 })
      .catch((_) => {});
    console.log("Waiting...");
    await sleep(5000);
  }
  if (randomSearchResultMax == 0) {
    await page
      .goto("https://bing.com", { waitUntil: "networkidle2", timeout: 10000 })
      .catch((_) => {});
  }

  while (true) {
    console.log(`Current element ID: ${clickedTaskElement}`)
    await page
      .waitForNavigation({ waitUntil: "networkidle2", timeout: 10000 })
      .catch((_) => {});
    await sleep(5000);

    await page.setBypassCSP(true);

    let repeatCount = 0;
    while (repeatCount < 2) {
    try {
      console.log("Wait until id_rh button is loaded...")
      await page
        .waitForSelector('#id_rh', {visible: true})
      await page
        .waitForNavigation({ waitUntil: "networkidle2", timeout: 10000 })
        .catch((_) => {});
      await sleep(2000);

      let panelFlyout = await page.$('#panelFlyout');
      if (panelFlyout) {
        break;
      }

      console.log("Pressing #id_rh button");
      await page.evaluate(() => {
        document.getElementById("id_rh").click();
      });

      console.log("Wait until panelFlyout is loaded...")
      await page
        .waitForSelector('#panelFlyout', {visible: true})
      await page
        .waitForNavigation({ waitUntil: "networkidle2", timeout: 10000 })
        .catch((_) => {});
      await sleep(2000);
    } catch (error) {
        console.error("An error occurred:", error);
        repeatCount++;
        continue;
    } 

    break;
    
  }
    
    await page.evaluate((clickedTaskElement) => {
      const puzzleSkipBtn = document.getElementById("skipPuzzle");
      if (puzzleSkipBtn) {
        const puzzleSkipBtnValue = puzzleSkipBtn.getElementsByTagName("a")[0];
        puzzleSkipBtnValue.click();
        return;
      }
      let rewardIframe = document.getElementById("panelFlyout");
      if (rewardIframe === null) {
        console.log(
          "No reward panel iframe was found. Pressing id_rh again..."
        );
        document.getElementById("id_rh").click();
        new Promise((resolve) => setTimeout(resolve, 5000));
        rewardIframe = document.getElementById("panelFlyout");
      }
      console.log(rewardIframe);

      const rewardIframeDocument = rewardIframe.contentDocument
        ? rewardIframe.contentDocument
        : rewardIframe.contentWindow.document;

      const elements =
        rewardIframeDocument.getElementsByClassName("promo_cont");
      console.log(elements);

      if (clickedTaskElement == elements.length) {
        console.log("no more tasks");
        throw new Error("no more tasks");
      }

      const element = elements[clickedTaskElement].getElementsByTagName("a")[0];
      element.click();

      return elements;
    }, clickedTaskElement);

    clickedTaskElement++;
  }
}
