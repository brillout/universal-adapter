const assert = require('@brillout/reassert');
const hapi = require('@universal-adapters/hapi');
const express = require('@universal-adapters/express');
const koa = require('@universal-adapters/koa');
const getUrlProps = require('@brillout/url-props');

module.exports = getRequestProps;

function getRequestProps(reqObject) {
  assert.usage(reqObject && reqObject instanceof Object);

  return requestProps = (
    alreadyAdapted_getRequestProps(reqObject) ||
    hapi.getRequestProps(reqObject) ||
    koa.getRequestProps(reqObject) ||
    express.getRequestProps(reqObject)
  );

  if( requestProps===undefined ){
    return undefined;
  }

  assert.internal(isRequestProps(requestProps));

  const urlProps = getRequestProps(requestProps.url);

  return {
    ...requestProps,
    urlProps,
  };
}

function alreadyAdapted_getRequestProps(reqObject) {
  if( !isRequestProps(reqObject) ){
    return undefined;
  }
  const  {url, method, headers, headerList, body} = reqObject;
  return {url, method, headers, headerList, body};
}

function isRequestProps(reqObject) {
  const {
    url,
    method,
    headers,
    headerList,
    body,
  } = requestProps;
  return (
    url && url.constructor===String &&
    method && method.constructor===String &&
    headers && headers.constructor===Object &&
    headerList && headerList.constructor===Array &&
    (body===null || (body && body.constructor===String))
  );
}
