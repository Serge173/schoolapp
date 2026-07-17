module.exports = (_req, res) => {
  res.status(200).json({
    ok: true,
    jwt: Boolean(process.env.JWT_SECRET),
    env: process.env.NODE_ENV || null,
  });
};
