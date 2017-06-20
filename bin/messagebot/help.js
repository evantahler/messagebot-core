'use strict'

var fs = require('fs')
var path = require('path')
var content = fs.readFileSync(path.join(__dirname, '/../support/help.txt')).toString()
var pkg = require(path.join(__dirname, '/../../package.json'))

module.exports = {
  name: 'messagebot help',
  description: 'messagebot help',

  run: function (api, data, next) {
    console.log('Name: ' + pkg.name)
    console.log('Description: ' + pkg.description)
    console.log('Version: ' + pkg.version)
    console.log('')

    console.log(content)

    next(null)
  }
}
