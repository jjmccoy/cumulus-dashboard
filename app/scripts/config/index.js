'use strict';
const moment = require('moment');

const deploymentConfig = require('./config');

/**
* These are base config values that you can override in your config.js file
**/
const baseConfig = {
  environment: 'development',
  requireEarthdataLogin: false,
  apiRoot: 'https://wjdkfyb6t6.execute-api.us-east-1.amazonaws.com/dev/',
  minCompatibleApiVersion: '1.14.0',

  graphicsPath: '/graphics/',

  // settings for Ace editor
  editorTheme: 'github',
  tabSize: 2,

  // list queries
  pageLimit: 50,

  searchPageLimit: 7,

  // auto-update frequency
  updateInterval: 15000,
  logsUpdateInterval: 10000,

  recent: moment().subtract(1, 'day').format(),

  // delay before UI/store updates after a successful command (ie PUT)
  updateDelay: 1000
};

const config = Object.assign({}, baseConfig, deploymentConfig);
config.apiRoot = config.apiRoot.replace(/\/?$/, '/');

module.exports = config;
