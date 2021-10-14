process.env.NODE_ENV = 'test'

var test = require('ava')
var servertest = require('servertest')

var server = require('../lib/server')
var redis = require('../lib/redis')

test.serial.cb('healthcheck', function (t) {
  var url = '/health'
  servertest(server(), url, { encoding: 'json' }, function (err, res) {
    t.falsy(err, 'no error')

    t.is(res.statusCode, 200, 'correct statusCode')
    t.is(res.body.status, 'OK', 'status is ok')
    t.end()
  })
})

test.serial.cb('[GET] /api/target/1', function (t) {
  var url = '/api/target/1'
  var optionsGet = {
    method: 'GET',
    encoding: 'json'
  }
  var referenceBody = {
    id: '1',
    url: 'http://example.com',
    value: '0.50',
    maxAcceptsPerDay: '10',
    accept: {
      geoState: {
        $in: ['ca', 'ny']
      },
      hour: {
        $in: ['13', '14', '15']
      }
    }
  }
  redis.saveTarget(referenceBody)
    .then(() => {
      servertest(server(), url, optionsGet, function (err, res) {
        t.falsy(err, 'no error')
        var { headers, statusCode, body } = res
        t.is(headers['content-type'], 'application/json', '"Content-Type" must be "application/json"')
        t.is(statusCode, 200)
        t.is(typeof body === 'object', true, 'body should be an object')
        t.deepEqual(body, referenceBody, 'body should be deeply equal to referenceBody')
        t.end()
      })
    })
    .catch((err) => {
      t.fail(err.toString())
      t.end()
    })
})
