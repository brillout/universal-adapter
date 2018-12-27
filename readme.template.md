!MENU_SKIP

# `@universal-adapter`

Like adapters for power outlet, but for JavaScript.

For now, there are only adapters for server frameworks (Express, Hapi, Koa).

## Server adapters

The server adapters allow you to write server code that can work with several server frameworks.

 - Express adapter: `@universal-adapter/express`
 - Hapi adapter: `@universal-adapter/hapi`
 - Koa adapter: `@universal-adapter/koa`

### Example

We define routes `/` and `/hello/{name}` that will work with Express, Hapi, and Koa:

~~~js
!INLINE ./server/example/helloPlug.js
~~~

We can now use `helloPlug` with either Express, Hapi, or Koa:

~~~js
!INLINE ./server/example/express
~~~
~~~js
!INLINE ./server/example/hapi
~~~
~~~js
!INLINE ./server/example/koa
~~~
