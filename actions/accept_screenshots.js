const path = require('path')
const pathScripts = __dirname
const action = require('./accept_screenshots.json')
const utils = require('../docs/utils')

// console.log(action)
utils.copyScreenshots(action.projectSlug, 'last', 'accepted')
console.log(`done (accepted screenshots ${action.projectSlug})`)