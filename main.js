import puppeteer from "puppeteer";
import "dotenv/config";
import fs from "fs";

import Login from "./src/login.js";
import { Reserve } from "./src/reserve.js";
import { Pay } from "./src/pay.js";

let reserveTime;
let active;
const filePath = "config.json";

const readFile = async () => {
  try {
    const data = fs.readFileSync(filePath, "utf-8");
    try {
      const jsonObj = JSON.parse(data);
      reserveTime = jsonObj.RESERVETIME;
      active = jsonObj.ACTIVE;
    } catch (parseError) {
      console.error(parseError);
    }
  } catch (err) {
    console.error(err);
  }
};

const writeFile = async () => {
  try {
    const data = fs.readFileSync(filePath, "utf-8");
    try {
      const jsonObj = JSON.parse(data);
      jsonObj.ACTIVE = false;
      const updatedJsonDate = JSON.stringify(jsonObj, null, 2);
      fs.writeFileSync(filePath, updatedJsonDate, "utf8");
      console.log("JSON UPDATED");
    } catch (parseError) {
      console.error(parseError);
    }
  } catch (err) {
    console.error(err);
  }
};

const main = async () => {
  // const browser = await puppeteer.launch({ headless: false });
  const browser = await puppeteer.launch();

  const login = new Login(browser);

  const loginResult = await login.main();
  if (!loginResult) {
    console.error(
      "error in login, verify your credentials or if the page is up"
    );
    return;
  }

  const reserve = new Reserve(browser);
  await reserve.main();

  const pay = new Pay(browser);
  await pay.main();

  await new Promise((resolve) => setTimeout(resolve, 250 * 60));
  await writeFile();
  await new Promise((resolve) => setTimeout(resolve, 250 * 60));
  await browser.close();
};

while (true) {
  await readFile();
  if (active) {
    const currentTime = Date.now();
    const currentDate = new Date(currentTime);
    const day = `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1
    ).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}T`;
    const targetTime = new Date(`${day}${reserveTime}`);
    const delay = targetTime - currentTime;
    console.log("ACTIVE");

    await new Promise((resolve) => setTimeout(resolve, delay));
    console.log(new Date());
    await main();
  } else {
    console.log("NOT ACTIVE, WAITING 1 MINUTE AND THEN CHECKING AGAIN");
    await new Promise((resolve) => setTimeout(resolve, 1000 * 60));
  }
}
