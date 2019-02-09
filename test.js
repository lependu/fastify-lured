'use strict'

const t = require('tap')
const Fastify = require('fastify')
const subject = require('./index')
const fastifyRedis = require('fastify-redis')
const nodeRedis = require('redis')
const { join } = require('path')

const { createClient } = nodeRedis
const redisOptions = { host: 'redis-test' }
const pluginOptions = { path: join(__dirname, 'test-scripts') }

t.beforeEach(done => {
  const fastify = Fastify()
  const client = createClient(redisOptions)

  fastify.register(fastifyRedis, { client })

  fastify.ready(err => {
    t.error(err)

    fastify.redis.flushall(() => {
      fastify.close(function (err) {
        t.error(err)
        fastify.redis.quit(function (err) {
          t.error(err)
          done()
        })
      })
    })
  })
})

t.test('@scripts decorator', t => {
  t.plan(5)
  const instance = Fastify()
  const client = createClient(redisOptions)

  instance
    .register(fastifyRedis, { client })
    .register(subject, pluginOptions)
    .ready(err => {
      t.error(err)
      t.equal(
        instance.scripts.hello.sha,
        '66852ce3e63e2192bad383cb2cfab32914f86c5d'
      )
      t.equal(
        instance.scripts.pingPong.sha,
        '89c90208b9e486fdaa1e692e9412bc26172f29dd'
      )
      teardown(t, instance)
    })
})

t.test('script hello.lua (with .lua extension)', t => {
  t.plan(5)
  const instance = Fastify()
  const client = createClient(redisOptions)

  instance
    .register(fastifyRedis, { client })
    .register(subject, pluginOptions)
    .ready(err => {
      t.error(err)
      const { redis, scripts } = instance

      redis.evalsha(scripts.hello.sha, 0, 'world', (err, result) => {
        t.error(err)
        t.equal(result, JSON.stringify({ hello: 'world' }))
        teardown(t, instance)
      })
    })
})

t.test('script ping-pong', t => {
  t.plan(5)
  const instance = Fastify()
  const client = createClient(redisOptions)

  instance
    .register(fastifyRedis, { client })
    .register(subject, pluginOptions)
    .ready(err => {
      t.error(err)
      const { redis, scripts } = instance

      redis.evalsha(scripts.pingPong.sha, 0, (err, result) => {
        t.error(err)
        t.equal(result, 'PONG')
        teardown(t, instance)
      })
    })
})

t.test('errors', t => {
  t.plan(4)

  t.test('no path provided', t => {
    t.plan(3)
    const instance = Fastify()
    const client = createClient(redisOptions)

    instance
      .register(fastifyRedis, { client })
      .register(subject, {})
    instance.listen(0, err => {
      t.equal(err.message, '"path" option is required')
      teardown(t, instance)
    })
  })

  t.test('path is not a string', t => {
    t.plan(3)
    const instance = Fastify()
    const client = createClient(redisOptions)

    instance
      .register(fastifyRedis, { client })
      .register(subject, { path: 42 })
    instance.listen(0, err => {
      t.equal(err.message, '"path" option must be a string')
      teardown(t, instance)
    })
  })

  t.test('path is not absolute path', t => {
    t.plan(3)
    const instance = Fastify()
    const client = createClient(redisOptions)

    instance
      .register(fastifyRedis, { client })
      .register(subject, { path: './not-absolute' })
    instance.listen(0, err => {
      t.equal(err.message, '"path" option must be an absolute path')
      teardown(t, instance)
    })
  })

  t.test('path not exists', t => {
    t.plan(3)
    const instance = Fastify()
    const client = createClient(redisOptions)

    instance
      .register(fastifyRedis, { client })
      .register(subject, { path: join(__dirname, 'not-exists') })
    instance.listen(0, err => {
      t.ok(~err.message.indexOf('no such file or directory'))
      teardown(t, instance)
    })
  })
})

t.test('Example', t => {
  t.plan(6)

  const build = require('./example')
  const instance = build()

  instance.inject({
    method: 'GET',
    url: '/hello/world'
  }, (err, res) => {
    const { statusCode, payload, headers } = res
    t.error(err)
    t.equal(statusCode, 200)
    t.equal(headers['content-type'], 'application/json; charset=utf-8')
    t.deepEqual(JSON.parse(payload), { hello: 'world' })
    teardown(t, instance)
  })
})

function teardown (t, instance) {
  const client = instance.redis
  instance.close(function (err) {
    t.error(err)
    client.quit(function (err) {
      t.error(err)
    })
  })
}
