const assert = require('reassert');

module.exports = getRequestHandlers;

function getRequestHandlers(handlers) {
  assert.usage(handlers && (isCallable(handlers) || handlers.constructor===Array));
  const handlerList = isCallable(handlers) ? handlers() : handlers;
  assert.usage(handlers && handlers.constructor===Array);

  const requestHandlers = [];
  const paramHandlers = [];
  const onServerCloseHandlers = [];

  handlerList
  .forEach(handlerSpec => {
    if( isCallable(handlerSpec) ) {
      requestHandlers.push(handlerSpec);
      return;
    }
    assert.usage(
      handlerSpec && handlerSpec.constructor===Object,
      handlerSpec,
      "Provided universal plug is not an object nor a function"
    );

    const handlerNames = ['paramHandler', 'requestHandler', 'onServerCloseHandler'];

    assert.usage(Object.keys(handlerSpec).filter(key => !handlerNames.includes(key)).length===0, handlerSpec);
    assert.usage(Object.keys(handlerSpec).length>0, handlerSpec);

    handlerNames.forEach(handlerName => {
      const handler = handlerSpec[handlerName];
      if( ! handler ) {
        return;
      }
      assert.usage(isCallable(handler), handlerSpec, handler, handlerName);
      if( handlerName==='paramHandler' ) {
        assert_notImplemented(false);
        paramHandlers.push(handler);
        return;
      }
      if( handlerName==='requestHandler' ) {
        requestHandlers.push(handler);
        return;
      }
      if( handlerName==='onServerCloseHandler' ) {
        assert_notImplemented(false);
        onServerCloseHandlers.push(handler);
        return;
      }
      assert.internal(false);
    });
  });

  sortHandlers(requestHandlers);
  sortHandlers(paramHandlers);
  sortHandlers(onServerCloseHandlers);

  return {requestHandlers, paramHandlers, onServerCloseHandlers};
}
function isCallable(thing) {
  return typeof thing === "function";
}

function sortHandlers(handlers) {
  return (
    handlers
    .sort((h1, h2) => {
      assert.internal(isCallable(h1));
      assert.internal(isCallable(h2));
      const p1 = (h1.executionPriority||0);
      const p2 = (h2.executionPriority||0);
      assert.internal(p1.constructor===Number);
      assert.internal(p2.constructor===Number);
      return p2 - p1;
    })
  );
}

function assert_notImplemented(val) {
  assert.internal(val, 'NOT-IMPLEMENTED');
}
