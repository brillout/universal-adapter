const assert = require("@brillout/reassert");

const getResponseObject = require("@universal-adapter/server/getResponseObject");
const getRequestHandlers = require("@universal-adapter/server/getRequestHandlers");

const Boom = require("boom");

module.exports = HapiAdapter;
// module.exports.buildResponse = buildResponse;

function HapiAdapter(
  handlers,
  { useOnPreResponse = false, path = "/{param*}" } = {}
) {
  const HapiPlugin = {
    name: "HapiAdapter",
    multiple: true,
    register: (server) => {
      if (!useOnPreResponse) {
        server.route({
          method: "*",
          path,
          handler: catchAllRoute,
        });
      } else {
        // The payload (aka POST request body) doesn't seem to be available at `onPreResponse`.
        server.ext("onPreResponse", onPreResponse);
      }
    },
  };

  return HapiPlugin;

  async function catchAllRoute(request, h) {
    // TODO re-work this
    if (isAlreadyServed(request)) {
      return h.continue;
    }

    const requestHandlers = getRequestHandlers(handlers);
    const resp = await buildResponse({ requestHandlers, request, h });
    if (resp === null) {
      throw Boom.notFound(null, {});
    }
    return resp;
  }

  async function onPreResponse(request, h) {
    // TODO re-work this
    if (isAlreadyServed(request)) {
      return h.continue;
    }

    const requestHandlers = getRequestHandlers(handlers);
    const resp = await buildResponse({ requestHandlers, request, h });
    if (resp === null) {
      return h.continue;
    }
    return resp;
  }
}

async function buildResponse({ requestHandlers, request, h }) {
  assert.usage(requestHandlers);
  assert.usage(request && request.raw && request.raw.req);
  assert.usage(h && h.continue);

  const requestProps = getRequestProps(request);

  for (const requestHandler of requestHandlers) {
    const responseObject = getResponseObject(
      await requestHandler(request, { requestProps }),
      { extractEtagHeader: true }
    );

    if (responseObject === null) {
      continue;
    }

    const {
      body,
      headers,
      redirect,
      statusCode,
      etag,
      contentType,
    } = responseObject;

    const resp = h.response(body);

    Object.entries(headers).forEach(([name, values]) =>
      resp.header(name, values)
    );

    if (etag) {
      const resp_304 = h.entity({ etag });
      if (resp_304) {
        return resp_304;
      }
      resp.etag(etag, { weak: false });
    }

    if (redirect) {
      resp.redirect(redirect);
    }

    if (statusCode) {
      resp.code(statusCode);
    }

    if (contentType) {
      resp.type(contentType);
    }

    return resp;
  }

  return null;
}

function getRequestProps(request) {
  const url = getRequestUrl();
  const method = getRequestMethod();
  const headers = getRequestHeaders();
  const body = getRequestBody();

  const requestProps = {
    url,
    method,
    headers,
    body,
  };
  return requestProps;

  function getRequestUrl() {
    const url = request.url.pathname;
    assert.internal(url.startsWith("/"));
    return url;
  }

  function getRequestMethod() {
    const { method } = request.raw.req;
    assert.internal(url.constructor === String);
    return method;
  }

  function getRequestHeaders() {
    const { headers } = request.raw.req;
    assert.internal(headers.constructor === Object);
    return headers;
  }

  function getRequestBody() {
    const { payload } = request;
    return payload;
  }
}

function isAlreadyServed(request) {
  if (!request.response) {
    return false;
  }

  if (
    !request.response.isBoom ||
    (request.response.output || {}).statusCode !== 404
  ) {
    return true;
  }

  /*
    if( request.response.headers===undefined && request.response.output===undefined ) {
        return false;
    }
    */

  return false;
}
