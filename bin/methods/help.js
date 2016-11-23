var fs = require('fs')
var path = require('path')

var help = function (api, callback) {
  var content = fs.readFileSync(path.join(__dirname, '/../support/help.txt')).toString()

  var pkg = require(path.join(__dirname, '/../../package.json'))
  console.log('Name: ' + pkg.name)
  console.log('Description: ' + pkg.description)
  console.log('Version: ' + pkg.version)
  console.log('')

  console.log(content)

  return callback()
}

module.exports = help
