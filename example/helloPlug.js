module.exports = helloPlug;

async function helloPlug({url, method}) {
  if( method!=='GET' || !url.startsWith('/hello/') ) {
    return null;
  }
  return {
    body: 'hello '+url.slice('/hello/'.length),
    headers: [
      {name: 'Cache-Control', value: 'public, max-age=31536000, immutable'}
    ]
  };
}
