import puppeteer from "puppeteer";
import "dotenv/config";
import fs from "fs";

import Login from "./src/login.js";
import { Reserve } from "./src/reserve.js";
import { Pay } from "./src/pay.js";

let reserveTime;
let desiredDate;
let active;
const filePath = "config.json";

const readFile = async () => {
  try {
    const data = fs.readFileSync(filePath, "utf-8");
    try {
      const jsonObj = JSON.parse(data);
      reserveTime = jsonObj.RESERVETIME;
      active = jsonObj.ACTIVE;
      desiredDate = jsonObj.RESERVEDAY;
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

function getMonthFromString(mon) {
  const d = Date.parse(mon + "1, 2023");
  if (!isNaN(d)) {
    return new Date(d).getMonth() + 1;
  } else {
    console.error("Error in the month");
    return new Date().getMonth() + 1;
  }
}

const main = async () => {
  // const browser = await puppeteer.launch({ headless: false });
  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/google-chrome-stable", // Path to Chrome e>
    userDataDir: "/home/fabio_scrcella_gomez/puppeteer_userdata", // Path to user data directory);
  });

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

function splitDelay(ms) {
  const hour = new Date(ms).getHours();
  const splitParts = (60 / 5) * hour; //every 5 minutes multiplied for the number of remaining hours
  const timeSplitted = Math.ceil(ms / splitParts);
  return { ms: timeSplitted, times: splitParts };
}

while (true) {
  await readFile();
  if (active) {
    const splitDate = desiredDate.split(" ");

    const currentTime = Date.now();
    const currentDate = new Date(currentTime);
    const desiredMonth = getMonthFromString(splitDate[0]);
    const desiredDay = splitDate[1];
    const day = `${currentDate.getFullYear()}-${String(desiredMonth).padStart(
      2,
      "0"
    )}-${String(desiredDay).padStart(2, "0")}T`;
    const targetTime = new Date(`${day}${reserveTime}`);
    const delay = targetTime - currentTime;

    console.log(
      `ACTIVE. Waiting ${new Date(delay)
        .toISOString()
        .slice(11, 19)} to be active`
    );

    const sd = splitDelay(delay);
    console.log(
      `I'LL BE WAITING ${new Date(sd.ms * sd.times)
        .toISOString()
        .slice(11, 19)}`
    );
    console.log(new Date().getMinutes());
    console.log(
      `AND I'LL BE SLEEPING FOR ${new Date(sd.ms).toISOString().slice(11, 19)}`
    );
    let times = 0;
    while (times < sd.times) {
      await new Promise((resolve) => setTimeout(resolve, sd.ms));
      console.log("I AM ACTIVE AND STILL WAITING");
      times++;
    }
    console.log("Starting MAIN function");
    await main();
  } else {
    console.log("NOT ACTIVE, WAITING 5 MINUTES AND THEN CHECKING AGAIN");
    await new Promise((resolve) => setTimeout(resolve, 5000 * 60));
  }
}
