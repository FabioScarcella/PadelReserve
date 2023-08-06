import "dotenv/config";
import puppeteer from "puppeteer";
import { waitForGetMethod } from "./utils/useWaitForResponse";

export class Login {
  constructor(browser) {
    this.login = process.env.LOGIN;
    this.password = process.env.PASSWORD;
    this.url = process.env.URL;
    this.loginRequest = process.env.LOGINREQUEST;
    this.loginLoad = process.env.LOGINLOADING;
    this.browser = browser;
  }

  async waitForFirstLoad() {}

  async main() {
    const page = await this.browser.newPage();

    await page.goto(this.url);

    let response = await waitForGetMethod(this.loginLoad, this.page);

    if (!response) {
      console.error("Wait for first load failed, proceeding to wait 5 seconds");
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    response = null;

    await page.type("#j_username", this.login);
    await page.type("#j_password", this.password);

    await page.click("#mbsc-form-control-3");

    response = await waitForGetMethod(this.loginRequest, this.page);

    await page.screenshot({ path: "logged_in.png" });

    await this.browser.close();
  }
}

export default Login;
