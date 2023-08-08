import "dotenv/config";
import fs from "fs";

export class Reserve {
  constructor(browser) {
    this.browser = browser;
    this.page;

    try {
      const data = fs.readFileSync("config.json", "utf-8");
      try {
        const jsonObj = JSON.parse(data);
        this.date = jsonObj.DATE;
        this.hour = jsonObj.HOUR;
        this.preferedCourt = jsonObj.PREFEREDCOURT - 1;
        this.time = jsonObj.TIME - 1;
      } catch (parseError) {
        console.error(parseError);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async scrollUntilVisible() {
    const childSelector = `[class*="bkc-pistas-disponibles"]`;
    const containerSelector = `[id="div-hores-disponibles-8"]`;

    await Promise.all([
      this.page.waitForSelector(containerSelector),
      this.page.waitForSelector(childSelector),
    ]);

    const { firstChildBoundingBox, lastChildBoundingBox } =
      await this.page.evaluate(
        (containerSelector, childSelector) => {
          const container = document.querySelector(containerSelector);
          const children = container.querySelectorAll(childSelector);

          let firstChildBoundingBox = null;
          let lastChildBoundingBox = null;

          for (let i = 0; i < children.length; i++) {
            const child = children[i];
            const rect = child.getBoundingClientRect();

            if (
              rect.top >= 0 &&
              rect.left >= 0 &&
              rect.bottom <= window.innerHeight &&
              rect.right <= window.innerWidth
            ) {
              if (!firstChildBoundingBox) {
                firstChildBoundingBox = {
                  x: rect.x,
                  width: rect.width,
                  y: rect.y,
                  height: rect.height,
                };
              }
              lastChildBoundingBox = {
                x: rect.x,
                width: rect.width,
                y: rect.y,
                height: rect.height,
              };
            }
          }

          return { firstChildBoundingBox, lastChildBoundingBox };
        },
        containerSelector,
        childSelector
      );

    if (firstChildBoundingBox && lastChildBoundingBox) {
      const firstChildX =
        firstChildBoundingBox.x + firstChildBoundingBox.width / 2;
      const firstChildY =
        firstChildBoundingBox.y + firstChildBoundingBox.height / 2;

      const lastChildX =
        lastChildBoundingBox.x + lastChildBoundingBox.width / 2;
      const lastChildY =
        lastChildBoundingBox.y + lastChildBoundingBox.height / 2;

      // Simulate drag and drop
      await this.page.mouse.move(lastChildX, lastChildY);
      await this.page.mouse.down();
      await this.page.mouse.move(firstChildX, firstChildY, { steps: 10 }); // Adjust steps as needed
      await this.page.mouse.up();
    }
  }

  async getToBooking() {
    await this.page.click('[data-id="b-partidos"]');

    await this.page.waitForSelector('[data-id="r-8"]');
    await this.page.click('[data-id="r-8"]');
  }

  async checkIfHourIsVisible(hour) {
    return new Promise((resolve, reject) => {
      if (hour.isVisible()) resolve();
      else reject();
    });
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async scrollDown(px) {
    this.page.evaluate((px) => {
      window.scrollBy(0, px); // Scroll down by 500 pixels
    }, px);
  }

  async selectDateAndHour() {
    // *= MEANS THAT WILL FIND THE ELEMENT THAT CONTAINS THE SPECIFIED SUBSTRING.
    const date = await this.page.$(`[aria-label*="${this.date}"]`);
    await this.delay(500);
    if (date) await date.click();

    await this.page.waitForSelector("#div-hores-disponibles-8");

    // CHECK IF SELECTOR IS VISIBLE FIRST
    const selector = `[data-hora="${this.hour}"]`;
    let hour = await this.page.$(selector);
    let visible = await this.checkIfHourIsVisible(hour)
      .then(() => true)
      .catch(() => false);

    while (!visible) {
      await this.scrollUntilVisible();

      hour = await this.page.$(selector);
      visible = await this.checkIfHourIsVisible(hour)
        .then(() => true)
        .catch(() => false);
      await this.delay(1500);
      if (!visible) {
        const element = await this.page.$('[class*="pistas-hora-more"]');
        await element.click();
      }
    }
    const containsClass = await hour.evaluate((element) => {
      return element.classList.contains("pistas-hora-ok");
    });

    if (containsClass) await hour.click();
    else {
      console.log("Hour full");
      this.browser.close();
    }
  }

  async selectCourt() {
    const containerSelector = `[id="form-listado-pistas-8"]`;
    const courtExpanded = `[aria-expanded="true"]`;
    await this.page.waitForSelector(courtExpanded);

    this.scrollDown(500);

    await this.delay(100);
    let childrens = await this.page.evaluate((containerSelector) => {
      const element = document.querySelector(containerSelector);
      if (element)
        return [
          ...Array.from(element.children)
            .filter((child) => child.tagName === "DIV")
            .map((child) => child.id),
        ];
      return [];
    }, containerSelector);

    if (!childrens) {
      console.log("Courts not found");
      return;
    }

    for (const openC of childrens) {
      const c = await this.page.$(`#${openC}`);
      const result = await c.evaluate((element) => {
        return element.classList.contains("mbsc-collapsible-open");
      });

      if (result) {
        const boundingBox = await c.boundingBox();
        if (!boundingBox) {
          console.log("No bounding box");
          continue; // Skip to the next iteration
        }

        const clickX = boundingBox.x + boundingBox.width / 2;
        const clickY = boundingBox.y + boundingBox.height / 4;
        await this.page.mouse.click(clickX, clickY);
      }
    }

    await this.delay(500);

    let courtSelector = `#${childrens[this.preferedCourt]}`;
    let court = await this.page.$(courtSelector);

    //Check if this court is available
    let checkCourt = true;
    let courtNumber = 0;
    while (checkCourt) {
      const available = await court.evaluate((element, time) => {
        debugger;
        return (
          !element.innerHTML.includes("[NO DISPONIBLE]") &&
          !element
            .querySelector("label")
            .querySelectorAll("b")
            [time].style.cssText.includes("darkred")
        );
      }, this.time);

      if (available) {
        checkCourt = false;
        break;
      }
      courtSelector = `#${childrens[courtNumber]}`;
      court = await this.page.$(courtSelector);
      if (!court) {
        console.log("No hours avaiable");
        checkCourt = false;
        return;
      }
      courtNumber++;
    }

    await court.click();
    await this.delay(500);
    await this.scrollDown(500);

    let courtHours = await this.page.evaluate((courtSelector) => {
      const element = document.querySelector(courtSelector);
      if (element)
        return [
          ...Array.from(
            element.children[1].children[0].children[0].children[0].children
          )
            .filter((child) => child.tagName === "LI")
            .map((child) => child.id),
        ];
      return [];
    }, courtSelector);
    const preferedHourSelector = `#${courtHours[this.time]}`;
    const preferedHour = await this.page.$(preferedHourSelector);

    preferedHour.click();
  }

  async main() {
    const p = await this.browser.pages();
    this.page = p[1];
    await this.getToBooking();
    await this.selectDateAndHour();
    await this.selectCourt();
  }
}
