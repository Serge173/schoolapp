const serverless = require('serverless-http');
const { boot } = require('../server/_boot');

let handler;

module.exports = async (req, res) => {
  if (!handler) {
    await boot();
    handler = serverless(require('../server/app'));
  }
  return handler(req, res);
};
