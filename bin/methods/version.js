var path = require('path')

var version = function (api, callback) {
  var pkg = require(path.join(__dirname, '/../../package.json'))
  console.log('Name: ' + pkg.name)
  console.log('Description: ' + pkg.description)
  console.log('Version: ' + pkg.version)

  return callback()
}

module.exports = version
