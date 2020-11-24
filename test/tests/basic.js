const assert = require("@brillout/reassert");

module.exports = [
  {
    handler,
    test,
  },
];

async function handler(
  requestObject,
  { urlProps: { pathname }, requestProps: { method } }
) {
  if (method !== "GET" || !pathname.startsWith("/hello/")) {
    return null;
  }
  return {
    body: "hello " + pathname.slice("/hello/".length),
    /*
    headers: [
      {name: 'Cache-Control', value: 'public, max-age=31536000, immutable'}
    ]
    */
  };
}

async function test({ fetch }) {
  const body = await fetch("/hello/jon");
  assert(body === "hello jon", { body });
}
