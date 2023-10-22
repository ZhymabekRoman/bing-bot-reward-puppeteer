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
  const browser = await createBrowser();

  let resultSearchIntValue = prompt(
    "Enter the number of how many searching should be done: "
  );

  if (!resultSearchIntValue) {
    resultSearchIntValue = 4;
  }

  await crawlBing(browser, resultSearchIntValue);
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function crawlBing(browser, randomSearchResultMax) {
  let page;
  let clickedTaskElement = 1;

  page = await browser.newPage();
  // await page.setViewport({ width: 0, height: 0 });
  await page.setViewport({ width: 1920, height: 1080 });

  for (let i = 0; i < randomSearchResultMax; i++) {
    const randomLine = getRandomLineFromFile("russian_requests_list.txt");

    await page
      .goto(`https://www.bing.com/search?q=${randomLine}`, {
        waitUntil: "networkidle2",
        timeout: 10000,
      })
      .catch((_) => {});
    await page
      .waitForNavigation({ waitUntil: "networkidle2", timeout: 10000 })
      .catch((_) => {});
    await sleep(5000);
  }
  if (randomSearchResultMax == 0) {
    await page
      .goto("https://bing.com", { waitUntil: "networkidle2", timeout: 10000 })
      .catch((_) => {});
  }

  // loop while true
  while (true) {
    await page
      .waitForNavigation({ waitUntil: "networkidle2", timeout: 10000 })
      .catch((_) => {});

    await sleep(5000);

    const rewardMenuBtn = await page.click("#id_rh").catch((_) => {});

    await sleep(5000);
    await page
      .waitForNavigation({ waitUntil: "networkidle2", timeout: 10000 })
      .catch((_) => {});

    // const elHandleArray = await page.$$('promo_cont')
    const elHandleArray = await page.evaluate((clickedTaskElement) => {
      const puzzleSkipBtn = document.getElementById("skipPuzzle");
      if (puzzleSkipBtn) {
        const puzzleSkipBtnValue = puzzleSkipBtn.getElementsByTagName("a")[0];
        puzzleSkipBtnValue.click();
        return;
      }

      const rewardIframe = document.getElementById("panelFlyout");

      const rewardIframeDocument = rewardIframe.contentDocument
        ? rewardIframe.contentDocument
        : rewardiframe.contentWindow.document;

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

    console.log(elHandleArray);

    clickedTaskElement++;
  }
}
