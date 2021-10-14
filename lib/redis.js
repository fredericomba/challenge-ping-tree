var config = require('../config')

var engine = {
  undefined: require('fakeredis'),
  test: require('fakeredis'),
  production: require('redis'),
  development: require('redis')
}[process.env.NODE_ENV]

var redis = module.exports = engine.createClient(config.redis)

redis.healthCheck = function (cb) {
  var now = Date.now().toString()
  redis.set('!healthCheck', now, function (err) {
    if (err) return cb(err)

    redis.get('!healthCheck', function (err, then) {
      if (err) return cb(err)
      if (now !== then.toString()) return cb(new Error('Redis write failed'))

      cb()
    })
  })
}

var referenceProperties = new Set([
  'id',
  'url',
  'value',
  'maxAcceptsPerDay',
  'accept'
])

function checkTarget (target) {
  var { id } = target
  if (!id) {
    throw new Error('provided target does not have an id!')
  }
  id = Number.parseInt(id)
  if (!Number.isInteger(id)) {
    throw new Error('the id must be an integer!')
  }
  var targetProperties = new Set(Object.keys(target))
  for (var property in referenceProperties.entries()) {
    if (!targetProperties.has(property)) {
      throw new Error(`provided target is missing '${property}'!`)
    }
  }
}

redis.saveTarget = function (target) {
  checkTarget(target)
  var { id } = target
  return new Promise((resolve, reject) => {
    redis.set(id, JSON.stringify(target), function (err, value) {
      if (err) {
        reject(err)
      } else {
        resolve(value)
      }
    })
  })
}

redis.loadTarget = function (id) {
  return new Promise((resolve, reject) => {
    redis.get(id, function (err, value) {
      if (err) {
        reject(err)
      } else {
        resolve(value)
      }
    })
  })
}
