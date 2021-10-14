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

module.exports = Object.freeze({
  checkTarget
})