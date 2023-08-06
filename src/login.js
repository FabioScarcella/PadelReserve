import "dotenv/config";
import { waitForResponse } from "./utils/useWaitForResponse.js";

export class Login {
  constructor(browser) {
    this.login = process.env.LOGIN;
    this.password = process.env.PASSWORD;
    this.url = process.env.URL;
    this.loginRequest = process.env.LOGINREQUEST;
    this.loginLoad = process.env.LOGINLOADING;
    this.browser = browser;
  }

  async main() {
    const page = await this.browser.newPage();

    await page.goto(this.url);

    await waitForResponse(page, this.loginLoad);

    await page.type("#j_username", this.login);
    await page.type("#j_password", this.password);

    await page.click("#mbsc-form-control-3");

    await waitForResponse(page, this.loginRequest);

    return true;
  }
}

export default Login;
