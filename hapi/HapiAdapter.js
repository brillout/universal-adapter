const Boom = require('boom');
const assert = require('reassert');
const getResponseObject = require('@universal-adapter/server/getResponseObject');
const getRequestHandlers = require('@universal-adapter/server/getRequestHandlers');

module.exports = HapiAdapter;
// module.exports.buildResponse = buildResponse;

function HapiAdapter(handlers, {useOnPreResponse=false, addRequestContext}={}) {
  const HapiPlugin = {
    name: 'HapiAdapter',
    multiple: false,
    register: server => {
      if( ! useOnPreResponse ) {
        server.route({
          method: '*',
          path: '/{param*}',
          handler: catchAllRoute,
        });
      } else {
        // The payload (aka POST request body) doesn't seem to be available at `onPreResponse`.
        server.ext('onPreResponse', onPreResponse);
      }

      /*
      server.ext('onRequest', async (request, h) => {
        const {paramHandlers} = getRequestHandlers(handlers);
        await addParameters({paramHandlers, request, addRequestContext});
        return h.continue;
      });
      */

      /* It could be better to not support this feature
      server.ext('onPostStop', async () => {
        const {onServerCloseHandlers} = getRequestHandlers(handlers);
        for(const cb of onServerCloseHandlers) {
          await cb();
        }
      });
      */
    },
  };

  return HapiPlugin;

  async function catchAllRoute(request, h) {

    // TODO re-work this
    if( isAlreadyServed(request) ) {
        return h.continue;
    }

    const requestHandlers = getRequestHandlers(handlers);
    const resp = await buildResponse({requestHandlers, request, h, addRequestContext});
    if( resp === null ) {
      throw Boom.notFound(null, {});
    }
    return resp;
  }

  async function onPreResponse(request, h) {
    // TODO re-work this
    if( isAlreadyServed(request) ) {
        return h.continue;
    }

    const requestHandlers = getRequestHandlers(handlers);
    const resp = await buildResponse({requestHandlers, request, h, addRequestContext});
    if( resp === null ) {
      return h.continue;
    }
    return resp;
  }
}

async function buildResponse({requestHandlers, request, h, addRequestContext}) {
    assert.usage(requestHandlers);
    assert.usage(request && request.raw && request.raw.req);
    assert.usage(h && h.continue);

    const requestContext = getRequestContext({request, addRequestContext});

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

      const {body, headers, redirect, statusCode, etag, contentType} = responseObject;

      const resp = h.response(body);

      headers.forEach(({name, value}) => resp.header(name, value));

      if( etag ) {
        const resp_304 = h.entity({etag});
        if( resp_304 ) {
          return resp_304;
        }
        resp.etag(etag, {weak: false});
      }

      if( redirect ) {
        resp.redirect(redirect);
      }

      if( statusCode ) {
        resp.code(statusCode);
      }

      if( contentType ) {
        resp.type(contentType);
      }

      return resp;
    }

    return null;
}

/*
async function addParameters({paramHandlers, request, addRequestContext}) {
  assert.usage(paramHandlers);
  assert.usage(request && request.raw && request.raw.req);

  const requestContext = getRequestContext({request, addRequestContext});

  for(const paramHandler of paramHandlers) {
    assert.usage(paramHandler instanceof Function);
    const newParams = await paramHandler(requestContext);
    assert.usage(newParams===null || newParams && newParams.constructor===Object);
    Object.assign(request, newParams);
  }
}
*/

function getRequestContext({request, addRequestContext}) {
  const url = getRequestUrl();
  const method = getRequestMethod();
  const headers = getRequestHeaders();

  const requestContext = {
    ...request,
    url,
    method,
    headers,
  };

  if( addRequestContext ) {
    Object.assign(requestContext, addRequestContext(request));
  }

  return requestContext;

  function getRequestUrl() {
    // https://stackoverflow.com/questions/31840286/how-to-get-the-full-url-for-a-request-in-hapi
    /* The accepected answer doesn't work:
    const url = `${request.headers['x-forwarded-proto'] || request.connection.info.protocol}://${request.info.host}${request.url.path}`;
    */
    const HapiUrl = require('hapi-url');
    const url = HapiUrl.current(request);
    assert.internal(url.startsWith('http'));
    return url;
  }

  function getRequestMethod() {
    const {method} = request.raw.req;
    assert.internal(url.constructor===String);
    return method;
  }

  function getRequestHeaders() {
    const {headers} = request.raw.req;
    assert.internal(headers.constructor===Object);
    return headers;
  }
}

function isAlreadyServed(request) {
    if( ! request.response ) {
        return false;
    }

    if( ! request.response.isBoom || (request.response.output||{}).statusCode !== 404 ) {
        return true;
    }

    /*
    if( request.response.headers===undefined && request.response.output===undefined ) {
        return false;
    }
    */

    return false;
}
