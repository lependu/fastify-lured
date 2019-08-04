const fp = require('fastify-plugin')
const { isAbsolute, join } = require('path')
const { statSync, readdirSync, readFileSync } = require('fs')
const camelCase = require('camelcase')
const lured = require('lured')

const fastifyLured = (instance, opts, next) => {
  const error = checkDirForErrors(opts.path)
  if (error) return next(error)

  const { redis } = instance
  const scripts = loadScripts(opts.path)

  const scriptManager = lured.create(redis, scripts)
  scriptManager.load(err => {
    if (err) return next(err)
    instance.decorate('scripts', scripts)
    next()
  })
}

const checkDirForErrors = (path) => {
  if (typeof path === 'undefined') {
    return new Error('"path" option is required')
  }
  if (typeof path !== 'string') {
    return new Error('"path" option must be a string')
  }
  if (!isAbsolute(path)) {
    return new Error('"path" option must be an absolute path')
  }

  try {
    statSync(path)
  } catch (err) {
    return err
  }

  return false
}

const loadScripts = (path) => {
  const scriptList = {}
  const files = readdirSync(path)
  files.map(item => {
    if (item.endsWith('.lua')) {
      const name = camelCase(item.replace('.lua', ''))
      scriptList[name] = {
        script: readFileSync(join(path, item), 'utf-8')
      }
    }
  })
  return scriptList
}

module.exports = fp(fastifyLured, {
  fastify: '>=1.x',
  name: 'fastify-lured',
  decorators: {
    fastify: ['redis']
  },
  dependencies: ['fastify-redis']
})
