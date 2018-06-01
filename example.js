const Fastify = require('fastify')
const fastifyRedis = require('fastify-redis')
const plugin = require('./index')
const nodeRedis = require('redis')
const { join } = require('path')

const { createClient } = nodeRedis

const build = (options) => {
  let instance = Fastify()
  let client = createClient({ host: 'redis-test' })
  const opts = {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            hello: { type: 'string' }
          }
        }
      }
    }
  }
  instance
    .register(fastifyRedis, { client })
    .register(plugin, { path: join(__dirname, 'test-scripts') })
    .get('/hello/:name', opts, (req, reply) => {
      let { redis, scripts } = instance

      redis.evalsha(scripts.hello.sha, 0, req.params.name, (err, result) => {
        reply
          .type('application/json; charset=utf-8')
          .send(err || JSON.parse(result))
      })
    })
  return instance
}

module.exports = build
