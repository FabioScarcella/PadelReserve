import puppeteer from "puppeteer";

import Login from "./src/login.js";
import { Reserve } from "./src/reserve.js";

const main = async () => {
  const browser = await puppeteer.launch({ headless: false });

  const login = new Login(browser);

  const loginResult = await login.main();
  if (!loginResult) {
    console.error(
      "error in login, verify your credentials or if the page is up"
    );
    return;
  }

  const reserve = new Reserve(browser);
  reserve.main();
};

main();
