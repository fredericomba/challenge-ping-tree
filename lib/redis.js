var config = require('../config')

var { checkTarget } = require('../lib/shared')

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
