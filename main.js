import puppeteer from "puppeteer";

import Login from "./src/login.js";

const main = async () => {
  const browser = await puppeteer.launch({ headless: false });

  const login = new Login(browser);

  await login.main();
};

main();
