export class Pay {
  constructor(browser) {
    this.browser = browser;
    this.page;
  }

  async clickConfirmation() {
    const buttonSelector = "#boton-reservar-pista-confirmar";
    await this.page.waitForSelector(buttonSelector);
    const button = await this.page.$(buttonSelector);
    if (button) {
      await button.click();

      const reserveConfirmation = `[class*="mbsc-fr-btn-s"]`;
      await this.page.waitForSelector(reserveConfirmation);
      const rcButton = await this.page.$(reserveConfirmation);
      if (rcButton) {
        rcButton.click();
        console.log("Reserve has been completed");
      }
    }
  }

  async main() {
    const p = await this.browser.pages();
    this.page = p[1];
    await this.clickConfirmation();
  }
}
