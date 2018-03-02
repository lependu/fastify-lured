const Fastify = require('fastify')
const redis = require('fastify-redis')
const plugin = require('./index')
const { join } = require('path')

const build = (options) => {
  const instance = Fastify()
  instance
    .register(redis, { host: 'redis-test' })
    .register(plugin, { path: join(__dirname, 'test-scripts') })
    .get('/hello/:name', {}, (req, reply) => {
      let { redis, scripts } = instance

      redis.evalsha(scripts.hello.sha, 0, req.params.name, (err, result) => {
        if (err) throw err

        // hello.lua script returns json so we do not need additional parsing
        reply
        // We need to set the correct content-type header
          .type('application/json; charset=utf-8')
          .send(result)
      })
    })
  return instance
}

module.exports = build
