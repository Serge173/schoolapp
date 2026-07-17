const { getJwtSecret } = require('../backend/utils/jwtSecret');

module.exports = (_req, res) => {
  res.status(200).json({
    ok: true,
    jwt: Boolean(getJwtSecret()),
    env: process.env.NODE_ENV || null,
  });
};
