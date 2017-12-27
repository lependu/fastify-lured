## fastify-lured

[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](http://standardjs.com/)
[![Build Status](https://travis-ci.org/lependu/fastify-lured.svg?branch=master)](https://travis-ci.org/lependu/fastify-lured)
[![Greenkeeper badge](https://badges.greenkeeper.io/lependu/fastify-lured.svg)](https://greenkeeper.io/)
[![Known Vulnerabilities](https://snyk.io/test/github/lependu/fastify-lured/badge.svg)](https://snyk.io/test/github/lependu/fastify-lured)

Simple plugin to preload lua scripts via [fastify-redis](https://github.com/fastify/fastify-redis). Under the hood it scans the directory provided in `path` option and loads the files with [lured](https://github.cm/enobufs/lured).

## Install
```
$ npm i --save fastify-lured
```

## Usage

1. Provide a redis server.
2. Register `fastify-redis` first, then this plugin.

It provides `scripts` [decorator](https://www.fastify.io/docs/latest/Decorators/) object:
```
{
  [lowerCamelCaseFileNameWithoutExt]: {
    script: {String} The string representation of the script.
    sha: {String} Calculated sha of the script.
  }
}
```

```js
const Fastify = require('fastify')
const redis = require('fastify-redis')
const lured = require('./fastify-lured')
const { join } = require('path')

const instance = Fastify()

instance
  .register(redis, { host: 'redis-test' })
  .register(lured, { path: join(__dirname, 'test-scripts') })
  .get('/hello/:name', {}, (req, reply) => {
    let { redis, scripts } = instance

    redis.evalsha(scripts.hello.sha, 0, req.params.name, (err, result) => {
      if (err) throw err
      reply
          // Sets the content-type header.
          .type('application/json; charset=utf-8')
          // hello.lua returns json so we do not need parsing.
          .send(result)
    })
  })
```

## Options

`path` `{String}` *required* It has to be an absolute path to the script directory.

## Caveats

- No recursive file loading.
- Only loads files with `.lua` extension.

## License

Licensed under [MIT](./LICENSE).
