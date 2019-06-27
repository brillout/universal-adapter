const Router = require('koa-router');
const getResponseObject = require('@universal-adapter/server/getResponseObject');
const getRequestHandlers = require('@universal-adapter/server/getRequestHandlers');
const assert = require('reassert');


module.exports = KoaAdapter;
// module.exports.buildResponse = buildResponse;

function KoaAdapter(handlers, {addRequestContext}={}) { const router = new Router();
  router.all('*', async (ctx, next) => {
    const requestHandlers = getRequestHandlers(handlers);
    await buildResponse({requestHandlers, ctx, addRequestContext});
    // More infos about `next()`:
    //  - https://github.com/koajs/koa/blob/master/docs/guide.md#response-middleware
    await next();
  });

  return router.routes();
}

async function buildResponse({requestHandlers, ctx, addRequestContext}) {
  const requestContext = getRequestContext({ctx, addRequestContext});

  for(const requestHandler of requestHandlers) {
    const responseObject = (
      getResponseObject(
        await requestHandler(requestContext),
        {extractEtagHeader: true}
      )
    );

    if( responseObject === null ) {
      continue;
    }

    const {body, headers, redirect, statusCode, etag, type} = responseObject;

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

    if( type ) {
      ctx.type = type;
    }

    ctx.body = body;

    if( redirect ) {
      res.redirect(redirect);
    }

    return true;
  }
  return false;
}

function getRequestContext({ctx, addRequestContext}) {
  const url = getRequestUrl();
  const method = getRequestMethod();
  const headers = getRequestHeaders();
  const body = getRequestBody();

  const requestContext = {
    ...ctx,
    url,
    method,
    headers,
    body,
  };

  if( addRequestContext ) {
    Object.assign(requestContext, addRequestContext(ctx));
  }

  return requestContext;

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
    return ctx.body;
  }
}

