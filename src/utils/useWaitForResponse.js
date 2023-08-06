export async function waitForResponse(page, url) {
  const responsePromise = page.waitForResponse((response) =>
    response.url().includes(url)
  );

  const timeoutPromise = new Promise((resolve) => {
    setTimeout(() => {
      resolve(null); // Resolve with null after the timeout
    }, 5000);
  });

  const result = await Promise.race([responsePromise, timeoutPromise]);
  if (result === null) {
    //timeout reached, executing looser
    console.error(
      `Error in getting a response. Timeout max exceeded. The url to watch was ${url}`
    );
    return null;
  }
  return result;
}
