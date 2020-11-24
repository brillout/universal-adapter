const assert = require("@brillout/reassert");

module.exports = [
  {
    handlers: [handlerFallback, handlerHighPrio, handlerLowPrio],
    test,
  },
];

handlerFallback.executionPriority = -1;
async function handlerFallback(
  requestObject,
  { urlProps: { pathname }, requestProps: { method } }
) {
  if (method !== "GET") {
    return null;
  }
  return {
    body: "I'm fallback",
  };
}

handlerHighPrio.executionPriority = 1;
async function handlerHighPrio(
  requestObject,
  { urlProps: { pathname }, requestProps: { method } }
) {
  if (method !== "GET" || pathname !== "/high-prio") {
    return null;
  }
  return {
    body: "I'm high prio",
  };
}

handlerLowPrio.executionPriority = 0;
async function handlerLowPrio(
  requestObject,
  { urlProps: { pathname }, requestProps: { method } }
) {
  if (method !== "GET" || !pathname.startsWith("/high")) {
    return null;
  }
  return {
    body: "I'm low prio",
  };
}

async function test({ fetch }) {
  const highPrioMsg = await fetch("/high-prio");
  const lowPrioMsg = await fetch("/high-prio-2");
  const fallbackMsg = await fetch("/some-route");

  assert(
    highPrioMsg === "I'm high prio" &&
      lowPrioMsg === "I'm low prio" &&
      fallbackMsg === "I'm fallback",
    {
      highPrioMsg,
      lowPrioMsg,
      fallbackMsg,
    }
  );
}
