const assert = require('@brillout/reassert');

const getResponseObject = require('@universal-adapter/server/getResponseObject');
const getRequestHandlers = require('@universal-adapter/server/getRequestHandlers');

module.exports = ExpressAdapter;

function ExpressAdapter(handlers) {

  return universalAdapter;

  async function universalAdapter(req, res, next) {
    const responseBuilt = await handleResponse(req, res);

    assert.internal([true, false].includes(responseBuilt) || responseBuilt.err);
    if( responseBuilt===false ) {
      next();
      return;
    }
    if( responseBuilt===true ) {
      return;
    }
    if( responseBuilt.err ) {
      next(err);
      return;
    }
    assert.internal(false);
  }

  async function handleResponse(req, res) {
    const requestHandlers = getRequestHandlers(handlers);
    if( alreadyServed(res) ) {
      return false;
    }
    return await buildResponse({requestHandlers, req, res});
  }
}

async function buildResponse({requestHandlers, req, res}) {
    assert.usage(requestHandlers);
    assert.usage(req);
    assert.usage(res);

    const requestObject = {
      ...req,
      ...getRequestProps(req),
    };

    for(const requestHandler of requestHandlers) {
      let handlerResult;
      try {
        handlerResult = await requestHandler(requestObject);
      } catch(err) {
        return {err};
      }
      const responseObject = getResponseObject(handlerResult, {extractEtagHeader: false});

      if( responseObject === null ) {
        continue;
      }

      const {body, headers, redirect, statusCode/*, etag*/, contentType} = responseObject;

      assert.internal(!res.headersSent);
      headers.forEach(({name, value}) => res.set(name, value));

      if( statusCode ) {
        res.status(statusCode);
      }

      if( contentType ) {
        res.type(contentType);
      }

      if( redirect ) {
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

  const requestProps = {
    url,
    method,
    headers,
  };
  return requestProps;

  function getRequestUrl() {
    // https://stackoverflow.com/questions/10183291/how-to-get-the-full-url-in-express
    const {protocol, originalUrl} = req;
    assert.internal(protocol.startsWith('http'));
    const host = req.get && req.get('host');
    assert.internal(host);
    const url = protocol + '://' + host + originalUrl;
    return url;
  }

  function getRequestMethod() {
    const {method} = req;
    assert.internal(method.constructor===String);
    return method;
  }

  function getRequestHeaders() {
    const {headers} = req;
    assert.internal(headers.constructor===Object);
    return headers;
  }
}

function alreadyServed(res) {
  return !!res.headersSent;
}
