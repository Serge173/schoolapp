const { createServer } = require('@vercel/node');
const { boot } = require('../server/_boot');

let server;

module.exports = async (req, res) => {
  if (!server) {
    await boot();
    server = createServer(require('../server/app'));
  }
  return server(req, res);
};
