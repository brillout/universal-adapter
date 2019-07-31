const assert = require('reassert');
const getResponseObject = require('@universal-adapter/server/getResponseObject');
const getRequestHandlers = require('@universal-adapter/server/getRequestHandlers');
const textBody = require('body');

module.exports = ExpressAdapter;

function ExpressAdapter(handlers) {

//Object.assign(universalAdapter, {universalAdapter, addParams, serveContent, onServerClose});

  return universalAdapter;

  async function universalAdapter(req, res, next) {
//  await addParameters({paramHandlers, req});

    const err = await handleResponse(req, res);
    next(err);
  }

  /*
  async function addParams(req, res, next) {
    await addParameters({paramHandlers, req});
    next();
  }

  async function serveContent(req, res, next) {
    const err = await handleResponse(req, res);
    next(err);
  }

  async function onServerClose () {
    for(const cb of onServerCloseHandlers) {
      await cb();
    }
  }
  */

  async function handleResponse(req, res) {
    const requestHandlers = getRequestHandlers(handlers);
    try {
      if( alreadyServed(res) ) {
        return;
      }
      await buildResponse({requestHandlers, req, res});
    } catch(err) {
      return err;
    }
  }
}

async function buildResponse({requestHandlers, req, res}) {
    assert.usage(requestHandlers);
    assert.usage(req);
    assert.usage(res);

    const requestObject = {
      ...req,
      ...(await getRequestProps(req)),
    };

    for(const requestHandler of requestHandlers) {
      const responseObject = (
        getResponseObject(
          await requestHandler(requestObject),
          {extractEtagHeader: false}
        )
      );

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

async function getRequestProps(req) {
  const method = getRequestMethod();
  const headers = getRequestHeaders();
  const body = await getRequestBody();
  const url = getRequestUrl();

  const requestProps = {
    ...req,
    url,
    method,
    headers,
    body,
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

  async function getRequestBody() {
    console.log('b1');
    console.log(req.body);
    console.log('b2');
    /*
 // return req.body || null;
    let resolve;
    const promise = new Promise(r => resolve = r);
    let text = '';
    req.on('data', function(chunk){ text += chunk });
    req.on('end', resolve);
    await promise;
    return text;
    /*/
 // return req.body || null;
    let resolve;
    let reject;
    const promise = new Promise((_resolve, _reject) => {resolve = _resolve;_reject = reject;});
    console.log(111);
    textBody(
      req,
      (err, body) => {
    console.log(122, err, body==='', body, 13);
        if( err ){
          reject(err);
        } else {
          resolve(body);
        }
      }
    );
    return promise;
    //*/
  }
}

function alreadyServed(res) {
  return !!res.headersSent;
}
