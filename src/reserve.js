export class Reserve {
  constructor(browser) {
    this.browser = browser;
  }

  async main() {
    const pages = await this.browser.pages();
    const cur = pages[1];
    const title = await cur.title();
    console.log(title);
  }
}
