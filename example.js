const Fastify = require('fastify')
const fastifyRedis = require('fastify-redis')
const plugin = require('./index')
const nodeRedis = require('redis')
const { join } = require('path')

const { createClient } = nodeRedis

const build = (options) => {
  let instance = Fastify()
  let client = createClient({ host: 'redis-test' })

  instance
    .register(fastifyRedis, { client })
    .register(plugin, { path: join(__dirname, 'test-scripts') })
    .get('/hello/:name', {}, (req, reply) => {
      let { redis, scripts } = instance

      redis.evalsha(scripts.hello.sha, 0, req.params.name, (err, result) => {
        // hello.lua script returns json so we do not need additional parsing
        reply
        // We need to set the correct content-type header
          .type('application/json; charset=utf-8')
          .send(err || result)
      })
    })
  return instance
}

module.exports = build
