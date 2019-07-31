const Router = require('koa-router');
const getResponseObject = require('@universal-adapter/server/getResponseObject');
const getRequestHandlers = require('@universal-adapter/server/getRequestHandlers');
const assert = require('reassert');


module.exports = KoaAdapter;

function KoaAdapter(handlers, {addRequestContext}={}) {
  const router = new Router();

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
  const requestProps = await getRequestProps({ctx, addRequestContext});

  for(const requestHandler of requestHandlers) {
    const responseObject = (
      getResponseObject(
        await requestHandler(requestProps),
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

async function getRequestProps({ctx, addRequestContext}) {
  const url = getRequestUrl();
  const method = getRequestMethod();
  const headers = getRequestHeaders();

  const requestProps = {
    ...ctx,
    url,
    method,
    headers,
  };

  if( addRequestContext ) {
    Object.assign(requestProps, addRequestContext(ctx));
  }

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
}
