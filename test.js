'use strict'

const t = require('tap')
const Fastify = require('fastify')
const subject = require('./index')
const redis = require('fastify-redis')
const { join } = require('path')

const redisOptions = { host: 'redis-test' }
const pluginOptions = { path: join(__dirname, 'test-scripts') }

t.afterEach(done => {
  let instance = Fastify()
  instance
    .register(redis, redisOptions)
    .ready(() => {
      instance.redis.multi()
        .flushdb()
        .script('flush')
        .exec(err => {
          t.error(err)
          instance.close()
          done()
        })
    })
})

t.test('@scripts decorator', t => {
  t.plan(2)
  let instance = Fastify()
  instance
    .register(redis, redisOptions)
    .register(subject, pluginOptions)
    .ready(() => {
      t.equal(
        instance.scripts.hello.sha,
        '66852ce3e63e2192bad383cb2cfab32914f86c5d'
      )
      t.equal(
        instance.scripts.pingPong.sha,
        '89c90208b9e486fdaa1e692e9412bc26172f29dd'
      )
      instance.close()
    })
})

t.test('script hello.lua (with .lua extension)', t => {
  t.plan(2)
  let instance = Fastify()
  instance
    .register(redis, redisOptions)
    .register(subject, pluginOptions)
    .ready(() => {
      let { redis, scripts } = instance

      redis.evalsha(scripts.hello.sha, 0, 'world', (err, result) => {
        t.error(err)
        t.equal(result, JSON.stringify({ hello: 'world' }))
        instance.close()
      })
    })
})

t.test('script ping-pong', t => {
  t.plan(2)
  let instance = Fastify()
  instance
    .register(redis, redisOptions)
    .register(subject, pluginOptions)
    .ready(() => {
      let { redis, scripts } = instance

      redis.evalsha(scripts.pingPong.sha, 0, (err, result) => {
        t.error(err)
        t.equal(result, 'PONG')
        instance.close()
      })
    })
})

t.test('errors', t => {
  t.plan(4)

  t.test('no path provided', t => {
    t.plan(1)
    let instance = Fastify()
    instance
      .register(redis, redisOptions)
      .register(subject, {})
    instance.listen(0, err => {
      instance.close()
      t.equal(err.message, '"path" option is required')
    })
  })

  t.test('path is not a string', t => {
    t.plan(1)
    let instance = Fastify()
    instance
      .register(redis, redisOptions)
      .register(subject, { path: 42 })
    instance.listen(0, err => {
      instance.close()
      t.equal(err.message, '"path" option must be a string')
    })
  })

  t.test('path is not absolute path', t => {
    t.plan(1)
    let instance = Fastify()
    instance
      .register(redis, redisOptions)
      .register(subject, { path: './not-absolute' })
    instance.listen(0, err => {
      instance.close()
      t.equal(err.message, '"path" option must be an absolute path')
    })
  })

  t.test('path not exists', t => {
    t.plan(1)
    let instance = Fastify()
    instance
      .register(redis, redisOptions)
      .register(subject, { path: join(__dirname, 'not-exists') })
    instance.listen(0, err => {
      instance.close()
      t.ok(~err.message.indexOf('no such file or directory'))
    })
  })
})

t.test('Example', t => {
  t.plan(4)

  let build = require('./example')
  let instance = build()

  instance.inject({
    method: 'GET',
    url: '/hello/world'
  }, (err, res) => {
    let { statusCode, payload, headers } = res
    t.error(err)
    t.equal(statusCode, 200)
    t.equal(headers['content-type'], 'application/json; charset=utf-8')
    t.equal(payload, JSON.stringify({ hello: 'world' }))
  })
  instance.close()
})
