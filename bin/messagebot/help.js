
var fs = require('fs')
var path = require('path')
var content = fs.readFileSync(path.join(__dirname, '/../support/help.txt')).toString()
var pkg = require(path.join(__dirname, '/../../package.json'))

module.exports = {
  name: 'messagebot help',
  description: 'messagebot help',

  run: function (api, data, next) {
    api.log('Name: ' + pkg.name)
    api.log('Description: ' + pkg.description)
    api.log('Version: ' + pkg.version)
    api.log('')

    api.log(content)

    next(null)
  }
}
