import "dotenv/config";
export class Reserve {
  constructor(browser) {
    this.browser = browser;
    this.page;

    this.date = process.env.DATE;
    this.hour = process.env.HOUR;
  }

  async scrollUntilVisible(targetElement, container) {
    const scrollDistance = 760;

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
            debugger;
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

  async selectDateAndHour() {
    // *= MEANS THAT WILL FIND THE ELEMENT THAT CONTAINS THE SPECIFIED SUBSTRING.
    const date = await this.page.$(`[aria-label*="${this.date}"]`);
    if (date) date.click();

    // CHECK IF SELECTOR IS VISIBLE FIRST
    const selector = `[data-hora="this.hour"]`;
    let hour = await this.page.$(selector);
    if (!hour) {
      const element = await this.page.$('[class*="pistas-hora-more"]');
      const childDiv = await this.page.$(`#div-hores-disponibles-8`);
      const parentElement = await childDiv.$x("..");
      await this.scrollUntilVisible(element, parentElement[0]);
      //element.click();

      hour = await this.page.$(selector);
    }

    //    hour.click();
  }

  async main() {
    const p = await this.browser.pages();
    this.page = p[1];

    await this.getToBooking();
    await this.selectDateAndHour();
  }
}
