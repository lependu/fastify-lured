const Fastify = require('fastify')
const fastifyRedis = require('fastify-redis')
const plugin = require('./index')
const nodeRedis = require('redis')
const { join } = require('path')

const { createClient } = nodeRedis

const build = (options) => {
  const instance = Fastify()
  const client = createClient({ host: 'redis-test' })
  instance
    .register(fastifyRedis, { client })
    .register(plugin, { path: join(__dirname, 'test-scripts') })
    .get('/hello/:name', {}, (req, reply) => {
      const { redis, scripts } = instance

      redis.evalsha(scripts.hello.sha, 0, req.params.name, (err, result) => {
        reply
          // hello.lua script returns JSON which do not need seraialization.
          // Therefore we can bypass fastify internal serialization process.
          // For that we must set the content-type header.
          // See: https://www.fastify.io/docs/latest/Reply/#-serializer-func-
          .type('application/json; charset=utf-8')
          .serializer(function () {
            return result
          })
          .send(err || result)
      })
    })
  return instance
}

module.exports = build
