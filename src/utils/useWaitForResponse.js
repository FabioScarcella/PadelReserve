export async function waitForGetMethod(url, page) {
  await page.waitForResponse((response) => {
    return (
      response.request().method() === "GET" && response.url().includes(url)
    );
  });
}
