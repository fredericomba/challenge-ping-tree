var redis = require('../lib/redis')

function genericError (res, err) {
  res.statusCode = 500
  res.setHeader('Content-Type', 'text/plain;charset=utf-8')
  res.write(err.toString())
  res.end()
}

function addChunk (accumulator, chunk) {
  if (chunk instanceof Buffer) {
    chunk = chunk.toString()
  }
  if (typeof chunk === 'string') {
    accumulator.push(chunk)
  }
}

function readBody (req, handleBody, handleError) {
  var accumulator = []
  req.on('data', (data) => {
    addChunk(accumulator, data)
  })
  req.on('end', (data) => {
    addChunk(accumulator, data)
    var body = accumulator.join('')
    handleBody(body)
  })
  req.on('error', (err) => {
    handleError(err)
  })
}

// METHOD: 'GET', ROUTE: '/api/targets'
function targetsGet (req, res) {
  // TODO: '[GET] /api/targets'
}

// METHOD: 'POST', ROUTE: '/api/targets'
function targetsPost (req, res) {
  // TODO: '[POST] /api/targets'
}

// METHOD: 'GET', ROUTE: '/api/target/:id'
function singleTargetGet (req, res) {
  var id = req.url.substring('/api/target/'.length)
  redis.loadTarget(id)
    .then((json) => {
      res.statusCode = 200
      res.setHeader('Content-Type', 'application/json')
      res.write(json)
      res.end()
    })
    .catch((error) => {
      genericError(res, error)
    })
}

// METHOD: 'POST', ROUTE: '/api/target/:id'
function singleTargetPost (req, res) {
  var id = req.url.substring('/api/target/'.length)
  function handleBody (body) {
    var target = JSON.parse(body)
    target.id = id
    redis.saveTarget(target)
      .then(() => {
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        res.write(JSON.stringify(target))
        res.end()
      })
      .catch((err) => {
        genericError(res, err)
      })
  }
  function handleError (err) {
    genericError(res, err)
  }
  readBody(req, handleBody, handleError)
}

// METHOD: 'POST', ROUTE: '/route'
function routePost (req, res) {
  // TODO: '[POST] /route'
}

module.exports = function createServer () {
  function targets (req, res) {
    switch (req.method) {
      case 'get':
      case 'GET': {
        targetsGet(req, res)
        break
      }
      case 'post':
      case 'POST': {
        targetsPost(req, res)
        break
      }
      default: {
        genericError(req, res)
        break
      }
    }
  }
  function singleTarget (req, res) {
    switch (req.method) {
      case 'get':
      case 'GET': {
        singleTargetGet(req, res)
        break
      }
      case 'post':
      case 'POST': {
        singleTargetPost(req, res)
        break
      }
      default: {
        genericError(req, res)
        break
      }
    }
  }
  function route (req, res) {
    switch (req.method) {
      case 'post':
      case 'POST': {
        routePost(req, res)
        break
      }
      default: {
        genericError(req, res)
        break
      }
    }
  }
  var handlers = { targets, singleTarget, route }
  return { handlers }
}
