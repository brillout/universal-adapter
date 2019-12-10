const assert = require('@brillout/reassert');
const getUrlProps = require('@brillout/url-props');

module.exports = getRequestHandlers;

function getRequestHandlers(handlers) {
  assert.usage(
    handlers && (isCallable(handlers) || handlers.constructor===Array),
    {handlers},
    "The `handlers` argument should either be an array or a function that returns an array.",
  );
  const handlerList = isCallable(handlers) ? handlers() : handlers;
  assert.usage(
    handlerList && handlerList.constructor===Array,
    {handlerList},
    "Your handlers function should return an array.",
  );

  const requestHandlers = [];

  handlerList.forEach(handler => {
    assert.usage(isCallable(handler));
    const requestHandler = function(requestObject, {requestProps}) {
      assert_requestProps(requestProps);
      const urlProps = getUrlProps(requestProps.url);
      return handler(requestObject, {requestProps, urlProps});
    };
    requestHandler.name = handler.name;
    requestHandler.executionPriority = handler.executionPriority;
    requestHandlers.push(requestHandler);
  });

  sortHandlers(requestHandlers);

  return requestHandlers;
}

function isCallable(thing) {
  return typeof thing === "function";
}

function sortHandlers(handlers) {
  handlers
  .sort((h1, h2) => {
    assert.internal(isCallable(h1));
    assert.internal(isCallable(h2));
    const p1 = (h1.executionPriority||0);
    const p2 = (h2.executionPriority||0);
    assert.internal(p1.constructor===Number);
    assert.internal(p2.constructor===Number);
    return p2 - p1;
  });
}

function assert_requestProps(requestProps) {
  assert.internal('method' in requestProps);
  assert.internal('url' in requestProps);
  assert.internal('headers' in requestProps);
  assert.internal('body' in requestProps);

  assert.internal(
    [
      'GET',
      'HEAD',
      'POST',
      'PUT',
      'DELETE',
      'CONNECT',
      'OPTIONS',
      'TRACE',
      'PATCH',
    ]
    .includes(requestProps.method)
  );

  // `url` should be the full URL with hostname and origin
  const {url} = requestProps;
  const urlProps = getUrlProps(url);
  assert.internal(urlProps.hostname);
  assert.internal(url.startsWith('http'));

  // `headers` should be an array,
  // but server frameworks seem to always return an object instead.
  assert.internal(requestProps.headers.constructor===Object);
}
