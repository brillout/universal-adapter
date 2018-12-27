<!---






    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Edit `/readme.template.md` instead.












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Edit `/readme.template.md` instead.












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Edit `/readme.template.md` instead.












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Edit `/readme.template.md` instead.












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Edit `/readme.template.md` instead.






-->

# `@universal-adapter`

Like adapters for power outlet, but for JavaScript.

For now, there are only adapters for server frameworks (Express, Hapi, Koa).

## Server adapters

The server adapters allow you to write server code that can work with several server frameworks.

 - Express adapter: `@universal-adapter/express`
 - Hapi adapter: `@universal-adapter/hapi`
 - Koa adapter: `@universal-adapter/koa`

### Example

We define routes `/` and `/hello/{name}` that will work with Express, Hapi, and Koa:

~~~js
// /example/helloPlug.js

module.exports = helloPlug;

async function helloPlug({url, method}) {
  if( method!=='GET' || !url.startsWith('/hello/') ) {
    return null;
  }
  return {
    body: 'hello '+url.slice('/hello/'.length),
    headers: [
      {name: 'Cache-Control', value: 'public, max-age=31536000, immutable'}
    ]
  };
}
~~~

We can now use `helloPlug` with either Express, Hapi, or Koa:

~~~js
// /example/express

const express = require('express');
const ExpressAdater = require('@universal-adapter/express');
const helloPlug = require('../helloPlug');

module.exports = start();

function start() {
  const app = express();

  app.use(
    new ExpressAdater([
      helloPlug,
    ])
  );

  app.listen(3000, () => console.log('Express server running at http://localhost:3000'));
}
~~~
~~~js
// /example/hapi

const Hapi = require('hapi');
const HapiAdapter = require('@universal-adapter/hapi');
const helloPlug = require('../helloPlug');

module.exports = start();

async function start() {
  const server = Hapi.Server({
    port: 3000,
    debug: {request: ['internal']},
  });

  await server.register(
    new HapiAdapter([
      helloPlug,
    ])
  );

  await server.start();
  console.log('Hapi server running at http://localhost:3000');
}
~~~
~~~js
// /example/koa

const Koa = require('koa');
const KoaAdapter = require('@universal-adapter/koa');
const helloPlug = require('../helloPlug');

module.exports = start();

function start() {
  const server = new Koa();

  server.use(
    new KoaAdapter([
      helloPlug,
    ])
  );

  server.listen(3000);

  console.log('Koa server running at http://localhost:3000');
}
~~~

<!---






    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Edit `/readme.template.md` instead.












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Edit `/readme.template.md` instead.












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Edit `/readme.template.md` instead.












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Edit `/readme.template.md` instead.












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Edit `/readme.template.md` instead.






-->
