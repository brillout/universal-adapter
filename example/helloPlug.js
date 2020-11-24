module.exports = helloPlug;

async function helloPlug({ pathname, method }) {
  if (method !== "GET" || !pathname.startsWith("/hello/")) {
    return null;
  }
  return {
    body: "hello " + pathname.slice("/hello/".length),
    headers: [
      { name: "Cache-Control", value: "public, max-age=31536000, immutable" },
    ],
  };
}
