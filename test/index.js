const {symbolSuccess, symbolError} = require('@brillout/cli-theme');

runTests();

async function runTests() {
  const tests = getTests();

  const serverRunners = [
    {
      serverLibraryName: 'Hapi',
      runner: runWithHapi,
    },
    {
      serverLibraryName: 'Express',
      runner: runWithExpress,
    },
    {
      serverLibraryName: 'Koa',
      runner: runWithKoa,
    },
  ];

  for(let {test, handler, testPath} of tests) {
    for(let {serverLibraryName, runner} of serverRunners) {
      let err = false;
      try {
        await runner({test, handler});
      } catch(_err) {
        err = _err;
      }
      console.log((err?symbolError:symbolSuccess)+testPath+' ['+serverLibraryName+']');
      err && console.error(err);
    }
  }
}

async function runWithHapi({test, handler}) {
  const Hapi = require('hapi');
  const HapiAdapter = require('../hapi');

  const server = Hapi.Server({
    port: 3000,
    debug: {request: ['internal']},
  });

  await server.register(
    new HapiAdapter([
      handler,
    ])
  );

  await server.start();

  try {
    await test({fetch});
  } finally {
    await server.stop();
  }
}

async function runWithKoa({test, handler}){
  const Koa = require('koa');
  const KoaAdapter = require('../koa');

  const app = new Koa();

  const server = app.listen(3000);

  app.use(
    new KoaAdapter([
      handler,
    ])
  );

  try {
    await test({fetch});
  } finally {
    await server.close();
  }
}

async function runWithExpress({test, handler}) {
  const express = require('express');
  const ExpressAdapter = require('../express');

  const app = express();

  app.use(
    new ExpressAdapter([
      handler,
    ])
  );

  const server = await startServer(app);

  try {
    await test({fetch});
  } finally {
    await stopServer(server);
  }
}
async function startServer(app) {
  const http = require('http');
  const server = http.createServer(app);
  server.listen(3000);

  // Wait until the server has started
  await new Promise((r, f) => {server.on('listening', r); server.on('error', f);});

  server.stop = async () => {
    await stopServer(server);
  };

  return server;
}
async function stopServer(server) {
  const p = new Promise((r, f) => {
    server.on('close', r);
    server.on('error', f);
  });
  server.close();
  // Wait until server closes
  await p;
}

async function fetch(url, fetchArgs) {
  const fetch = require('@brillout/fetch');

  const resp = await fetch('http://localhost:3000'+url, fetchArgs);

  const body = await resp.text();
  return body;
}

function getTests() {
  const glob = require('glob');
  const path = require('path');

  const projectRoot = __dirname+'/..';

  const testFiles = glob.sync(projectRoot+'/test/tests/*.js');
  const tests = [];
  testFiles.forEach(filePath => {
    const fileTests = require(filePath);
    fileTests.forEach(({test, handler}) => {
      const testPath = path.relative(projectRoot, filePath);
      tests.push({test, handler, testPath})
    });
  });

  return tests;
}
