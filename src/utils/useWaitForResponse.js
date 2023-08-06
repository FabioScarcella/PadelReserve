export async function waitForResponse(page, url) {
  const responsePromise = page.waitForResponse((response) =>
    response.url().includes(url)
  );

  const timeoutPromise = new Promise((resolve) => {
    setTimeout(() => {
      resolve(null); // Resolve with null after the timeout
      console.error(
        `Error in getting a response. Timeout max exceeded. The url to watch was ${url}`
      );
    }, 5000);
  });

  const result = await Promise.race([responsePromise, timeoutPromise]);
  return result;
}
