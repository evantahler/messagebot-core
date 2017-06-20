var path = require('path')

module.exports = {
  name: 'messagebot version',
  description: 'show messagebot version',

  run: function (api, data, next) {
    var pkg = require(path.join(__dirname, '/../../package.json'))
    console.log('Name: ' + pkg.name)
    console.log('Description: ' + pkg.description)
    console.log('Version: ' + pkg.version)

    next(null)
  }
}
