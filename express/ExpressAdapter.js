const assert = require("@brillout/reassert");

const getResponseObject = require("@universal-adapter/server/getResponseObject");
const getRequestHandlers = require("@universal-adapter/server/getRequestHandlers");

module.exports = ExpressAdapter;

function ExpressAdapter(handlers) {
  return universalAdapter;

  async function universalAdapter(req, res, next) {
    const responseBuilt = await handleResponse(req, res);

    assert.internal([true, false].includes(responseBuilt) || responseBuilt.err);
    if (responseBuilt === false) {
      next();
      return;
    }
    if (responseBuilt === true) {
      return;
    }
    if (responseBuilt.err) {
      next(responseBuilt.err);
      return;
    }
    assert.internal(false);
  }

  async function handleResponse(req, res) {
    const requestHandlers = getRequestHandlers(handlers);
    if (alreadyServed(res)) {
      return false;
    }
    return await buildResponse({ requestHandlers, req, res });
  }
}

async function buildResponse({ requestHandlers, req, res }) {
  assert.usage(requestHandlers);
  assert.usage(req);
  assert.usage(res);
  const requestProps = getRequestProps(req);

  for (const requestHandler of requestHandlers) {
    let handlerResult;
    try {
      handlerResult = await requestHandler(req, { requestProps });
    } catch (err) {
      return { err };
    }
    const responseObject = getResponseObject(handlerResult, {
      extractEtagHeader: true,
    });

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

    assert.internal(!res.headersSent);
    Object.entries(headers).forEach(([name, values]) =>
      // res.setHeader() is a native method of Node.js
      //  - https://stackoverflow.com/questions/40840852/difference-between-res-setheader-and-res-header-in-node-js
      //  - https://stackoverflow.com/questions/39397983/how-do-i-set-multiple-http-header-fields-with-the-same-key-in-node-js
      res.setHeader(name, values)
    );

    if (etag) {
      res.set("ETag", '"' + etag + '"');
    }

    if (statusCode) {
      res.status(statusCode);
    }

    if (contentType) {
      res.type(contentType);
    }

    if (redirect) {
      res.redirect(redirect);
    } else {
      res.send(body);
    }

    return true;
  }
  return false;
}

function getRequestProps(req) {
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
    // `req.originalUrl` vs `req.url`: https://stackoverflow.com/questions/24613816/difference-between-req-url-and-req-originalurl-in-express-js-version-4/62635985#62635985
    const url = req.originalUrl;
    assert.internal(url.startsWith("/"));
    return url;
  }

  function getRequestMethod() {
    const { method } = req;
    assert.internal(method.constructor === String);
    return method;
  }

  function getRequestHeaders() {
    const { headers } = req;
    assert.internal(headers.constructor === Object);
    return headers;
  }

  function getRequestBody() {
    const { body } = req;
    return body;
  }
}

function alreadyServed(res) {
  return !!res.headersSent;
}
