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

test.serial.cb('[GET] /api/targets', function (t) {
  var url = '/api/targets'
  var optionsGet = {
    method: 'GET',
    encoding: 'json'
  }
  var referenceBody = [
    {
      id: '5',
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
    },
    {
      id: '6',
      url: 'http://domain.com',
      value: '1.50',
      maxAcceptsPerDay: '20',
      accept: {
        geoState: {
          $in: ['tx', 'mi']
        },
        hour: {
          $in: ['10', '11', '12']
        }
      }
    }
  ]
  Promise.all(referenceBody.map(redis.saveTarget))
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

test.serial.cb('[POST] /api/target/2', function (t) {
  var url = '/api/target/2'
  var optionsPost = {
    method: 'POST',
    encoding: 'json'
  }
  var postBody = {
    // notice the absence of the 'id' property
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
  var referenceBody = {
    id: '2',
    ...postBody
  }
  var stream = servertest(server(), url, optionsPost, function (err, res) {
    t.falsy(err, 'no error')
    var { headers, statusCode, body } = res
    t.is(headers['content-type'], 'application/json', '"Content-Type" must be "application/json"')
    t.is(statusCode, 200)
    t.is(typeof body === 'object', true, 'body should be an object')
    t.deepEqual(body, referenceBody, 'body should be deeply equal to referenceBody')
    redis.loadTarget(body.id)
      .then((json) => {
        var body = JSON.parse(json)
        t.deepEqual(body, referenceBody, 'body should be deeply equal to referenceBody')
        t.end()
      })
      .catch((err) => {
        t.fail(err.toString())
        t.end()
      })
  })
  stream.write(JSON.stringify(postBody))
  stream.end()
})

test.serial.cb('[POST] /api/targets', function (t) {
  var url = '/api/targets'
  var optionsPost = {
    method: 'POST',
    encoding: 'json'
  }
  var referenceBody = [
    {
      id: '3',
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
    },
    {
      id: '4',
      url: 'http://domain.com',
      value: '1.50',
      maxAcceptsPerDay: '20',
      accept: {
        geoState: {
          $in: ['tx', 'mi']
        },
        hour: {
          $in: ['10', '11', '12']
        }
      }
    }
  ]
  var stream = servertest(server(), url, optionsPost, function (err, res) {
    t.falsy(err, 'no error')
    var { headers, statusCode, body } = res
    t.is(headers['content-type'], 'application/json', '"Content-Type" must be "application/json"')
    t.is(statusCode, 200)
    t.is(typeof body === 'object', true, 'body should be an object')
    t.deepEqual(body, referenceBody, 'body should be deeply equal to referenceBody')
    Promise.all(referenceBody.map(async (target) => {
      var json = await redis.loadTarget(target.id)
      return JSON.parse(json)
    }))
      .then((targets) => {
        t.deepEqual(targets, referenceBody, 'targets should be deeply equal to referenceBody')
        t.end()
      })
      .catch((err) => {
        t.fail(err.toString())
        t.end()
      })
  })
  stream.write(JSON.stringify(referenceBody))
  stream.end()
})

test.serial.cb('[POST][REJECT] /route', function (t) {
  var url = '/route'
  var optionsPost = {
    method: 'POST',
    encoding: 'json'
  }
  var request = {
    geoState: 'ca',
    publisher: 'abc',
    timestamp: '2018-07-19T23:28:59.513Z'
  }
  var referenceBody = { decision: 'reject' }
  var stream = servertest(server(), url, optionsPost, function (err, res) {
    t.falsy(err, 'no error')
    var { headers, statusCode, body } = res
    t.is(headers['content-type'], 'application/json', '"Content-Type" must be "application/json"')
    t.is(statusCode, 200)
    t.is(typeof body === 'object', true, 'body should be an object')
    t.deepEqual(body, referenceBody, 'body should be deeply equal to referenceBody')
    t.end()
  })
  stream.write(JSON.stringify(request))
  stream.end()
})

test.serial.cb('[POST][ACCEPT] /route', function (t) {
  var url = '/route'
  var optionsPost = {
    method: 'POST',
    encoding: 'json'
  }
  var request = {
    geoState: 'ny',
    publisher: 'abc',
    timestamp: '2018-07-19T14:28:59.513Z'
  }
  var referenceBody = { decision: 'accept' }
  var stream = servertest(server(), url, optionsPost, function (err, res) {
    t.falsy(err, 'no error')
    var { headers, statusCode, body } = res
    t.is(headers['content-type'], 'application/json', '"Content-Type" must be "application/json"')
    t.is(statusCode, 200)
    t.is(typeof body === 'object', true, 'body should be an object')
    t.deepEqual(body, referenceBody, 'body should be deeply equal to referenceBody')
    t.end()
  })
  stream.write(JSON.stringify(request))
  stream.end()
})
