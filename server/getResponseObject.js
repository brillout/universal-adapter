const assert = require("@brillout/reassert");

module.exports = getResponseObject;

function getResponseObject(responseSpec, { extractEtagHeader = false } = {}) {
  if (responseSpec === null) {
    return null;
  }

  Object.keys(responseSpec).forEach((respArg) => {
    const argList = [
      "body",
      "headers",
      "redirect",
      "statusCode",
      "contentType",
    ];
    assert.usage(
      argList.includes(respArg),
      responseSpec,
      Object.keys(responseSpec),
      "Unknown argument `" + respArg + "` in response object printed above.",
      "The list of known arguments is:",
      argList
    );
  });

  const responseObject = {};

  {
    const { body } = responseSpec;
    assert.warning(
      !body || [String, Buffer].includes(body.constructor),
      body,
      body && body.constructor,
      "response `body` is not a String nor a Buffer"
    );
    responseObject.body = body;
  }

  {
    const { headers = {} } = responseSpec;
    assert.usage(headers instanceof Object && !("length" in headers), headers);
    Object.entries(headers).forEach(([_, values]) => {
      assert.usage(
        values &&
          values.constructor === Array &&
          values.every((val) => typeof val === "string"),
        values
      );
    });
    responseObject.headers = headers;
  }

  if (extractEtagHeader) {
    let etag;
    responseObject.headers = Object.entries(responseObject.headers).filter(
      ([name, values]) => {
        const isEtagHeader = name.toLowerCase() === "etag";
        // const isEtagHeader = name==='ETag';
        if (isEtagHeader) {
          assert.warning(values.length === 1, values);
          const val = values[0];
          assert.warning(
            val[0] === '"' && val.slice(-1)[0] === '"',
            "Malformatted etag",
            val
          );
          etag = val.slice(1, -1);
          return false;
        }
        return true;
      }
    );
    responseObject.etag = etag;
  }

  {
    const { redirect } = responseSpec;
    assert.warning(
      redirect === undefined || (redirect && redirect.constructor === String),
      "response `redirect` is not a String",
      { redirect }
    );
    responseObject.redirect = redirect;
  }

  {
    const { contentType } = responseSpec;
    assert.warning(
      contentType === undefined ||
        (contentType && contentType.constructor === String),
      "response `contentType` is not a String",
      { contentType }
    );
    responseObject.contentType = contentType;
  }

  assert.warning(
    !responseObject.body || !responseObject.redirect,
    "The response printed above has both a `body` and a `redirect` which doesn't make sense.",
    "The body will never be shown as the page will be redirected."
  );

  {
    const { statusCode } = responseSpec;
    responseObject.statusCode = statusCode;
  }

  return responseObject;
}
