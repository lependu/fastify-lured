## fastify-lured

[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](http://standardjs.com/)
[![Build Status](https://travis-ci.org/lependu/fastify-lured.svg?branch=master)](https://travis-ci.org/lependu/fastify-lured)
[![Greenkeeper badge](https://badges.greenkeeper.io/lependu/fastify-lured.svg)](https://greenkeeper.io/)
[![Known Vulnerabilities](https://snyk.io/test/github/lependu/fastify-lured/badge.svg)](https://snyk.io/test/github/lependu/fastify-lured)
[![Coverage Status](https://coveralls.io/repos/github/lependu/fastify-lured/badge.svg?branch=master)](https://coveralls.io/github/lependu/fastify-lured?branch=master)
![npm](https://img.shields.io/npm/v/fastify-lured.svg)
![npm](https://img.shields.io/npm/dm/fastify-lured.svg)

Simple plugin to preload lua scripts via [fastify-redis](https://github.com/fastify/fastify-redis). Under the hood it scans the directory provided in `path` option and loads the files with [lured](https://github.cm/enobufs/lured).

## Install
```
$ npm i --save fastify-lured
```

## Usage

1. Set up a redis server.
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
const fastifyRedis = require('fastify-redis')
const plugin = require('./index')
const nodeRedis = require('redis')
const { join } = require('path')

const { createClient } = nodeRedis
const instance = Fastify()
const client = createClient({ host: 'redis-test' })

instance
  .register(fastifyRedis, { client })
  .register(lured, { path: join(__dirname, 'test-scripts') })
  .get('/hello/:name', {}, (req, reply) => {
    let { redis, scripts } = instance

    redis.evalsha(scripts.hello.sha, 0, req.params.name, (err, result) => {
      reply
        // Sets the content-type header.
        .type('application/json; charset=utf-8')
        .send(err || JSON.parse(result))
    })
  })
```

## Options

`path` `{String}` *required* It has to be an absolute path to the script directory.

## Caveats

- No recursive file loading.
- Only loads files with `.lua` extension.
- From *`v2.0.0`* you need to pass node-redis client to fastify-redis, because it switched to ioredis as default client. Ioredis `Commander` class provides much better support for lua scripts, so using this plugin makes no sense.

## License

Licensed under [MIT](./LICENSE).
