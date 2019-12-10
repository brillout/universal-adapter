const assert = require('@brillout/reassert');

const getResponseObject = require('@universal-adapter/server/getResponseObject');
const getRequestHandlers = require('@universal-adapter/server/getRequestHandlers');

const Router = require('koa-router');

module.exports = KoaAdapter;

function KoaAdapter(handlers) {
  const router = new Router();

  router.all('*', async (ctx, next) => {
    const requestHandlers = getRequestHandlers(handlers);
    const responseBuilt = await buildResponse({requestHandlers, ctx});

    // More infos about `next()`:
    //  - https://github.com/koajs/koa/blob/master/docs/guide.md#response-middleware
    assert.internal([true, false].includes(responseBuilt));
    if( responseBuilt===false ) {
      await next();
      return;
    }
    if( responseBuilt===true ) {
      return;
    }
    assert.internal(false);
  });

  return router.routes();
}

async function buildResponse({requestHandlers, ctx}) {
  const requestProps = getRequestProps(ctx);

  for(const requestHandler of requestHandlers) {
    const responseObject = (
      getResponseObject(
        await requestHandler(ctx, {requestProps}),
        {extractEtagHeader: true}
      )
    );

    if( responseObject === null ) {
      continue;
    }

    const {body, headers, redirect, statusCode, etag, contentType} = responseObject;

    headers.forEach(header => ctx.set(header.name, header.value));

    if( etag ) {
      ctx.set('ETag', etag);
      ctx.status = 200;
      if( ctx.fresh ) {
        ctx.status = 304;
        return true;
      }
    }

    if( statusCode ) {
      ctx.status = statusCode;
    }

    if( contentType ) {
      ctx.type = contentType;
    }

    ctx.body = body;

    if( redirect ) {
      res.redirect(redirect);
    }

    return true;
  }
  return false;
}

function getRequestProps(ctx) {
  const url = getRequestUrl();
  const method = getRequestMethod();
  const headers = getRequestHeaders();
  const body = getRequestBody();

  const requestProps = {
    url,
    method,
    headers,
    body,
    isKoaFramework: true,
    isUniversalAdapter: true,
  };
  return requestProps;

  function getRequestUrl() {
    // https://github.com/koajs/koa/blob/master/docs/api/request.md#requesthref
    const url = ctx.request.href;
    assert.internal(url.startsWith('http'));
    return url;
  }

  function getRequestMethod() {
    const {method} = ctx;
    assert.internal(url.constructor===String);
    return method;
  }

  function getRequestHeaders() {
    const {headers} = ctx;
    assert.internal(headers.constructor===Object);
    return headers;
  }

  function getRequestBody() {
    const {body} = ctx.request;
    return body;
  }
}
