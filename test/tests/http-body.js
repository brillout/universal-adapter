const assert = require('@brillout/reassert');

module.exports = [
  {
    handler,
    test,
  },
];

async function handler({pathname, method, body}) {
  if( method!=='POST' || !pathname.startsWith('/hello') ) {
    return null;
  }
  return {
    body: 'hello '+body
  };
}

async function test({fetch}) {
  const body = await fetch('/hello', {body: 'alice', method: 'POST', headers: {'content-type': 'text/plain'}});
  assert(body==='hello alice', {body});
}
