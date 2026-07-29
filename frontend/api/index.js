const { handleExpress } = require('./_boot');

/** Rewrite /uploads/* depuis vercel.json */
module.exports = (req, res) => handleExpress(req, res);
