const serverless = require('serverless-http');
const { boot } = require('../server/_boot');

let handlerPromise;

module.exports = async (req, res) => {
  if (!handlerPromise) {
    handlerPromise = boot().then((app) => serverless(app));
  }
  const handler = await handlerPromise;
  return handler(req, res);
};
